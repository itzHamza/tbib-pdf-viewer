import * as pdfjsLib from 'pdfjs-dist';

export function setupPdfWorker(customWorkerSrc?: string): void {
  if (customWorkerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = customWorkerSrc;
    return;
  }

  if (typeof window !== 'undefined') {
    const version = pdfjsLib.version || '4.10.38';
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
  }
}

// Auto-configure worker on import to guarantee version match
if (typeof window !== 'undefined') {
  setupPdfWorker();
}
