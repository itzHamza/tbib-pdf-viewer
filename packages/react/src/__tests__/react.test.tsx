import { describe, it, expect } from 'vitest';
import { PdfViewer } from '../components/PdfViewer';
import { PdfToolbar } from '../components/PdfToolbar';

describe('React package exports', () => {
  it('should export PdfViewer and PdfToolbar components', () => {
    expect(PdfViewer).toBeDefined();
    expect(PdfToolbar).toBeDefined();
  });
});
