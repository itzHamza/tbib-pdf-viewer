import {
  PdfAnnotatorOptions,
  PdfSource,
  ToolType,
  AnnotationDocument,
  Annotation,
} from './types';
import { setupPdfWorker } from './engine/worker';
import { PdfDocumentLoader } from './engine/pdf-document';
import { PageView } from './engine/page-view';
import { OverlayManager } from './annotations/overlay-manager';
import { CommandManager } from './commands/command-manager';
import { createAnnotationDocument, validateAnnotationDocument } from './export/json';
import { exportPdfWithAnnotations } from './export/pdf-exporter';

export class PdfAnnotator {
  private options: PdfAnnotatorOptions;
  private container: HTMLElement;
  private pagesContainer: HTMLElement;
  private loader: PdfDocumentLoader;
  private commandManager: CommandManager;
  private overlayManager: OverlayManager;
  private pageViews: PageView[] = [];
  private currentScale = 1.0;
  private currentPage = 1;
  private totalPages = 0;
  private intersectionObserver: IntersectionObserver | null = null;
  private isDestroyed = false;

  constructor(options: PdfAnnotatorOptions) {
    this.options = options;
    this.container = options.container;
    this.currentScale = options.initialScale || 1.0;

    // 1. Setup PDF.js worker
    setupPdfWorker(options.workerSrc);

    // 2. Setup internal containers
    this.container.style.position = 'relative';
    this.container.style.overflow = 'auto';

    this.pagesContainer = document.createElement('div');
    this.pagesContainer.className = 'tbib-pdf-pages-wrapper';
    this.pagesContainer.style.display = 'flex';
    this.pagesContainer.style.flexDirection = 'column';
    this.pagesContainer.style.alignItems = 'center';
    this.pagesContainer.style.padding = '20px 0';
    this.container.appendChild(this.pagesContainer);

    // 3. Initialize command & overlay managers
    this.commandManager = new CommandManager();
    this.overlayManager = new OverlayManager(
      this.commandManager,
      (doc) => {
        if (this.options.onChange) {
          this.options.onChange(doc);
        }
      }
    );

    if (options.tool) this.overlayManager.setTool(options.tool);
    if (options.color) this.overlayManager.setColor(options.color);
    if (options.fillColor) this.overlayManager.setFillColor(options.fillColor);
    if (options.opacity !== undefined) this.overlayManager.setOpacity(options.opacity);
    if (options.strokeWidth) this.overlayManager.setStrokeWidth(options.strokeWidth);

    this.loader = new PdfDocumentLoader();

    // 4. Setup Lazy Rendering Observer
    this.setupLazyObserver();

    // 5. Load initial document
    if (options.pdfSrc) {
      this.loadPdf(options.pdfSrc);
    }
  }

  private setupLazyObserver(): void {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return;
    }

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const target = entry.target as HTMLElement;
          const pageNum = parseInt(target.dataset.pageNumber || '1', 10);
          const pageView = this.pageViews.find((p) => p.pageNumber === pageNum);

          if (pageView) {
            if (entry.isIntersecting) {
              pageView.setVisible(true);
              this.currentPage = pageNum;
              if (this.options.onPageChange) {
                this.options.onPageChange(this.currentPage, this.totalPages);
              }
            } else if (this.options.enableLazyRendering) {
              // Can save memory when far away
              pageView.setVisible(false);
            }
          }
        }
      },
      {
        root: this.container,
        rootMargin: '250px 0px',
        threshold: 0.1,
      }
    );
  }

  async loadPdf(src: PdfSource): Promise<void> {
    this.clearPages();

    try {
      const pdfDoc = await this.loader.load(src);
      this.totalPages = pdfDoc.numPages;
      this.currentPage = 1;

      // Create page views placeholders
      for (let i = 1; i <= this.totalPages; i++) {
        const pageProxy = await pdfDoc.getPage(i);
        const pageView = new PageView(i, this.currentScale, {
          onScannedPageDetected: (pageNum) => {
            if (this.options.onScannedPageDetected) {
              this.options.onScannedPageDetected(pageNum);
            }
          },
        });

        pageView.setPageProxy(pageProxy);
        this.pageViews.push(pageView);
        this.pagesContainer.appendChild(pageView.container);
        this.overlayManager.registerPageView(pageView);

        if (this.intersectionObserver) {
          this.intersectionObserver.observe(pageView.container);
        } else {
          // If no IntersectionObserver, render directly
          pageView.setVisible(true);
        }
      }

      // Load initial annotations if provided
      if (this.options.annotations) {
        this.importAnnotations(this.options.annotations);
      }

      if (this.options.onPageChange) {
        this.options.onPageChange(this.currentPage, this.totalPages);
      }
    } catch (error) {
      console.error('Failed to load PDF document:', error);
      throw error;
    }
  }

  private clearPages(): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }

    for (const pageView of this.pageViews) {
      this.overlayManager.unregisterPageView(pageView.pageNumber);
      pageView.destroy();
    }

    this.pageViews = [];
    this.pagesContainer.innerHTML = '';
  }

  setTool(tool: ToolType): void {
    this.overlayManager.setTool(tool);
  }

  setColor(color: string): void {
    this.overlayManager.setColor(color);
  }

  setFillColor(fillColor: string): void {
    this.overlayManager.setFillColor(fillColor);
  }

  setOpacity(opacity: number): void {
    this.overlayManager.setOpacity(opacity);
  }

  setStrokeWidth(width: number): void {
    this.overlayManager.setStrokeWidth(width);
  }

  setZoom(scale: number): void {
    if (scale <= 0.1 || scale > 5) return;
    this.currentScale = scale;

    for (const pageView of this.pageViews) {
      pageView.setScale(scale);
      this.overlayManager.renderPageAnnotations(pageView.pageNumber);
    }
  }

  getZoom(): number {
    return this.currentScale;
  }

  goToPage(pageNumber: number): void {
    if (pageNumber < 1 || pageNumber > this.totalPages) return;
    const pageView = this.pageViews.find((p) => p.pageNumber === pageNumber);
    if (pageView) {
      pageView.container.scrollIntoView({ behavior: 'smooth', block: 'start' });
      this.currentPage = pageNumber;
      if (this.options.onPageChange) {
        this.options.onPageChange(this.currentPage, this.totalPages);
      }
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.goToPage(this.currentPage + 1);
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    }
  }

  getCurrentPage(): number {
    return this.currentPage;
  }

  getPageCount(): number {
    return this.totalPages;
  }

  undo(): boolean {
    const result = this.commandManager.undo();
    this.overlayManager.redrawAll();
    return result;
  }

  redo(): boolean {
    const result = this.commandManager.redo();
    this.overlayManager.redrawAll();
    return result;
  }

  canUndo(): boolean {
    return this.commandManager.canUndo();
  }

  canRedo(): boolean {
    return this.commandManager.canRedo();
  }

  getAnnotations(): Annotation[] {
    return this.overlayManager.getAnnotations();
  }

  exportAnnotations(): AnnotationDocument {
    return createAnnotationDocument(this.overlayManager.getAnnotations());
  }

  importAnnotations(doc: AnnotationDocument): void {
    validateAnnotationDocument(doc);
    this.overlayManager.setAnnotations(doc.annotations);
  }

  async exportPdfWithAnnotations(): Promise<Blob> {
    const rawBytes = await this.loader.getRawBytes();
    const doc = this.exportAnnotations();
    return exportPdfWithAnnotations(rawBytes, doc);
  }

  destroy(): void {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    this.clearPages();
    this.loader.destroy();
    this.commandManager.clear();
    this.pagesContainer.remove();
  }
}
