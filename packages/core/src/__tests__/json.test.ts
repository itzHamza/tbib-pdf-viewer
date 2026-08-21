import { describe, it, expect } from 'vitest';
import { createAnnotationDocument, validateAnnotationDocument } from '../export/json';
import { Annotation } from '../types';

describe('JSON Import/Export', () => {
  it('should create and validate an AnnotationDocument', () => {
    const annotations: Annotation[] = [
      {
        id: 'ann_1',
        type: 'stroke',
        page: 1,
        color: '#ff0000',
        strokeWidth: 3,
        points: [[10, 20], [30, 40]],
        createdAt: 123456,
      },
      {
        id: 'ann_2',
        type: 'note',
        page: 2,
        color: '#ffc107',
        x: 100,
        y: 150,
        content: 'Test note note content',
        createdAt: 123457,
      },
    ];

    const doc = createAnnotationDocument(annotations, 'hash_abc123');
    expect(doc.version).toBe(1);
    expect(doc.pdfHash).toBe('hash_abc123');
    expect(doc.annotations.length).toBe(2);

    expect(validateAnnotationDocument(doc)).toBe(true);
  });

  it('should throw on invalid document schema', () => {
    expect(() => validateAnnotationDocument(null)).toThrow();
    expect(() => validateAnnotationDocument({ version: 2, annotations: [] })).toThrow();
    expect(() =>
      validateAnnotationDocument({
        version: 1,
        annotations: [{ id: '1', type: 'stroke' }], // missing page
      })
    ).toThrow();
  });
});
