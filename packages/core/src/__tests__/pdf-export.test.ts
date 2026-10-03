import { describe, it, expect } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { exportPdfWithAnnotations, parseHexColor } from '../export/pdf-exporter';
import { AnnotationDocument } from '../types';

describe('PDF Export & Flattening', () => {
  it('should parse hex colors accurately', () => {
    expect(parseHexColor('#ff0000')).toEqual({ r: 1, g: 0, b: 0 });
    expect(parseHexColor('#00ff00')).toEqual({ r: 0, g: 1, b: 0 });
    expect(parseHexColor('#0000ff')).toEqual({ r: 0, g: 0, b: 1 });
  });

  it('should export PDF with annotations into a valid PDF Blob', async () => {
    // Generate a minimal PDF doc in memory
    const srcDoc = await PDFDocument.create();
    srcDoc.addPage([500, 700]);
    const srcBytes = await srcDoc.save();

    const annotationDoc: AnnotationDocument = {
      version: 1,
      annotations: [
        {
          id: 'stroke_1',
          type: 'stroke',
          page: 1,
          color: '#ff0000',
          strokeWidth: 4,
          points: [[50, 50], [100, 100], [150, 50]],
          createdAt: 1,
        },
        {
          id: 'hl_1',
          type: 'highlight',
          page: 1,
          color: '#ffeb3b',
          rects: [{ x: 50, y: 150, width: 200, height: 20 }],
          createdAt: 2,
        },
        {
          id: 'shape_rect',
          type: 'rectangle',
          page: 1,
          color: '#2196f3',
          strokeWidth: 2,
          x: 50,
          y: 200,
          width: 100,
          height: 80,
          createdAt: 3,
        },
        {
          id: 'shape_ellipse',
          type: 'ellipse',
          page: 1,
          color: '#4caf50',
          strokeWidth: 2,
          x: 200,
          y: 200,
          width: 80,
          height: 80,
          createdAt: 4,
        },
        {
          id: 'note_1',
          type: 'note',
          page: 1,
          color: '#ff9800',
          x: 100,
          y: 350,
          content: 'Important revision question',
          createdAt: 5,
        },
        {
          id: 'text_1',
          type: 'text',
          page: 1,
          color: '#1e1e1e',
          fontSize: 16,
          x: 100,
          y: 400,
          text: 'Hello TBiB PDF text annotation!',
          createdAt: 6,
        },
        {
          id: 'hl_freehand',
          type: 'highlight',
          page: 1,
          color: '#a3e635',
          points: [[100, 450], [200, 450], [300, 450]],
          strokeWidth: 18,
          createdAt: 7,
        },
      ],
    };

    const blob = await exportPdfWithAnnotations(srcBytes, annotationDoc);
    expect(blob).toBeDefined();
    expect(blob.type).toBe('application/pdf');

    const arrayBuffer = await blob.arrayBuffer();
    const resultDoc = await PDFDocument.load(arrayBuffer);
    expect(resultDoc.getPageCount()).toBe(1);
  });
});
