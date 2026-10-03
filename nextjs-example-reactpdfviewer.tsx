"use client";

import React, { useEffect, useState } from "react";
import { PdfViewer, PdfToolbar } from "@tbib-pdf-viewer/react";
import type {
  PdfAnnotator,
  ToolType,
  AnnotationDocument,
} from "@tbib-pdf-viewer/core";

export interface PdfReactProps {
  /** PDF URL or source object */
  pdfUrl?: string | File | Blob | Uint8Array;
  /** Alias for pdfUrl */
  pdfSrc?: string | File | Blob | Uint8Array;
  /** Theme: 'light' or 'dark' (defaults to 'dark' for dark mode apps) */
  theme?: "light" | "dark";
  /** Optional initial page to display / scroll to (1-indexed) */
  initialPage?: number;
  /** Optional callback when page changes */
  onPageChange?: (page: number, total: number) => void;
  /** Optional initial annotations or change callback */
  initialAnnotations?: AnnotationDocument;
  onAnnotationChange?: (doc: AnnotationDocument) => void;
  /** Optional custom container styling */
  className?: string;
  style?: React.CSSProperties;
}

export function PdfReact({
  pdfUrl,
  pdfSrc,
  theme = "dark",
  initialPage = 1,
  onPageChange,
  onAnnotationChange,
  className,
  style,
}: PdfReactProps) {
  const [customFile, setCustomFile] = useState<File | null>(null);
  const effectiveSrc = customFile || pdfUrl || pdfSrc || "";
  const isDark = theme === "dark";
  const [annotator, setAnnotator] = useState<PdfAnnotator | null>(null);

  // Active tool & style states
  const [tool, setTool] = useState<ToolType>("pan");
  const [color, setColor] = useState<string>(isDark ? "#ffffff" : "#1e1e1e");
  const [fillColor, setFillColor] = useState<string>("transparent");
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [fontSize, setFontSize] = useState<number>(18);
  const [opacity, setOpacity] = useState<number>(1.0);
  const [zoom, setZoom] = useState<number | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState<number>(initialPage || 1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Navigate to initialPage if initialPage prop changes
  useEffect(() => {
    if (initialPage && annotator && initialPage >= 1) {
      annotator.goToPage(initialPage);
      setCurrentPage(initialPage);
    }
  }, [initialPage, annotator]);

  // PDF Export Handler
  const handleExport = async () => {
    if (!annotator || isExporting) return;
    setIsExporting(true);
    try {
      const blob = await annotator.exportPdfWithAnnotations();
      const pdfBlob = new Blob([blob], { type: "application/pdf" });
      const url = URL.createObjectURL(pdfBlob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "annotated-document.pdf";
      a.setAttribute("download", "annotated-document.pdf");
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        if (a.parentNode) a.parentNode.removeChild(a);
        URL.revokeObjectURL(url);
        setIsExporting(false);
      }, 500);
    } catch (err) {
      console.error("Failed to export PDF:", err);
      setIsExporting(false);
    }
  };

  const currentZoomDisplay = Math.round(
    (zoom ?? annotator?.getZoom() ?? 1.0) * 100,
  );

  return (
    <div
      className={`tbib-pdf-wrapper ${className || ""}`}
      style={{
        position: "relative",
        width: "100%",
        height: "75vh",
        minHeight: "650px",
        backgroundColor: isDark ? "#12141a" : "#f8f9fa",
        borderRadius: "12px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Rubik', sans-serif",
        border: isDark ? "1px solid #2d3345" : "1px solid #e9ecef",
        ...style,
      }}
    >
      {/* Top Floating Toolbar with Responsive Mobile Centering */}
      <div
        style={{
          position: "absolute",
          top: "10px",
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          padding: "0 8px",
          pointerEvents: "none",
          zIndex: 50,
        }}
      >
        <div
          style={{
            pointerEvents: "auto",
            maxWidth: "100%",
            overflowX: "auto",
            scrollbarWidth: "none",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <PdfToolbar
            annotator={annotator}
            currentTool={tool}
            onToolChange={setTool}
            currentColor={color}
            onColorChange={setColor}
            currentFillColor={fillColor}
            onFillColorChange={setFillColor}
            strokeWidth={strokeWidth}
            onStrokeWidthChange={setStrokeWidth}
            fontSize={fontSize}
            onFontSizeChange={setFontSize}
            opacity={opacity}
            onOpacityChange={setOpacity}
            theme={theme}
            onExportPdf={handleExport}
            isExporting={isExporting}
            showUpload={true}
            onUploadPdf={(file) => {
              setCustomFile(file);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* Main Multi-Page PDF Viewer */}
      <div
        style={{ flex: 1, width: "100%", height: "100%", position: "relative" }}
      >
        {effectiveSrc ? (
          <PdfViewer
            pdfSrc={effectiveSrc}
            tool={tool}
            color={color}
            fillColor={fillColor}
            opacity={opacity}
            strokeWidth={strokeWidth}
            fontSize={fontSize}
            zoom={zoom}
            theme={theme}
            enablePinchZoom={true}
            onAnnotatorReady={(instance) => {
              setAnnotator(instance);
              setTotalPages(instance.getPageCount());
              setZoom(instance.getZoom());
              if (initialPage && initialPage > 1) {
                setTimeout(() => {
                  instance.goToPage(initialPage);
                }, 100);
              }
            }}
            onPageChange={(page, total) => {
              setCurrentPage(page);
              setTotalPages(total);
              if (onPageChange) onPageChange(page, total);
            }}
            onChange={(doc) => {
              if (onAnnotationChange) onAnnotationChange(doc);
            }}
          />
        ) : (
          /* Empty State when no document is provided */
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "24px",
              textAlign: "center",
              gap: "12px",
              color: isDark ? "#94a3b8" : "#64748b",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "16px",
                backgroundColor: isDark ? "#1e222d" : "#e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#6965db",
              }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
            </div>
            <div style={{ fontWeight: 600, fontSize: "15px", color: isDark ? "#e2e8f0" : "#1e293b" }}>
              Aucun document sélectionné
            </div>
            <div style={{ fontSize: "13px", maxWidth: "340px" }}>
              Cliquez sur le bouton ci-dessus ou choisissez un fichier PDF depuis votre appareil pour commencer la lecture.
            </div>
            <label
              style={{
                marginTop: "6px",
                padding: "8px 16px",
                borderRadius: "8px",
                backgroundColor: "#6965db",
                color: "#ffffff",
                fontWeight: 500,
                fontSize: "13px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Choisir un fichier PDF
              <input
                type="file"
                accept="application/pdf,.pdf"
                style={{ display: "none" }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setCustomFile(f);
                    setCurrentPage(1);
                  }
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        )}
      </div>

      {/* Bottom Floating Zoom & Navigation Controls with Responsive Mobile Centering */}
      <div
        style={{
          position: "absolute",
          bottom: "10px",
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          padding: "0 8px",
          pointerEvents: "none",
          zIndex: 40,
        }}
      >
        <div
          style={{
            pointerEvents: "auto",
            maxWidth: "100%",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            backgroundColor: isDark ? "#1e222d" : "#ffffff",
            borderRadius: "8px",
            padding: "4px 8px",
            border: isDark ? "1px solid #33394b" : "1px solid #e9ecef",
            boxShadow: isDark
              ? "0 4px 20px rgba(0, 0, 0, 0.45)"
              : "0 2px 10px rgba(0, 0, 0, 0.08)",
            fontSize: "12px",
            color: isDark ? "#cbd5e1" : "#495057",
          }}
        >
        {/* Zoom Controls */}
        <button
          type="button"
          onClick={() => {
            const currentZ = zoom ?? annotator?.getZoom() ?? 1.0;
            const next = Math.max(0.2, +(currentZ - 0.1).toFixed(2));
            setZoom(next);
            annotator?.setZoom(next);
          }}
          title="Zoom Out"
          style={{
            border: "none",
            background: "none",
            cursor: "pointer",
            padding: "3px 5px",
            color: isDark ? "#cbd5e1" : "#495057",
          }}
        >
          <i className="fa-solid fa-minus" />
        </button>

        <span
          onClick={() => {
            annotator?.fitToWidth();
            if (annotator) setZoom(annotator.getZoom());
          }}
          title="Fit to Width"
          style={{
            minWidth: "38px",
            textAlign: "center",
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          {currentZoomDisplay}%
        </span>

        <button
          type="button"
          onClick={() => {
            const currentZ = zoom ?? annotator?.getZoom() ?? 1.0;
            const next = Math.min(3.0, +(currentZ + 0.1).toFixed(2));
            setZoom(next);
            annotator?.setZoom(next);
          }}
          title="Zoom In"
          style={{
            border: "none",
            background: "none",
            cursor: "pointer",
            padding: "3px 5px",
            color: isDark ? "#cbd5e1" : "#495057",
          }}
        >
          <i className="fa-solid fa-plus" />
        </button>

        <div
          style={{
            width: "1px",
            height: "14px",
            backgroundColor: isDark ? "#33394b" : "#dee2e6",
            margin: "0 1px",
          }}
        />

        {/* Page Navigation */}
        <button
          type="button"
          onClick={() => {
            annotator?.prevPage();
          }}
          disabled={currentPage <= 1}
          style={{
            border: "none",
            background: "none",
            cursor: currentPage > 1 ? "pointer" : "default",
            opacity: currentPage > 1 ? 1 : 0.3,
            color: isDark ? "#cbd5e1" : "#495057",
            padding: "3px 5px",
          }}
        >
          <i className="fa-solid fa-chevron-left" />
        </button>

        <span
          style={{
            fontSize: "11px",
            fontWeight: 500,
            minWidth: "34px",
            textAlign: "center",
          }}
        >
          {currentPage} / {totalPages || 1}
        </span>

        <button
          type="button"
          onClick={() => {
            annotator?.nextPage();
          }}
          disabled={currentPage >= totalPages}
          style={{
            border: "none",
            background: "none",
            cursor: currentPage < totalPages ? "pointer" : "default",
            opacity: currentPage < totalPages ? 1 : 0.3,
            color: isDark ? "#cbd5e1" : "#495057",
            padding: "3px 5px",
          }}
        >
          <i className="fa-solid fa-chevron-right" />
        </button>
      </div>
    </div>
  </div>
);
}

export default PdfReact;
