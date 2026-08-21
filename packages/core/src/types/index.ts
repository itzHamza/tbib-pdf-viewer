export type ToolType =
  | 'pen'
  | 'highlight'
  | 'rectangle'
  | 'ellipse'
  | 'note'
  | 'select'
  | 'pan';

export type AnnotationType =
  | 'stroke'
  | 'highlight'
  | 'rectangle'
  | 'ellipse'
  | 'note'
  | 'text';

export interface BaseAnnotation {
  id: string;
  type: AnnotationType;
  page: number; // 1-indexed
  color: string;
  opacity?: number; // 0 to 1
  createdAt: number;
  authorId?: string;
}

export interface StrokeAnnotation extends BaseAnnotation {
  type: 'stroke';
  points: [number, number, number?][]; // [x, y, pressure?] in unscaled PDF-space
  strokeWidth: number;
}

export interface HighlightRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface HighlightAnnotation extends BaseAnnotation {
  type: 'highlight';
  rects: HighlightRect[]; // text-selection quads in unscaled PDF-space
  isFreehandFallback?: boolean;
}

export interface ShapeAnnotation extends BaseAnnotation {
  type: 'rectangle' | 'ellipse';
  x: number;
  y: number;
  width: number;
  height: number;
  strokeWidth?: number;
  fillColor?: string;
}

export interface NoteAnnotation extends BaseAnnotation {
  type: 'note';
  x: number;
  y: number;
  content: string;
}

export type Annotation =
  | StrokeAnnotation
  | HighlightAnnotation
  | ShapeAnnotation
  | NoteAnnotation;

export interface AnnotationDocument {
  version: 1;
  pdfHash?: string;
  annotations: Annotation[];
}

export type PdfSource = string | File | Blob | ArrayBuffer | Uint8Array;

export interface PdfAnnotatorOptions {
  container: HTMLElement;
  pdfSrc: PdfSource;
  workerSrc?: string;
  annotations?: AnnotationDocument;
  onChange?: (doc: AnnotationDocument) => void;
  tool?: ToolType;
  color?: string;
  fillColor?: string;
  opacity?: number;
  strokeWidth?: number;
  initialScale?: number;
  enableLazyRendering?: boolean;
  onPageChange?: (currentPage: number, totalPages: number) => void;
  onScannedPageDetected?: (page: number) => void;
}

export interface PageDimensions {
  pageNumber: number;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  scale: number;
}
