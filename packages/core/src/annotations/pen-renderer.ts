import getStroke, { StrokeOptions } from 'perfect-freehand';
import { StrokeAnnotation } from '../types';

export function getSvgPathFromStroke(points: number[][], closed = true): string {
  const len = points.length;
  if (len < 2) {
    return '';
  }

  let a = points[0];
  let b = points[1];
  const c = points[2];

  let result = `M${a[0].toFixed(2)},${a[1].toFixed(2)} Q${b[0].toFixed(2)},${b[1].toFixed(2)} ${((b[0] + c[0]) / 2).toFixed(2)},${((b[1] + c[1]) / 2).toFixed(2)}`;

  for (let i = 2, max = len - 1; i < max; i++) {
    a = points[i];
    b = points[i + 1];
    result += ` t${(b[0] - a[0]).toFixed(2)},${(b[1] - a[1]).toFixed(2)}`;
  }

  if (closed) {
    result += 'Z';
  }

  return result;
}

export function generateStrokeOutline(
  points: [number, number, number?][],
  strokeWidth: number,
  scale = 1
): number[][] {
  const scaledPoints = points.map(([x, y, p]) => [
    x * scale,
    y * scale,
    p !== undefined ? p : 0.5,
  ]);

  const options: StrokeOptions = {
    size: strokeWidth * scale,
    thinning: 0.4,
    smoothing: 0.6,
    streamline: 0.5,
    easing: (t) => t,
    start: {
      taper: 0,
      cap: true,
    },
    end: {
      taper: 0,
      cap: true,
    },
  };

  return getStroke(scaledPoints, options);
}

export function drawStrokeAnnotation(
  ctx: CanvasRenderingContext2D,
  annotation: StrokeAnnotation,
  scale: number
): void {
  if (!annotation.points || annotation.points.length < 2) return;

  const outline = generateStrokeOutline(annotation.points, annotation.strokeWidth, scale);
  if (outline.length === 0) return;

  ctx.save();
  ctx.fillStyle = annotation.color;
  if (annotation.opacity !== undefined) {
    ctx.globalAlpha = annotation.opacity;
  }

  const path = new Path2D();
  if (outline.length > 0) {
    path.moveTo(outline[0][0], outline[0][1]);
    for (let i = 1; i < outline.length; i++) {
      path.lineTo(outline[i][0], outline[i][1]);
    }
    path.closePath();
  }

  ctx.fill(path);
  ctx.restore();
}
