import type React from 'react';
import type {
  PdfSource,
  AnnotationDocument,
  ToolType,
  PdfAnnotator,
} from '@tbib-pdf-viewer/core';

export interface PdfViewerProps {
  pdfSrc: PdfSource;
  annotations?: AnnotationDocument;
  onChange?: (doc: AnnotationDocument) => void;
  tool?: ToolType;
  color?: string;
  fillColor?: string;
  opacity?: number;
  strokeWidth?: number;
  fontSize?: number;
  zoom?: number;
  theme?: 'light' | 'dark';
  workerSrc?: string;
  className?: string;
  style?: React.CSSProperties;
  enableLazyRendering?: boolean;
  onPageChange?: (currentPage: number, totalPages: number) => void;
  onScannedPageDetected?: (page: number) => void;
  onAnnotatorReady?: (annotator: PdfAnnotator) => void;
  onLoading?: (isLoading: boolean) => void;
  onError?: (error: Error | string) => void;
  renderLoading?: () => React.ReactNode;
  renderError?: (error: string, retry: () => void) => React.ReactNode;
  enablePinchZoom?: boolean;
}

export interface PdfToolbarProps {
  annotator?: PdfAnnotator | null;
  currentTool?: ToolType;
  onToolChange?: (tool: ToolType) => void;
  currentColor?: string;
  onColorChange?: (color: string) => void;
  currentFillColor?: string;
  onFillColorChange?: (fillColor: string) => void;
  strokeWidth?: number;
  onStrokeWidthChange?: (width: number) => void;
  fontSize?: number;
  onFontSizeChange?: (size: number) => void;
  opacity?: number;
  onOpacityChange?: (opacity: number) => void;
  theme?: 'light' | 'dark';
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
  onExportPdf?: () => void;
  isExporting?: boolean;
  onUploadPdf?: (file: File) => void;
  showUpload?: boolean;
  onToggleProperties?: () => void;
  isPropertiesOpen?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export interface PropertiesPanelProps {
  annotator?: PdfAnnotator | null;
  currentTool?: ToolType;
  currentColor?: string;
  onColorChange?: (color: string) => void;
  currentFillColor?: string;
  onFillColorChange?: (fillColor: string) => void;
  strokeWidth?: number;
  onStrokeWidthChange?: (width: number) => void;
  fontSize?: number;
  onFontSizeChange?: (size: number) => void;
  opacity?: number;
  onOpacityChange?: (opacity: number) => void;
  theme?: 'light' | 'dark';
  style?: React.CSSProperties;
}
