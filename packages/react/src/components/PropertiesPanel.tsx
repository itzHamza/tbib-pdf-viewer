import React from 'react';
import { PropertiesPanelProps } from '../types';

const STROKE_COLORS = [
  '#1e1e1e',
  '#ffffff',
  '#e03131',
  '#2f9e44',
  '#1971c2',
  '#f08c00',
  '#9c36b5',
];

const HIGHLIGHT_COLORS = [
  '#ffeb3b',
  '#a3e635',
  '#67e8f9',
  '#f472b6',
  '#fdba74',
  '#c084fc',
];

const FILL_COLORS = [
  'transparent',
  '#ffc9c9',
  '#b2f2bb',
  '#a5d8ff',
  '#ffec99',
  '#e5dbff',
];

const STROKE_WIDTH_OPTIONS = [
  { id: 2, label: 'Thin', height: 2 },
  { id: 4, label: 'Medium', height: 4 },
  { id: 8, label: 'Bold', height: 7 },
];

const FONT_SIZE_OPTIONS = [
  { id: 14, label: 'S' },
  { id: 18, label: 'M' },
  { id: 24, label: 'L' },
  { id: 32, label: 'XL' },
];

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  annotator,
  currentTool = 'pen',
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
  theme = 'light',
  style,
}) => {
  const isDark = theme === 'dark';
  const isTextTool = currentTool === 'text';
  const isHighlightTool = currentTool === 'highlight';
  const isShapeTool = currentTool === 'rectangle' || currentTool === 'ellipse';

  const colorPalette = isHighlightTool ? HIGHLIGHT_COLORS : STROKE_COLORS;

  const handleColorSelect = (color: string) => {
    if (onColorChange) onColorChange(color);
    if (annotator) annotator.setColor(color);
  };

  const handleFillSelect = (fill: string) => {
    if (onFillColorChange) onFillColorChange(fill);
    if (annotator) annotator.setFillColor(fill);
  };

  const handleWidthSelect = (width: number) => {
    if (onStrokeWidthChange) onStrokeWidthChange(width);
    if (annotator) annotator.setStrokeWidth(width);
  };

  const handleFontSizeSelect = (size: number) => {
    if (onFontSizeChange) onFontSizeChange(size);
    if (annotator) (annotator as any).setFontSize?.(size);
  };

  const handleOpacityChange = (val: number) => {
    if (onOpacityChange) onOpacityChange(val);
    if (annotator) annotator.setOpacity(val);
  };

  return (
    <div
      className="tbib-properties-panel"
      style={{
        width: '210px',
        backgroundColor: isDark ? '#1e222d' : '#ffffff',
        borderRadius: '8px',
        boxShadow: isDark ? '0 8px 24px rgba(0, 0, 0, 0.45)' : '0 4px 14px rgba(0, 0, 0, 0.08)',
        border: isDark ? '1px solid #33394b' : '1px solid #e9ecef',
        padding: '12px 14px',
        fontFamily: "'Rubik', sans-serif",
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        zIndex: 50,
        ...style,
      }}
    >
      {/* Color Selection (Stroke / Text / Highlight) */}
      <div>
        <div
          style={{
            fontSize: '11px',
            fontWeight: 500,
            color: isDark ? '#cbd5e1' : '#495057',
            marginBottom: '8px',
            textTransform: 'none',
          }}
        >
          {isTextTool ? 'Text Color' : isHighlightTool ? 'Highlight Color' : 'Stroke'}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
          {colorPalette.map((c) => {
            const isSelected = currentColor.toLowerCase() === c.toLowerCase();
            return (
              <button
                key={c}
                type="button"
                onClick={() => handleColorSelect(c)}
                title={c}
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  backgroundColor: c,
                  border: isSelected
                    ? '2px solid #6965db'
                    : isDark
                    ? '1px solid #475569'
                    : '1px solid #ced4da',
                  boxShadow: isSelected ? '0 0 0 2px #ececf9' : 'none',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'all 0.15s ease',
                }}
              />
            );
          })}
          <label
            title="Custom color"
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              border: isDark ? '1px solid #475569' : '1px solid #ced4da',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              overflow: 'hidden',
              backgroundColor: isDark ? '#282e3f' : '#f8f9fa',
            }}
          >
            <i
              className="fa-solid fa-eye-dropper"
              style={{ fontSize: '11px', color: isDark ? '#cbd5e1' : '#495057' }}
            />
            <input
              type="color"
              value={currentColor}
              onChange={(e) => handleColorSelect(e.target.value)}
              style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
            />
          </label>
        </div>
      </div>

      {/* Font Size for Text Tool */}
      {isTextTool && (
        <div>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 500,
              color: isDark ? '#cbd5e1' : '#495057',
              marginBottom: '8px',
            }}
          >
            Font size
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {FONT_SIZE_OPTIONS.map((opt) => {
              const isSelected = fontSize === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleFontSizeSelect(opt.id)}
                  title={`${opt.id}px`}
                  style={{
                    flex: 1,
                    height: '28px',
                    borderRadius: '6px',
                    border: isSelected
                      ? '1px solid #6965db'
                      : isDark
                      ? '1px solid #33394b'
                      : '1px solid #e9ecef',
                    backgroundColor: isSelected
                      ? isDark
                        ? '#2c2b54'
                        : '#ececf9'
                      : isDark
                      ? '#282e3f'
                      : '#f8f9fa',
                    color: isSelected
                      ? isDark
                        ? '#8581f2'
                        : '#6965db'
                      : isDark
                      ? '#cbd5e1'
                      : '#495057',
                    fontWeight: 600,
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    padding: 0,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Background / Fill Color (Only for Shapes) */}
      {isShapeTool && (
        <div>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 500,
              color: isDark ? '#cbd5e1' : '#495057',
              marginBottom: '8px',
            }}
          >
            Background
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
            {FILL_COLORS.map((c) => {
              const isSelected = currentFillColor.toLowerCase() === c.toLowerCase();
              const isTransparent = c === 'transparent';
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleFillSelect(c)}
                  title={isTransparent ? 'Transparent' : c}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '6px',
                    backgroundColor: isTransparent ? (isDark ? '#282e3f' : '#ffffff') : c,
                    backgroundImage: isTransparent
                      ? 'linear-gradient(45deg, #444 25%, transparent 25%), linear-gradient(-45deg, #444 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #444 75%), linear-gradient(-45deg, transparent 75%, #444 75%)'
                      : 'none',
                    backgroundSize: '8px 8px',
                    backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
                    border: isSelected
                      ? '2px solid #6965db'
                      : isDark
                      ? '1px solid #475569'
                      : '1px solid #ced4da',
                    boxShadow: isSelected ? '0 0 0 2px #ececf9' : 'none',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {isTransparent && (
                    <div
                      style={{
                        width: '18px',
                        height: '1px',
                        backgroundColor: '#e03131',
                        transform: 'rotate(45deg)',
                      }}
                    />
                  )}
                </button>
              );
            })}
            <label
              title="Custom fill color"
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                border: isDark ? '1px solid #475569' : '1px solid #ced4da',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                overflow: 'hidden',
                backgroundColor: isDark ? '#282e3f' : '#f8f9fa',
              }}
            >
              <i
                className="fa-solid fa-palette"
                style={{ fontSize: '11px', color: isDark ? '#cbd5e1' : '#495057' }}
              />
              <input
                type="color"
                value={currentFillColor === 'transparent' ? '#ffffff' : currentFillColor}
                onChange={(e) => handleFillSelect(e.target.value)}
                style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
              />
            </label>
          </div>
        </div>
      )}

      {/* Stroke Width (for Pen / Shapes) */}
      {!isTextTool && !isHighlightTool && (
        <div>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 500,
              color: isDark ? '#cbd5e1' : '#495057',
              marginBottom: '8px',
            }}
          >
            Stroke width
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {STROKE_WIDTH_OPTIONS.map((opt) => {
              const isSelected =
                Math.abs(strokeWidth - opt.id) < (opt.id === 2 ? 1.5 : opt.id === 4 ? 2 : 5);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleWidthSelect(opt.id)}
                  title={opt.label}
                  style={{
                    flex: 1,
                    height: '28px',
                    borderRadius: '6px',
                    border: isSelected
                      ? '1px solid #6965db'
                      : isDark
                      ? '1px solid #33394b'
                      : '1px solid #e9ecef',
                    backgroundColor: isSelected
                      ? isDark
                        ? '#2c2b54'
                        : '#ececf9'
                      : isDark
                      ? '#282e3f'
                      : '#f8f9fa',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    padding: 0,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      width: '16px',
                      height: `${opt.height}px`,
                      backgroundColor: isSelected
                        ? isDark
                          ? '#8581f2'
                          : '#6965db'
                        : isDark
                        ? '#cbd5e1'
                        : '#495057',
                      borderRadius: '2px',
                    }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Opacity Slider */}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '11px',
            fontWeight: 500,
            color: isDark ? '#cbd5e1' : '#495057',
            marginBottom: '6px',
          }}
        >
          <span>Opacity</span>
          <span>{Math.round(opacity * 100)}%</span>
        </div>
        <input
          type="range"
          min="0.1"
          max="1"
          step="0.05"
          value={opacity}
          onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
          style={{
            width: '100%',
            accentColor: '#6965db',
            cursor: 'pointer',
          }}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '10px',
            color: isDark ? '#64748b' : '#868e96',
            marginTop: '2px',
          }}
        >
          <span>0</span>
          <span>100</span>
        </div>
      </div>
    </div>
  );
};
