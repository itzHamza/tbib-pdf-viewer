import * as pdfjsLib from 'pdfjs-dist';

let workerConfigured = false;

export function setupPdfWorker(customWorkerSrc?: string): void {
  if (workerConfigured && !customWorkerSrc) {
    return;
  }

  if (customWorkerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = customWorkerSrc;
    workerConfigured = true;
    return;
  }

  // Set default worker src via import.meta.url / bundler resolution without external CDN
  try {
    if (typeof window !== 'undefined') {
      const workerUrl = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
      workerConfigured = true;
    }
  } catch {
    // Fallback if URL constructor fails
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdfjs-dist/build/pdf.worker.min.mjs';
    }
    workerConfigured = true;
  }
}
