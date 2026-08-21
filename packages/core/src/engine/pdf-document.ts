import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import { PdfSource } from '../types';

export class PdfDocumentLoader {
  private pdfDoc: PDFDocumentProxy | null = null;
  private rawBytes: Uint8Array | null = null;

  async load(src: PdfSource): Promise<PDFDocumentProxy> {
    let loadingTask: pdfjsLib.PDFDocumentLoadingTask;

    if (typeof src === 'string') {
      loadingTask = pdfjsLib.getDocument({ url: src });
      try {
        const response = await fetch(src);
        const buffer = await response.arrayBuffer();
        this.rawBytes = new Uint8Array(buffer);
      } catch {
        // Will fetch on demand from pdfDoc.getData()
      }
    } else if (src instanceof File || src instanceof Blob) {
      const buffer = await src.arrayBuffer();
      // Keep a separate clone so worker postMessage transfer doesn't detach rawBytes
      this.rawBytes = new Uint8Array(buffer.slice(0));
      loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer.slice(0)) });
    } else if (src instanceof ArrayBuffer) {
      this.rawBytes = new Uint8Array(src.slice(0));
      loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(src.slice(0)) });
    } else if (src instanceof Uint8Array) {
      this.rawBytes = src.slice(0);
      loadingTask = pdfjsLib.getDocument({ data: src.slice(0) });
    } else {
      throw new Error('Unsupported pdfSrc format');
    }

    this.pdfDoc = await loadingTask.promise;
    return this.pdfDoc;
  }

  getDocument(): PDFDocumentProxy | null {
    return this.pdfDoc;
  }

  async getPage(pageNumber: number): Promise<PDFPageProxy> {
    if (!this.pdfDoc) {
      throw new Error('PDF document not loaded');
    }
    return this.pdfDoc.getPage(pageNumber);
  }

  getNumPages(): number {
    return this.pdfDoc ? this.pdfDoc.numPages : 0;
  }

  async getRawBytes(): Promise<Uint8Array> {
    if (this.pdfDoc) {
      try {
        const data = await this.pdfDoc.getData();
        if (data && data.length > 0) {
          return data;
        }
      } catch {
        // Fallback to cached rawBytes
      }
    }
    if (this.rawBytes && this.rawBytes.length > 0) {
      return this.rawBytes.slice(0);
    }
    throw new Error('No PDF data available');
  }

  destroy(): void {
    if (this.pdfDoc) {
      this.pdfDoc.destroy();
      this.pdfDoc = null;
    }
    this.rawBytes = null;
  }
}
