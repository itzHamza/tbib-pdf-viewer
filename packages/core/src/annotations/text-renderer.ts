import { TextAnnotation } from '../types';

let measureCtx: CanvasRenderingContext2D | null = null;

function getMeasureContext(): CanvasRenderingContext2D {
  if (!measureCtx) {
    const canvas = document.createElement('canvas');
    measureCtx = canvas.getContext('2d')!;
  }
  return measureCtx;
}

export interface TextBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Calculates the bounding box of a TextAnnotation in scaled or unscaled coordinates
 */
export function getTextAnnotationBounds(annotation: TextAnnotation, scale = 1): TextBounds {
  const fontSize = (annotation.fontSize || 16) * scale;
  const fontFamily = annotation.fontFamily || "'Rubik', sans-serif";
  const lines = (annotation.text || '').split('\n');
  const lineHeight = fontSize * 1.25;

  const ctx = getMeasureContext();
  ctx.font = `${fontSize}px ${fontFamily}`;

  let maxWidth = 0;
  for (const line of lines) {
    const width = ctx.measureText(line).width;
    if (width > maxWidth) {
      maxWidth = width;
    }
  }

  // Fallback if measurement produces 0 (e.g. during headless test)
  if (maxWidth === 0) {
    const maxLineLen = Math.max(...lines.map((l) => l.length), 1);
    maxWidth = maxLineLen * (fontSize * 0.6);
  }

  const height = Math.max(lines.length * lineHeight, lineHeight);
  const padding = 4 * scale;

  return {
    x: annotation.x * scale - padding,
    y: annotation.y * scale - padding,
    width: maxWidth + padding * 2,
    height: height + padding * 2,
  };
}

/**
 * Tests whether a point intersects a text annotation
 */
export function isPointInTextAnnotation(
  px: number,
  py: number,
  annotation: TextAnnotation,
  scale = 1
): boolean {
  const bounds = getTextAnnotationBounds(annotation, scale);
  return (
    px >= bounds.x &&
    px <= bounds.x + bounds.width &&
    py >= bounds.y &&
    py <= bounds.y + bounds.height
  );
}

/**
 * Draws a TextAnnotation onto the canvas context
 */
export function drawTextAnnotation(
  ctx: CanvasRenderingContext2D,
  annotation: TextAnnotation,
  scale: number,
  isSelected = false
): void {
  if (!annotation.text) return;

  const fontSize = (annotation.fontSize || 16) * scale;
  const fontFamily = annotation.fontFamily || "'Rubik', sans-serif";
  const lineHeight = fontSize * 1.25;
  const lines = annotation.text.split('\n');

  ctx.save();
  ctx.font = `500 ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = annotation.color || '#1e1e1e';
  ctx.globalAlpha = annotation.opacity !== undefined ? annotation.opacity : 1.0;
  ctx.textBaseline = 'top';

  const x = annotation.x * scale;
  const y = annotation.y * scale;

  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], x, y + i * lineHeight);
  }

  // Draw selection outline when selected
  if (isSelected) {
    const bounds = getTextAnnotationBounds(annotation, scale);
    ctx.strokeStyle = '#6965db';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);

    // Corner handle
    ctx.fillStyle = '#ffffff';
    ctx.setLineDash([]);
    ctx.fillRect(bounds.x + bounds.width - 4, bounds.y + bounds.height - 4, 8, 8);
    ctx.strokeRect(bounds.x + bounds.width - 4, bounds.y + bounds.height - 4, 8, 8);
  }

  ctx.restore();
}
