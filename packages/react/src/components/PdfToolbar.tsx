import React, { useEffect, useRef, useState } from 'react';
import { ToolType } from '@tbib-pdf-viewer/core';
import { PdfToolbarProps } from '../types';
import { PropertiesPanel } from './PropertiesPanel';

interface ToolItem {
  id: ToolType;
  label: string;
  iconClass: string;
  keyBadge: string;
  hasStyles: boolean;
}

const TOOLS: ToolItem[] = [
  { id: 'pan', label: 'Hand (Pan)', iconClass: 'fa-solid fa-hand', keyBadge: 'H', hasStyles: false },
  { id: 'select', label: 'Selection', iconClass: 'fa-solid fa-arrow-pointer', keyBadge: '1', hasStyles: true },
  { id: 'rectangle', label: 'Rectangle', iconClass: 'fa-regular fa-square', keyBadge: '2', hasStyles: true },
  { id: 'ellipse', label: 'Ellipse', iconClass: 'fa-regular fa-circle', keyBadge: '3', hasStyles: true },
  { id: 'pen', label: 'Draw', iconClass: 'fa-solid fa-pen', keyBadge: '4', hasStyles: true },
  { id: 'highlight', label: 'Highlight', iconClass: 'fa-solid fa-highlighter', keyBadge: '5', hasStyles: true },
  { id: 'text', label: 'Text', iconClass: 'fa-solid fa-font', keyBadge: '6', hasStyles: true },
];

export const PdfToolbar: React.FC<PdfToolbarProps> = ({
  annotator,
  currentTool = 'pen',
  onToolChange,
  currentColor = '#1e1e1e',
  onColorChange,
  currentFillColor = 'transparent',
  onFillColorChange,
  strokeWidth = 3,
  onStrokeWidthChange,
  fontSize = 18,
  onFontSizeChange,
  opacity = 1.0,
  onOpacityChange,
  onExportPdf,
  isExporting = false,
  onUploadPdf,
  showUpload = true,
  isFullscreen = false,
  onToggleFullscreen,
  theme = 'light',
  className,
  style,
}) => {
  const isDark = theme === 'dark';
  const [showProperties, setShowProperties] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close popup on outside click
  useEffect(() => {
    if (!showProperties) return;

    const handleOutside = (e: Event) => {
      const target = e.target as Node;
      // If click/touch is inside our toolbar or properties popup, do nothing
      if (containerRef.current && containerRef.current.contains(target)) {
        return;
      }
      setShowProperties(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowProperties(false);
      }
    };

    // Use bubbling phase without aggressive capture, with small timeout to avoid immediate close on the same event
    const timer = setTimeout(() => {
      window.addEventListener('pointerdown', handleOutside);
      window.addEventListener('touchstart', handleOutside);
      window.addEventListener('keydown', handleKeyDown);
    }, 10);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('pointerdown', handleOutside);
      window.removeEventListener('touchstart', handleOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showProperties]);

  const handleToolClick = (toolItem: ToolItem, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (toolItem.id === currentTool) {
      // 2nd click on already active tool: toggle properties panel
      if (toolItem.hasStyles) {
        setShowProperties((prev) => !prev);
      }
    } else {
      // 1st click: just activate the tool
      if (onToolChange) onToolChange(toolItem.id);
      if (annotator) annotator.setTool(toolItem.id);
      setShowProperties(false);
    }
  };

  const handleToolDoubleClick = (toolItem: ToolItem, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (toolItem.hasStyles) {
      if (toolItem.id !== currentTool) {
        if (onToolChange) onToolChange(toolItem.id);
        if (annotator) annotator.setTool(toolItem.id);
      }
      setShowProperties(true);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (onUploadPdf) {
        onUploadPdf(file);
      } else if (annotator) {
        annotator.loadPdf(file);
      }
    }
    e.target.value = '';
  };

  const handleUndo = () => {
    if (annotator) annotator.undo();
  };

  const handleRedo = () => {
    if (annotator) annotator.redo();
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        maxWidth: '100%',
        zIndex: 50,
      }}
    >
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .tbib-pdf-floating-toolbar::-webkit-scrollbar {
          display: none;
        }
        @media (max-width: 640px) {
          .tbib-key-badge {
            display: none !important;
          }
          .tbib-tool-btn {
            width: 29px !important;
            height: 30px !important;
          }
          .tbib-action-btn {
            width: 26px !important;
            height: 30px !important;
          }
        }
      `}</style>
      <div
        className={`tbib-pdf-floating-toolbar ${className || ''}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          backgroundColor: isDark ? '#1e222d' : '#ffffff',
          borderRadius: '8px',
          padding: '3px 5px',
          boxShadow: isDark ? '0 4px 20px rgba(0, 0, 0, 0.45)' : '0 2px 12px rgba(0, 0, 0, 0.08)',
          border: isDark ? '1px solid #33394b' : '1px solid #e9ecef',
          gap: '3px',
          fontFamily: "'Rubik', sans-serif",
          userSelect: 'none',
          maxWidth: 'calc(100vw - 20px)',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
          ...style,
        }}
      >
        {/* Tool items */}
        <div style={{ display: 'flex', gap: '2px', alignItems: 'center', flexShrink: 0 }}>
          {TOOLS.map((t) => {
            const isActive = currentTool === t.id;
            return (
              <button
                key={t.id}
                type="button"
                className="tbib-tool-btn"
                title={`${t.label} (${t.keyBadge})${isActive && t.hasStyles ? ' - Cliquer à nouveau pour les options' : ''}`}
                onClick={(e) => handleToolClick(t, e)}
                onDoubleClick={(e) => handleToolDoubleClick(t, e)}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '35px',
                  height: '35px',
                  border: isActive
                    ? '1px solid #6965db'
                    : '1px solid transparent',
                  borderRadius: '6px',
                  backgroundColor: isActive
                    ? isDark
                      ? '#2c2b54'
                      : '#ececf9'
                    : 'transparent',
                  color: isActive
                    ? isDark
                      ? '#8581f2'
                      : '#6965db'
                    : isDark
                    ? '#cbd5e1'
                    : '#495057',
                  cursor: 'pointer',
                  padding: 0,
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = isDark ? '#282e3f' : '#f1f3f5';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <i className={t.iconClass} style={{ fontSize: '14px' }} />
                {isActive && t.hasStyles && (
                  <>
                    <span
                      style={{
                        position: 'absolute',
                        bottom: '2px',
                        left: '4px',
                        width: '4px',
                        height: '4px',
                        borderRadius: '50%',
                        backgroundColor: currentColor || '#6965db',
                        pointerEvents: 'none',
                      }}
                    />
                    <svg
                      width="6"
                      height="6"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        position: 'absolute',
                        bottom: '2px',
                        right: '3px',
                        opacity: 0.8,
                        pointerEvents: 'none',
                      }}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </>
                )}
                {!isActive && (
                  <span
                    className="tbib-key-badge"
                    style={{
                      position: 'absolute',
                      right: '2px',
                      bottom: '2px',
                      fontSize: '8px',
                      lineHeight: '1',
                      color: isDark ? '#64748b' : '#adb5bd',
                      fontWeight: 500,
                    }}
                  >
                    {t.keyBadge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div
          style={{
            width: '1px',
            height: '20px',
            backgroundColor: isDark ? '#33394b' : '#e9ecef',
            margin: '0 1px',
            flexShrink: 0,
          }}
        />

        {/* Undo / Redo */}
        <div style={{ display: 'flex', gap: '2px', alignItems: 'center', flexShrink: 0 }}>
          <button
            type="button"
            className="tbib-action-btn"
            title="Undo (Ctrl+Z)"
            onClick={handleUndo}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '30px',
              height: '35px',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: 'transparent',
              color: isDark ? '#cbd5e1' : '#495057',
              cursor: 'pointer',
              padding: 0,
              flexShrink: 0,
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = isDark ? '#282e3f' : '#f1f3f5')
            }
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <i className="fa-solid fa-rotate-left" style={{ fontSize: '13px' }} />
          </button>
          <button
            type="button"
            className="tbib-action-btn"
            title="Redo (Ctrl+Y)"
            onClick={handleRedo}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '30px',
              height: '35px',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: 'transparent',
              color: isDark ? '#cbd5e1' : '#495057',
              cursor: 'pointer',
              padding: 0,
              flexShrink: 0,
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = isDark ? '#282e3f' : '#f1f3f5')
            }
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <i className="fa-solid fa-rotate-right" style={{ fontSize: '13px' }} />
          </button>
        </div>

        {/* Upload Local PDF File Button */}
        {showUpload && (
          <>
            <div
              style={{
                width: '1px',
                height: '20px',
                backgroundColor: isDark ? '#33394b' : '#e9ecef',
                margin: '0 1px',
                flexShrink: 0,
              }}
            />
            <button
              type="button"
              className="tbib-action-btn"
              title="Ouvrir un fichier PDF local"
              onClick={() => fileInputRef.current?.click()}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '30px',
                height: '35px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: 'transparent',
                color: isDark ? '#cbd5e1' : '#495057',
                cursor: 'pointer',
                padding: 0,
                flexShrink: 0,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = isDark ? '#282e3f' : '#f1f3f5')
              }
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
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
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
          </>
        )}

        {/* Export Icon Button with Loading Spinner */}
        {onExportPdf && (
          <>
            <div
              style={{
                width: '1px',
                height: '20px',
                backgroundColor: isDark ? '#33394b' : '#e9ecef',
                margin: '0 1px',
                flexShrink: 0,
              }}
            />
            <button
              type="button"
              title={isExporting ? 'Exporting PDF...' : 'Télécharger le PDF annoté'}
              onClick={onExportPdf}
              disabled={isExporting}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                backgroundColor: isExporting ? (isDark ? '#33394b' : '#dee2e6') : '#6965db',
                color: isExporting ? (isDark ? '#94a3b8' : '#6c757d') : '#ffffff',
                border: 'none',
                borderRadius: '6px',
                cursor: isExporting ? 'not-allowed' : 'pointer',
                flexShrink: 0,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!isExporting) e.currentTarget.style.backgroundColor = '#5854c7';
              }}
              onMouseLeave={(e) => {
                if (!isExporting) e.currentTarget.style.backgroundColor = '#6965db';
              }}
            >
              {isExporting ? (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ animation: 'spin 1s linear infinite' }}
                >
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              ) : (
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              )}
            </button>
          </>
        )}
        {/* Fullscreen Button */}
        {onToggleFullscreen && (
          <>
            <div
              style={{
                width: '1px',
                height: '20px',
                backgroundColor: isDark ? '#33394b' : '#e9ecef',
                margin: '0 1px',
                flexShrink: 0,
              }}
            />
            <button
              type="button"
              className="tbib-action-btn"
              title={isFullscreen ? 'Quitter le plein écran (F11)' : 'Plein écran (F11)'}
              onClick={onToggleFullscreen}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '30px',
                height: '35px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: isFullscreen ? (isDark ? '#2c2b54' : '#ececf9') : 'transparent',
                color: isFullscreen ? (isDark ? '#8581f2' : '#6965db') : (isDark ? '#cbd5e1' : '#495057'),
                cursor: 'pointer',
                padding: 0,
                flexShrink: 0,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!isFullscreen) e.currentTarget.style.backgroundColor = isDark ? '#282e3f' : '#f1f3f5';
              }}
              onMouseLeave={(e) => {
                if (!isFullscreen) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <i className={isFullscreen ? 'fa-solid fa-compress' : 'fa-solid fa-expand'} style={{ fontSize: '13px' }} />
            </button>
          </>
        )}
      </div>

      {/* Style Popover Card directly under the active tool */}
      {showProperties && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: '50%',
            transform: 'translateX(-50%)',
            maxWidth: 'calc(100vw - 24px)',
            zIndex: 60,
          }}
        >
          <PropertiesPanel
            annotator={annotator}
            currentTool={currentTool}
            currentColor={currentColor}
            onColorChange={onColorChange}
            currentFillColor={currentFillColor}
            onFillColorChange={onFillColorChange}
            strokeWidth={strokeWidth}
            onStrokeWidthChange={onStrokeWidthChange}
            fontSize={fontSize}
            onFontSizeChange={onFontSizeChange}
            opacity={opacity}
            onOpacityChange={onOpacityChange}
            theme={theme}
          />
        </div>
      )}
    </div>
  );
};
