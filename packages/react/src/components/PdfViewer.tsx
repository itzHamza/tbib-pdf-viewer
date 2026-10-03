import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  fontSize = 18,
  zoom = 1.0,
  theme = 'light',
  workerSrc,
  className,
  style,
  enableLazyRendering = true,
  enablePinchZoom = true,
  onPageChange,
  onScannedPageDetected,
  onAnnotatorReady,
  onLoading,
  onError,
  renderLoading,
  renderError,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const annotatorRef = useRef<PdfAnnotator | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(pdfSrc));
  const [loadError, setLoadError] = useState<string | null>(null);

  const handleLoadingChange = useCallback(
    (loading: boolean) => {
      setIsLoading(loading);
      if (onLoading) onLoading(loading);
    },
    [onLoading]
  );

  const handleError = useCallback(
    (err: Error | string) => {
      const msg = typeof err === 'string' ? err : err?.message || 'Impossible de charger le document PDF';
      setLoadError(msg);
      if (onError) onError(err);
    },
    [onError]
  );

  // Initialize PdfAnnotator instance on mount / when pdfSrc changes
  useEffect(() => {
    if (!containerRef.current) return;

    setLoadError(null);
    setIsLoading(Boolean(pdfSrc));

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
      theme,
      workerSrc,
      enableLazyRendering,
      onPageChange,
      onScannedPageDetected,
      onLoading: handleLoadingChange,
      onError: handleError,
    });

    annotatorRef.current = annotator;

    if (onAnnotatorReady) {
      onAnnotatorReady(annotator);
    }

    return () => {
      annotator.destroy();
      annotatorRef.current = null;
    };
  }, [pdfSrc, workerSrc, handleLoadingChange, handleError]);

  // Mobile Multi-Touch Pinch-to-Zoom Gesture Handler
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !enablePinchZoom) return;

    let initialDist = 0;
    let initialZoom = 1.0;
    let pinchCenterX = 0;
    let pinchCenterY = 0;
    let isPinching = false;

    const getDistance = (t1: Touch, t2: Touch) => {
      return Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        isPinching = true;
        initialDist = getDistance(e.touches[0], e.touches[1]);
        initialZoom = annotatorRef.current?.getZoom() ?? 1.0;
        pinchCenterX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        pinchCenterY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        annotatorRef.current?.cancelActiveInteraction();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isPinching && e.touches.length === 2 && initialDist > 0 && annotatorRef.current) {
        e.preventDefault();
        const currentDist = getDistance(e.touches[0], e.touches[1]);
        const scaleFactor = currentDist / initialDist;
        const newZoom = Math.max(0.2, Math.min(4.0, +(initialZoom * scaleFactor).toFixed(2)));
        pinchCenterX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        pinchCenterY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        annotatorRef.current.setZoomCentered(newZoom, pinchCenterX, pinchCenterY);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        isPinching = false;
        initialDist = 0;
      }
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: false });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd);
    el.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
      el.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [enablePinchZoom]);

  // Sync theme prop
  useEffect(() => {
    if (annotatorRef.current && theme) {
      annotatorRef.current.setTheme(theme);
    }
  }, [theme]);

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

  // Sync fontSize prop
  useEffect(() => {
    if (annotatorRef.current && fontSize !== undefined) {
      annotatorRef.current.setFontSize(fontSize);
    }
  }, [fontSize]);

  // Sync zoom prop
  useEffect(() => {
    if (annotatorRef.current && zoom !== undefined) {
      annotatorRef.current.setZoom(zoom);
    }
  }, [zoom]);

  const handleRetry = () => {
    setLoadError(null);
    setIsLoading(true);
    if (annotatorRef.current && pdfSrc) {
      annotatorRef.current.loadPdf(pdfSrc).catch((err) => {
        handleError(err);
      });
    }
  };

  const isDark = theme === 'dark';

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Underlying PDF Annotator container */}
      <div
        ref={containerRef}
        className={`tbib-pdf-viewer-root ${className || ''}`}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          overflow: 'auto',
          backgroundColor: isDark ? '#12141a' : '#f8f9fa',
          ...style,
        }}
      />

      {/* Loading Overlay State */}
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isDark ? 'rgba(18, 20, 26, 0.85)' : 'rgba(248, 249, 250, 0.85)',
            backdropFilter: 'blur(4px)',
            zIndex: 35,
            transition: 'opacity 0.2s ease',
          }}
        >
          {renderLoading ? (
            renderLoading()
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                padding: '24px',
                borderRadius: '16px',
                textAlign: 'center',
                color: isDark ? '#e2e8f0' : '#1e293b',
                fontFamily: "'Rubik', sans-serif",
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: isDark ? '#2c2b54' : '#ececf9',
                  color: '#6965db',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(105, 101, 219, 0.2)',
                }}
              >
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ animation: 'pulse 1.5s ease-in-out infinite' }}
                >
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <line x1="10" y1="9" x2="8" y2="9" />
                </svg>
              </div>
              <div style={{ fontWeight: 600, fontSize: '14px' }}>Chargement du document PDF...</div>
              <div style={{ fontSize: '12px', opacity: 0.7 }}>Veuillez patienter quelques instants</div>
            </div>
          )}
        </div>
      )}

      {/* Failed / Error State */}
      {loadError && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isDark ? '#12141a' : '#f8f9fa',
            zIndex: 36,
            padding: '20px',
            fontFamily: "'Rubik', sans-serif",
          }}
        >
          {renderError ? (
            renderError(loadError, handleRetry)
          ) : (
            <div
              style={{
                maxWidth: '400px',
                width: '100%',
                padding: '24px',
                borderRadius: '16px',
                backgroundColor: isDark ? '#1e222d' : '#ffffff',
                border: isDark ? '1px solid #33394b' : '1px solid #e2e8f0',
                boxShadow: isDark
                  ? '0 10px 25px rgba(0, 0, 0, 0.4)'
                  : '0 10px 25px rgba(0, 0, 0, 0.06)',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                color: isDark ? '#e2e8f0' : '#1e293b',
              }}
            >
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2',
                  color: '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>

              <div style={{ fontWeight: 600, fontSize: '15px' }}>
                Impossible de charger le document PDF
              </div>

              <div
                style={{
                  fontSize: '12px',
                  lineHeight: '1.5',
                  color: isDark ? '#94a3b8' : '#64748b',
                }}
              >
                Le fichier est introuvable ou inaccessible. Vérifiez votre connexion ou essayez de recharger.
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={handleRetry}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    backgroundColor: '#6965db',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 500,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#5854c7')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#6965db')}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="23 4 23 10 17 10" />
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                  </svg>
                  Réessayer
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

