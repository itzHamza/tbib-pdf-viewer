import React from 'react';
import { PropertiesPanelProps } from '../types';

const STROKE_COLORS = [
  '#1e1e1e',
  '#e03131',
  '#2f9e44',
  '#1971c2',
  '#f08c00',
  '#9c36b5',
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

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  annotator,
  currentColor = '#1e1e1e',
  onColorChange,
  currentFillColor = 'transparent',
  onFillColorChange,
  strokeWidth = 3,
  onStrokeWidthChange,
  opacity = 1.0,
  onOpacityChange,
  style,
}) => {
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

  const handleOpacityChange = (val: number) => {
    if (onOpacityChange) onOpacityChange(val);
    if (annotator) annotator.setOpacity(val);
  };

  return (
    <div
      className="tbib-properties-panel"
      style={{
        width: '210px',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.08)',
        border: '1px solid #e9ecef',
        padding: '12px 14px',
        fontFamily: "'Rubik', sans-serif",
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        zIndex: 50,
        ...style,
      }}
    >
      {/* Stroke Color */}
      <div>
        <div
          style={{
            fontSize: '11px',
            fontWeight: 500,
            color: '#495057',
            marginBottom: '8px',
            textTransform: 'none',
          }}
        >
          Stroke
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
          {STROKE_COLORS.map((c) => {
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
                  border: isSelected ? '2px solid #6965db' : '1px solid #ced4da',
                  boxShadow: isSelected ? '0 0 0 2px #ececf9' : 'none',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'all 0.15s ease',
                }}
              />
            );
          })}
          <label
            title="Custom stroke color"
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              border: '1px solid #ced4da',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              overflow: 'hidden',
              backgroundColor: '#f8f9fa',
            }}
          >
            <i className="fa-solid fa-eye-dropper" style={{ fontSize: '11px', color: '#495057' }} />
            <input
              type="color"
              value={currentColor}
              onChange={(e) => handleColorSelect(e.target.value)}
              style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
            />
          </label>
        </div>
      </div>

      {/* Background / Fill Color */}
      <div>
        <div
          style={{
            fontSize: '11px',
            fontWeight: 500,
            color: '#495057',
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
                  backgroundColor: isTransparent ? '#ffffff' : c,
                  backgroundImage: isTransparent
                    ? 'linear-gradient(45deg, #eee 25%, transparent 25%), linear-gradient(-45deg, #eee 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #eee 75%), linear-gradient(-45deg, transparent 75%, #eee 75%)'
                    : 'none',
                  backgroundSize: '8px 8px',
                  backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
                  border: isSelected ? '2px solid #6965db' : '1px solid #ced4da',
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
              border: '1px solid #ced4da',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              overflow: 'hidden',
              backgroundColor: '#f8f9fa',
            }}
          >
            <i className="fa-solid fa-palette" style={{ fontSize: '11px', color: '#495057' }} />
            <input
              type="color"
              value={currentFillColor === 'transparent' ? '#ffffff' : currentFillColor}
              onChange={(e) => handleFillSelect(e.target.value)}
              style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
            />
          </label>
        </div>
      </div>

      {/* Stroke Width */}
      <div>
        <div
          style={{
            fontSize: '11px',
            fontWeight: 500,
            color: '#495057',
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
                  border: isSelected ? '1px solid #6965db' : '1px solid #e9ecef',
                  backgroundColor: isSelected ? '#ececf9' : '#f8f9fa',
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
                    backgroundColor: isSelected ? '#6965db' : '#495057',
                    borderRadius: '2px',
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Opacity Slider */}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '11px',
            fontWeight: 500,
            color: '#495057',
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
            color: '#868e96',
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
