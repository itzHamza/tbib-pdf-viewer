import { NoteAnnotation } from '../types';

export function drawNoteAnnotation(
  ctx: CanvasRenderingContext2D,
  annotation: NoteAnnotation,
  scale: number,
  isSelected = false
): void {
  const x = annotation.x * scale;
  const y = annotation.y * scale;
  const size = 26;
  const radius = 6;

  ctx.save();

  // Subtle shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.18)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 2;

  const color = annotation.color || '#f08c00';

  // Sticker base background (rounded rectangle)
  ctx.beginPath();
  const left = x - size / 2;
  const top = y - size / 2;
  const right = left + size;
  const bottom = top + size;

  ctx.moveTo(left + radius, top);
  ctx.lineTo(right - radius, top);
  ctx.quadraticCurveTo(right, top, right, top + radius);
  ctx.lineTo(right, bottom - radius);
  ctx.quadraticCurveTo(right, bottom, right - radius, bottom);
  ctx.lineTo(left + radius, bottom);
  ctx.quadraticCurveTo(left, bottom, left, bottom - radius);
  ctx.lineTo(left, top + radius);
  ctx.quadraticCurveTo(left, top, left + radius, top);
  ctx.closePath();

  ctx.fillStyle = color;
  ctx.fill();

  // Reset shadow for details
  ctx.shadowColor = 'transparent';

  // Subtle white border
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Draw clean note/pin icon inside
  ctx.fillStyle = '#ffffff';

  // Little sticky note document glyph inside
  const iconLeft = x - 5;
  const iconTop = y - 6;
  const iconW = 10;
  const iconH = 12;

  ctx.beginPath();
  ctx.rect(iconLeft, iconTop, iconW, iconH);
  ctx.fill();

  // Small lines inside note glyph
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(iconLeft + 2, iconTop + 3.5);
  ctx.lineTo(iconLeft + iconW - 2, iconTop + 3.5);
  ctx.moveTo(iconLeft + 2, iconTop + 6.5);
  ctx.lineTo(iconLeft + iconW - 2, iconTop + 6.5);
  ctx.moveTo(iconLeft + 2, iconTop + 9.5);
  ctx.lineTo(iconLeft + iconW - 4, iconTop + 9.5);
  ctx.stroke();

  // Selected ring
  if (isSelected) {
    ctx.strokeStyle = '#6965db';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(x, y, size / 2 + 4, 0, 2 * Math.PI);
    ctx.stroke();
  }

  ctx.restore();
}

export function isPointInNote(
  pointX: number,
  pointY: number,
  annotation: NoteAnnotation,
  scale: number
): boolean {
  const x = annotation.x * scale;
  const y = annotation.y * scale;
  const halfSize = 16;

  return (
    pointX >= x - halfSize &&
    pointX <= x + halfSize &&
    pointY >= y - halfSize &&
    pointY <= y + halfSize
  );
}
