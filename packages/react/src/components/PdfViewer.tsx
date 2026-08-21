import React, { useEffect, useRef } from 'react';
import { PdfAnnotator } from '@tbib-pdf-viewer/core';
import { PdfViewerProps } from '../types';

export const PdfViewer: React.FC<PdfViewerProps> = ({
  pdfSrc,
  annotations,
  onChange,
  tool = 'pen',
  color = '#1e1e1e',
  fillColor = 'transparent',
  opacity = 1.0,
  strokeWidth = 3,
  zoom = 1.0,
  workerSrc,
  className,
  style,
  enableLazyRendering = true,
  onPageChange,
  onScannedPageDetected,
  onAnnotatorReady,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const annotatorRef = useRef<PdfAnnotator | null>(null);

  // Initialize PdfAnnotator instance on mount / when pdfSrc changes
  useEffect(() => {
    if (!containerRef.current) return;

    const annotator = new PdfAnnotator({
      container: containerRef.current,
      pdfSrc,
      annotations,
      onChange,
      tool,
      color,
      fillColor,
      opacity,
      strokeWidth,
      initialScale: zoom,
      workerSrc,
      enableLazyRendering,
      onPageChange,
      onScannedPageDetected,
    });

    annotatorRef.current = annotator;

    if (onAnnotatorReady) {
      onAnnotatorReady(annotator);
    }

    return () => {
      annotator.destroy();
      annotatorRef.current = null;
    };
  }, [pdfSrc, workerSrc]);

  // Sync tool prop
  useEffect(() => {
    if (annotatorRef.current && tool) {
      annotatorRef.current.setTool(tool);
    }
  }, [tool]);

  // Sync color prop
  useEffect(() => {
    if (annotatorRef.current && color) {
      annotatorRef.current.setColor(color);
    }
  }, [color]);

  // Sync fillColor prop
  useEffect(() => {
    if (annotatorRef.current && fillColor !== undefined) {
      annotatorRef.current.setFillColor(fillColor);
    }
  }, [fillColor]);

  // Sync opacity prop
  useEffect(() => {
    if (annotatorRef.current && opacity !== undefined) {
      annotatorRef.current.setOpacity(opacity);
    }
  }, [opacity]);

  // Sync strokeWidth prop
  useEffect(() => {
    if (annotatorRef.current && strokeWidth !== undefined) {
      annotatorRef.current.setStrokeWidth(strokeWidth);
    }
  }, [strokeWidth]);

  // Sync zoom prop
  useEffect(() => {
    if (annotatorRef.current && zoom !== undefined) {
      annotatorRef.current.setZoom(zoom);
    }
  }, [zoom]);

  return (
    <div
      ref={containerRef}
      className={`tbib-pdf-viewer-root ${className || ''}`}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'auto',
        backgroundColor: '#f5f5f7',
        ...style,
      }}
    />
  );
};
