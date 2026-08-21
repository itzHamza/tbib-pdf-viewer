import { Annotation, AnnotationDocument } from '../types';

export function createAnnotationDocument(
  annotations: Annotation[],
  pdfHash?: string
): AnnotationDocument {
  return {
    version: 1,
    pdfHash,
    annotations: JSON.parse(JSON.stringify(annotations)),
  };
}

export function validateAnnotationDocument(doc: any): doc is AnnotationDocument {
  if (!doc || typeof doc !== 'object') {
    throw new Error('Invalid annotation document: Expected an object');
  }

  if (doc.version !== 1) {
    throw new Error(`Unsupported annotation document version: ${doc.version}`);
  }

  if (!Array.isArray(doc.annotations)) {
    throw new Error('Invalid annotation document: "annotations" must be an array');
  }

  for (const ann of doc.annotations) {
    if (!ann || typeof ann !== 'object') {
      throw new Error('Invalid annotation: item is not an object');
    }
    if (typeof ann.id !== 'string') {
      throw new Error('Invalid annotation: missing or invalid "id"');
    }
    if (typeof ann.type !== 'string') {
      throw new Error('Invalid annotation: missing or invalid "type"');
    }
    if (typeof ann.page !== 'number') {
      throw new Error('Invalid annotation: missing or invalid "page"');
    }
  }

  return true;
}
