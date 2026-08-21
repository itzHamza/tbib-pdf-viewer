import { ShapeAnnotation } from '../types';

export function drawShapeAnnotation(
  ctx: CanvasRenderingContext2D,
  annotation: ShapeAnnotation,
  scale: number
): void {
  const x = annotation.x * scale;
  const y = annotation.y * scale;
  const width = annotation.width * scale;
  const height = annotation.height * scale;
  const strokeWidth = (annotation.strokeWidth || 2) * scale;

  ctx.save();
  ctx.strokeStyle = annotation.color;
  ctx.lineWidth = strokeWidth;

  if (annotation.opacity !== undefined) {
    ctx.globalAlpha = annotation.opacity;
  }

  const hasFill = Boolean(annotation.fillColor && annotation.fillColor !== 'transparent');

  if (hasFill) {
    ctx.fillStyle = annotation.fillColor!;
  }

  if (annotation.type === 'rectangle') {
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    if (hasFill) {
      ctx.fill();
    }
    ctx.stroke();
  } else if (annotation.type === 'ellipse') {
    ctx.beginPath();
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const radiusX = Math.abs(width / 2);
    const radiusY = Math.abs(height / 2);

    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
    if (hasFill) {
      ctx.fill();
    }
    ctx.stroke();
  }

  ctx.restore();
}
