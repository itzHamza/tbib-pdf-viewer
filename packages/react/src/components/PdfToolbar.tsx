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
  { id: 'note', label: 'Note Pin', iconClass: 'fa-regular fa-note-sticky', keyBadge: '6', hasStyles: true },
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
  opacity = 1.0,
  onOpacityChange,
  onExportPdf,
  className,
  style,
}) => {
  const [showProperties, setShowProperties] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close popup on outside click
  useEffect(() => {
    if (!showProperties) return;

    const handleOutside = (e: Event) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowProperties(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowProperties(false);
      }
    };

    window.addEventListener('pointerdown', handleOutside, true);
    window.addEventListener('mousedown', handleOutside, true);
    window.addEventListener('touchstart', handleOutside, true);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('pointerdown', handleOutside, true);
      window.removeEventListener('mousedown', handleOutside, true);
      window.removeEventListener('touchstart', handleOutside, true);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showProperties]);

  const handleToolClick = (toolItem: ToolItem) => {
    if (toolItem.id === currentTool) {
      // Toggle properties if already selected and tool has styles
      if (toolItem.hasStyles) {
        setShowProperties(!showProperties);
      }
    } else {
      // Switch tool
      if (onToolChange) onToolChange(toolItem.id);
      if (annotator) annotator.setTool(toolItem.id);

      if (toolItem.hasStyles) {
        setShowProperties(true);
      } else {
        setShowProperties(false);
      }
    }
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
        zIndex: 50,
      }}
    >
      <div
        className={`tbib-pdf-floating-toolbar ${className || ''}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          padding: '4px 6px',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
          border: '1px solid #e9ecef',
          gap: '4px',
          fontFamily: "'Rubik', sans-serif",
          userSelect: 'none',
          ...style,
        }}
      >
        {/* Tool items */}
        <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
          {TOOLS.map((t) => {
            const isActive = currentTool === t.id;
            return (
              <button
                key={t.id}
                type="button"
                title={`${t.label} (${t.keyBadge})`}
                onClick={() => handleToolClick(t)}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '36px',
                  height: '36px',
                  border: isActive ? '1px solid #6965db' : '1px solid transparent',
                  borderRadius: '6px',
                  backgroundColor: isActive ? '#ececf9' : 'transparent',
                  color: isActive ? '#6965db' : '#495057',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = '#f1f3f5';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <i className={t.iconClass} style={{ fontSize: '15px' }} />
                <span
                  style={{
                    position: 'absolute',
                    right: '3px',
                    bottom: '2px',
                    fontSize: '9px',
                    lineHeight: '1',
                    color: isActive ? '#6965db' : '#adb5bd',
                    fontWeight: 500,
                  }}
                >
                  {t.keyBadge}
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ width: '1px', height: '22px', backgroundColor: '#e9ecef', margin: '0 2px' }} />

        {/* Undo / Redo */}
        <div style={{ display: 'flex', gap: '2px' }}>
          <button
            type="button"
            title="Undo (Ctrl+Z)"
            onClick={handleUndo}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '36px',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: 'transparent',
              color: '#495057',
              cursor: 'pointer',
              padding: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f3f5')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <i className="fa-solid fa-rotate-left" style={{ fontSize: '14px' }} />
          </button>
          <button
            type="button"
            title="Redo (Ctrl+Y)"
            onClick={handleRedo}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '36px',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: 'transparent',
              color: '#495057',
              cursor: 'pointer',
              padding: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f3f5')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <i className="fa-solid fa-rotate-right" style={{ fontSize: '14px' }} />
          </button>
        </div>

        {onExportPdf && (
          <>
            <div style={{ width: '1px', height: '22px', backgroundColor: '#e9ecef', margin: '0 2px' }} />
            <button
              type="button"
              title="Export Annotated PDF"
              onClick={onExportPdf}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                height: '32px',
                padding: '0 10px',
                backgroundColor: '#6965db',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 500,
                fontFamily: "'Rubik', sans-serif",
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#5854c7')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#6965db')}
            >
              <i className="fa-solid fa-arrow-down-to-bracket" style={{ fontSize: '13px' }} />
              <span>Export</span>
            </button>
          </>
        )}
      </div>

      {/* Style Popover Card directly under the active tool, dismissible on click-outside */}
      {showProperties && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: '0',
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
            opacity={opacity}
            onOpacityChange={onOpacityChange}
          />
        </div>
      )}
    </div>
  );
};
