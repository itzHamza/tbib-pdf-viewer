import React, { useState, useEffect, useRef } from 'react';
import { PdfViewer, PdfToolbar } from '@tbib-pdf-viewer/react';
import type {
  PdfSource,
  AnnotationDocument,
  ToolType,
  PdfAnnotator,
} from '@tbib-pdf-viewer/core';
import {
  createEnglishSamplePdf,
  createArabicSamplePdf,
  createScannedSamplePdf,
} from './sample-generator';

export default function App() {
  const [pdfSrc, setPdfSrc] = useState<PdfSource | null>(null);
  const [currentTool, setCurrentTool] = useState<ToolType>('pen');
  const [currentColor, setCurrentColor] = useState<string>('#1e1e1e');
  const [currentFillColor, setCurrentFillColor] = useState<string>('transparent');
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [opacity, setOpacity] = useState<number>(1.0);
  const [zoom, setZoom] = useState<number>(1.0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [annotationDoc, setAnnotationDoc] = useState<AnnotationDocument>({
    version: 1,
    annotations: [],
  });
  const [isPropertiesOpen, setIsPropertiesOpen] = useState<boolean>(true);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isJsonDrawerOpen, setIsJsonDrawerOpen] = useState<boolean>(false);
  const [scannedAlert, setScannedAlert] = useState<string | null>(null);
  const [activeSampleTitle, setActiveSampleTitle] = useState<string>('Multi-Page Exam');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [containerSize, setContainerSize] = useState<'full' | 'inline'>('full');
  const annotatorRef = useRef<PdfAnnotator | null>(null);

  // Load initial sample
  useEffect(() => {
    loadEnglishSample();
  }, []);

  // Global Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (e.key === 'h' || e.key === 'H') setCurrentTool('pan');
      else if (e.key === '1') setCurrentTool('select');
      else if (e.key === '2') setCurrentTool('rectangle');
      else if (e.key === '3') setCurrentTool('ellipse');
      else if (e.key === '4' || e.key === 'p' || e.key === 'P') setCurrentTool('pen');
      else if (e.key === '5') setCurrentTool('highlight');
      else if (e.key === '6' || e.key === 't' || e.key === 'T') setCurrentTool('text');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const loadEnglishSample = async () => {
    setScannedAlert(null);
    setActiveSampleTitle('Multi-Page Exam (English)');
    setIsMenuOpen(false);
    const bytes = await createEnglishSamplePdf();
    setPdfSrc(bytes);
  };

  const loadArabicSample = async () => {
    setScannedAlert(null);
    setActiveSampleTitle('Arabic / RTL Document');
    setIsMenuOpen(false);
    const bytes = await createArabicSamplePdf();
    setPdfSrc(bytes);
  };

  const loadScannedSample = async () => {
    setScannedAlert(null);
    setActiveSampleTitle('Scanned Document');
    setIsMenuOpen(false);
    const bytes = await createScannedSamplePdf();
    setPdfSrc(bytes);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScannedAlert(null);
      setActiveSampleTitle(file.name);
      setIsMenuOpen(false);
      setPdfSrc(file);
    }
  };

  const handleExportPdf = async () => {
    if (!annotatorRef.current) return;
    setIsExporting(true);
    try {
      const blob = await annotatorRef.current.exportPdfWithAnnotations();
      const pdfBlob = new Blob([blob], { type: 'application/pdf' });
      const url = URL.createObjectURL(pdfBlob);

      const safeBaseName = (activeSampleTitle || 'document')
        .replace(/\.pdf$/i, '')
        .replace(/[^a-zA-Z0-9_\u0600-\u06FF-]/g, '_');
      const downloadName = `${safeBaseName}_annotated.pdf`;

      const a = document.createElement('a');
      a.href = url;
      a.download = downloadName;
      a.setAttribute('download', downloadName);
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        if (a.parentNode) a.parentNode.removeChild(a);
        URL.revokeObjectURL(url);
        setIsExporting(false);
      }, 500);
    } catch (err: any) {
      console.error('Failed to export PDF:', err);
      alert('PDF Export Error: ' + (err?.message || err));
      setIsExporting(false);
    }
  };

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(annotationDoc, null, 2));
    alert('Annotation JSON copied to clipboard!');
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100vw',
        height: '100vh',
        backgroundColor: '#e9ecef',
        fontFamily: "'Rubik', sans-serif",
        overflow: 'hidden',
      }}
    >
      {/* Top Navbar Header */}
      <header
        style={{
          width: '100%',
          height: '48px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #dee2e6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          boxSizing: 'border-box',
          zIndex: 40,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontWeight: 700, fontSize: '15px', color: '#6965db', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <i className="fa-solid fa-file-signature" />
            <span>TBiB PDF Viewer</span>
          </div>

          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid #dee2e6',
                backgroundColor: '#f8f9fa',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 500,
                color: '#495057',
              }}
            >
              <i className="fa-solid fa-file-pdf" style={{ color: '#e03131' }} />
              <span>{activeSampleTitle}</span>
              <i className="fa-solid fa-chevron-down" style={{ fontSize: '10px' }} />
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  left: '0',
                  width: '240px',
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid #dee2e6',
                  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.12)',
                  padding: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  zIndex: 100,
                }}
              >
                <button
                  onClick={loadEnglishSample}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 10px',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: activeSampleTitle.includes('Exam') ? '#ececf9' : '#ffffff',
                    color: activeSampleTitle.includes('Exam') ? '#6965db' : '#343a40',
                    fontWeight: 500,
                    fontSize: '12px',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <i className="fa-solid fa-graduation-cap" />
                  <span>Multi-Page Exam (3 Pages)</span>
                </button>
                <button
                  onClick={loadArabicSample}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 10px',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: activeSampleTitle.includes('Arabic') ? '#ececf9' : '#ffffff',
                    color: activeSampleTitle.includes('Arabic') ? '#6965db' : '#343a40',
                    fontWeight: 500,
                    fontSize: '12px',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <i className="fa-solid fa-language" />
                  <span>Arabic / RTL Document</span>
                </button>
                <button
                  onClick={loadScannedSample}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 10px',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: activeSampleTitle.includes('Scanned') ? '#ececf9' : '#ffffff',
                    color: activeSampleTitle.includes('Scanned') ? '#6965db' : '#343a40',
                    fontWeight: 500,
                    fontSize: '12px',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <i className="fa-solid fa-image" />
                  <span>Scanned PDF (No text)</span>
                </button>
                <div style={{ height: '1px', backgroundColor: '#e9ecef', margin: '2px 0' }} />
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    color: '#343a40',
                    fontWeight: 500,
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  <i className="fa-solid fa-folder-open" style={{ color: '#f08c00' }} />
                  <span>Upload PDF...</span>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Viewport Dimension Toggle: Full Window vs Inline 60vw / 80vh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: '#6c757d' }}>Component Size:</span>
          <button
            type="button"
            onClick={() => setContainerSize('full')}
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              borderRadius: '4px',
              border: containerSize === 'full' ? '1px solid #6965db' : '1px solid #dee2e6',
              backgroundColor: containerSize === 'full' ? '#ececf9' : '#ffffff',
              color: containerSize === 'full' ? '#6965db' : '#495057',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Full Window (100%)
          </button>
          <button
            type="button"
            onClick={() => setContainerSize('inline')}
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              borderRadius: '4px',
              border: containerSize === 'inline' ? '1px solid #6965db' : '1px solid #dee2e6',
              backgroundColor: containerSize === 'inline' ? '#ececf9' : '#ffffff',
              color: containerSize === 'inline' ? '#6965db' : '#495057',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Inline (65vw × 82vh)
          </button>
        </div>
      </header>

      {/* Main Container Area */}
      <div
        style={{
          flex: 1,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: containerSize === 'inline' ? '20px' : '0',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        {/* The PDF Viewer Box (Self-contained, responsive inline component) */}
        <div
          style={{
            position: 'relative',
            width: containerSize === 'inline' ? '65vw' : '100%',
            height: containerSize === 'inline' ? '82vh' : '100%',
            backgroundColor: '#f8f9fa',
            borderRadius: containerSize === 'inline' ? '12px' : '0',
            boxShadow: containerSize === 'inline' ? '0 10px 30px rgba(0, 0, 0, 0.15)' : 'none',
            border: containerSize === 'inline' ? '1px solid #ced4da' : 'none',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Top Floating Excalidraw Toolbar with Anchored Properties Window */}
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 50,
            }}
          >
            <PdfToolbar
              annotator={annotatorRef.current}
              currentTool={currentTool}
              onToolChange={setCurrentTool}
              currentColor={currentColor}
              onColorChange={setCurrentColor}
              currentFillColor={currentFillColor}
              onFillColorChange={setCurrentFillColor}
              strokeWidth={strokeWidth}
              onStrokeWidthChange={setStrokeWidth}
              opacity={opacity}
              onOpacityChange={setOpacity}
              onExportPdf={handleExportPdf}
              isExporting={isExporting}
            />
          </div>

          {/* Scanned PDF Notification Banner */}
          {scannedAlert && (
            <div
              style={{
                position: 'absolute',
                top: '56px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 40,
                padding: '6px 14px',
                backgroundColor: '#fff9db',
                color: '#f08c00',
                fontSize: '11px',
                fontWeight: 500,
                borderRadius: '6px',
                border: '1px solid #ffe066',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <i className="fa-solid fa-triangle-exclamation" />
              <span>{scannedAlert}</span>
            </div>
          )}

          {/* PDF Viewer Layer */}
          <div style={{ flex: 1, width: '100%', height: '100%', position: 'relative' }}>
            {pdfSrc && (
              <PdfViewer
                pdfSrc={pdfSrc}
                tool={currentTool}
                color={currentColor}
                fillColor={currentFillColor}
                opacity={opacity}
                strokeWidth={strokeWidth}
                zoom={zoom}
                onChange={(doc) => setAnnotationDoc(doc)}
                onPageChange={(page, total) => {
                  setCurrentPage(page);
                  setTotalPages(total);
                }}
                onScannedPageDetected={(page) => {
                  setScannedAlert(
                    `Page ${page} has no selectable text layer (scanned). Highlighter in freehand fallback mode.`
                  );
                }}
                onAnnotatorReady={(annotator) => {
                  annotatorRef.current = annotator;
                  setTotalPages(annotator.getPageCount());
                }}
              />
            )}
          </div>

          {/* Bottom Middle Floating Zoom & Page Pill */}
          <div
            style={{
              position: 'absolute',
              bottom: '14px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 40,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              padding: '4px 10px',
              border: '1px solid #e9ecef',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)',
              fontSize: '12px',
              color: '#495057',
            }}
          >
            <button
              type="button"
              onClick={() => {
                const next = Math.max(0.25, +(zoom - 0.15).toFixed(2));
                setZoom(next);
                annotatorRef.current?.setZoom(next);
              }}
              title="Zoom Out"
              style={{
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                padding: '4px 6px',
                borderRadius: '4px',
                color: '#495057',
              }}
            >
              <i className="fa-solid fa-minus" />
            </button>

            <span
              onClick={() => {
                setZoom(1.0);
                annotatorRef.current?.setZoom(1.0);
              }}
              title="Reset Zoom (100%)"
              style={{ minWidth: '38px', textAlign: 'center', cursor: 'pointer', fontWeight: 500 }}
            >
              {Math.round(zoom * 100)}%
            </span>

            <button
              type="button"
              onClick={() => {
                const next = Math.min(3.0, +(zoom + 0.15).toFixed(2));
                setZoom(next);
                annotatorRef.current?.setZoom(next);
              }}
              title="Zoom In"
              style={{
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                padding: '4px 6px',
                borderRadius: '4px',
                color: '#495057',
              }}
            >
              <i className="fa-solid fa-plus" />
            </button>

            <div style={{ width: '1px', height: '16px', backgroundColor: '#e9ecef' }} />

            <button
              type="button"
              onClick={() => annotatorRef.current?.prevPage()}
              disabled={currentPage <= 1}
              style={{
                border: 'none',
                background: 'none',
                cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                opacity: currentPage <= 1 ? 0.4 : 1,
                padding: '4px 6px',
                color: '#495057',
              }}
            >
              <i className="fa-solid fa-chevron-left" />
            </button>

            <span style={{ fontWeight: 500, minWidth: '40px', textAlign: 'center' }}>
              {currentPage} / {totalPages}
            </span>

            <button
              type="button"
              onClick={() => annotatorRef.current?.nextPage()}
              disabled={currentPage >= totalPages}
              style={{
                border: 'none',
                background: 'none',
                cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                opacity: currentPage >= totalPages ? 0.4 : 1,
                padding: '4px 6px',
                color: '#495057',
              }}
            >
              <i className="fa-solid fa-chevron-right" />
            </button>
          </div>

          {/* Bottom Right Floating JSON Inspector Drawer Toggle */}
          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              right: '12px',
              zIndex: 40,
            }}
          >
            <button
              type="button"
              onClick={() => setIsJsonDrawerOpen(!isJsonDrawerOpen)}
              title="Toggle JSON Document Inspector"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                padding: '6px 10px',
                border: isJsonDrawerOpen ? '1px solid #6965db' : '1px solid #e9ecef',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 500,
                color: isJsonDrawerOpen ? '#6965db' : '#495057',
              }}
            >
              <i className="fa-solid fa-code" />
              <span>JSON ({annotationDoc.annotations.length})</span>
            </button>
          </div>

          {/* JSON Inspector Slide-over Drawer */}
          {isJsonDrawerOpen && (
            <div
              style={{
                position: 'absolute',
                top: '56px',
                right: '12px',
                bottom: '48px',
                width: '280px',
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                border: '1px solid #e9ecef',
                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.12)',
                zIndex: 60,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '8px 12px',
                  borderBottom: '1px solid #e9ecef',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontWeight: 600,
                  fontSize: '12px',
                  backgroundColor: '#f8f9fa',
                }}
              >
                <span>Live JSON</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={copyJson}
                    title="Copy JSON to clipboard"
                    style={{
                      border: '1px solid #ced4da',
                      backgroundColor: '#ffffff',
                      borderRadius: '4px',
                      padding: '2px 6px',
                      fontSize: '10px',
                      cursor: 'pointer',
                    }}
                  >
                    <i className="fa-regular fa-copy" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsJsonDrawerOpen(false)}
                    style={{
                      border: 'none',
                      background: 'none',
                      fontSize: '12px',
                      cursor: 'pointer',
                      color: '#868e96',
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
              <pre
                style={{
                  flex: 1,
                  margin: 0,
                  padding: '10px',
                  overflow: 'auto',
                  backgroundColor: '#1e1e1e',
                  color: '#d4d4d4',
                  fontFamily: 'monospace',
                  fontSize: '10px',
                  lineHeight: 1.4,
                }}
              >
                {JSON.stringify(annotationDoc, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
