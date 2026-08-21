import type { PDFPageProxy } from 'pdfjs-dist';
import { PageDimensions } from '../types';
import { extractPageTextQuads, PageTextLayerData } from '../annotations/highlight-detector';

export interface PageViewCallbacks {
  onRenderComplete?: (pageNumber: number) => void;
  onScannedPageDetected?: (pageNumber: number) => void;
}

export class PageView {
  public readonly pageNumber: number;
  public readonly container: HTMLElement;
  public readonly pdfCanvas: HTMLCanvasElement;
  public readonly annotationCanvas: HTMLCanvasElement;
  public readonly pdfCtx: CanvasRenderingContext2D;
  public readonly annotationCtx: CanvasRenderingContext2D;

  private pageProxy: PDFPageProxy | null = null;
  private renderTask: any = null;
  private isRendered = false;
  private isRendering = false;
  private scale: number;
  private originalWidth = 0;
  private originalHeight = 0;
  private textLayerData: PageTextLayerData | null = null;
  private callbacks: PageViewCallbacks;
  private isVisible = false;

  constructor(
    pageNumber: number,
    scale: number,
    callbacks: PageViewCallbacks = {}
  ) {
    this.pageNumber = pageNumber;
    this.scale = scale;
    this.callbacks = callbacks;

    // Outer page container
    this.container = document.createElement('div');
    this.container.className = 'tbib-pdf-page-container';
    this.container.dataset.pageNumber = String(pageNumber);
    this.container.style.position = 'relative';
    this.container.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
    this.container.style.backgroundColor = '#ffffff';
    this.container.style.margin = '16px auto';
    this.container.style.userSelect = 'none';

    // Layer 1: PDF Canvas
    this.pdfCanvas = document.createElement('canvas');
    this.pdfCanvas.className = 'tbib-pdf-canvas-layer';
    this.pdfCanvas.style.position = 'absolute';
    this.pdfCanvas.style.top = '0';
    this.pdfCanvas.style.left = '0';
    this.pdfCanvas.style.display = 'block';
    this.pdfCtx = this.pdfCanvas.getContext('2d', { alpha: false })!;

    // Layer 2: Annotation Overlay Canvas
    this.annotationCanvas = document.createElement('canvas');
    this.annotationCanvas.className = 'tbib-annotation-canvas-layer';
    this.annotationCanvas.style.position = 'absolute';
    this.annotationCanvas.style.top = '0';
    this.annotationCanvas.style.left = '0';
    this.annotationCanvas.style.display = 'block';
    this.annotationCanvas.style.touchAction = 'none';
    this.annotationCtx = this.annotationCanvas.getContext('2d', { alpha: true })!;

    this.container.appendChild(this.pdfCanvas);
    this.container.appendChild(this.annotationCanvas);
  }

  setPageProxy(pageProxy: PDFPageProxy): void {
    this.pageProxy = pageProxy;
    const unscaledViewport = pageProxy.getViewport({ scale: 1 });
    this.originalWidth = unscaledViewport.width;
    this.originalHeight = unscaledViewport.height;
    this.updateContainerDimensions();
  }

  setScale(scale: number): void {
    if (this.scale === scale) return;
    this.scale = scale;
    this.updateContainerDimensions();
    if (this.isVisible) {
      this.render();
    } else {
      this.isRendered = false;
    }
  }

  setVisible(visible: boolean): void {
    this.isVisible = visible;
    if (visible && !this.isRendered && !this.isRendering) {
      this.render();
    }
  }

  getDimensions(): PageDimensions {
    return {
      pageNumber: this.pageNumber,
      width: this.originalWidth * this.scale,
      height: this.originalHeight * this.scale,
      originalWidth: this.originalWidth,
      originalHeight: this.originalHeight,
      scale: this.scale,
    };
  }

  getTextLayerData(): PageTextLayerData | null {
    return this.textLayerData;
  }

  private updateContainerDimensions(): void {
    const width = this.originalWidth * this.scale;
    const height = this.originalHeight * this.scale;

    this.container.style.width = `${width}px`;
    this.container.style.height = `${height}px`;
  }

  async render(): Promise<void> {
    if (!this.pageProxy) return;

    if (this.isRendering && this.renderTask) {
      this.renderTask.cancel();
      this.renderTask = null;
    }

    this.isRendering = true;

    const dpr = window.devicePixelRatio || 1;
    const viewport = this.pageProxy.getViewport({ scale: this.scale });

    const width = Math.floor(viewport.width);
    const height = Math.floor(viewport.height);

    // Resize PDF canvas with HiDPI support
    this.pdfCanvas.width = width * dpr;
    this.pdfCanvas.height = height * dpr;
    this.pdfCanvas.style.width = `${width}px`;
    this.pdfCanvas.style.height = `${height}px`;

    // Resize Annotation overlay canvas
    this.annotationCanvas.width = width * dpr;
    this.annotationCanvas.height = height * dpr;
    this.annotationCanvas.style.width = `${width}px`;
    this.annotationCanvas.style.height = `${height}px`;

    const transform = dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null;

    try {
      const renderContext: any = {
        canvasContext: this.pdfCtx,
        transform: transform,
        viewport: viewport,
      };

      this.renderTask = this.pageProxy.render(renderContext);
      await this.renderTask.promise;

      this.isRendered = true;
      this.isRendering = false;

      // Extract text content & detect if page is scanned
      if (!this.textLayerData) {
        this.textLayerData = await extractPageTextQuads(this.pageProxy, viewport);
        if (this.textLayerData.isScanned && this.callbacks.onScannedPageDetected) {
          this.callbacks.onScannedPageDetected(this.pageNumber);
        }
      }

      if (this.callbacks.onRenderComplete) {
        this.callbacks.onRenderComplete(this.pageNumber);
      }
    } catch (err: any) {
      if (err?.name !== 'RenderingCancelledException') {
        console.error(`Error rendering page ${this.pageNumber}:`, err);
      }
      this.isRendering = false;
    }
  }

  screenToPdfPoint(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.annotationCanvas.getBoundingClientRect();
    const pixelX = clientX - rect.left;
    const pixelY = clientY - rect.top;
    return {
      x: pixelX / this.scale,
      y: pixelY / this.scale,
    };
  }

  destroy(): void {
    if (this.renderTask) {
      this.renderTask.cancel();
      this.renderTask = null;
    }
    this.container.remove();
  }
}
