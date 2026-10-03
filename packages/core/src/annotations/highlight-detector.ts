import type { PDFPageProxy } from 'pdfjs-dist';
import { HighlightAnnotation, HighlightRect } from '../types';

export interface TextQuad {
  str: string;
  dir: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isRTL: boolean;
}

export interface PageTextLayerData {
  pageNumber: number;
  isScanned: boolean;
  textQuads: TextQuad[];
}

/**
 * Tests whether a string contains RTL characters (Arabic, Hebrew, Persian, Urdu, etc.)
 */
export function isRTLText(text: string): boolean {
  const rtlRegex = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/;
  return rtlRegex.test(text);
}

/**
 * Extracts and normalizes text bounding quads from PDF.js page, supporting both LTR and RTL / Arabic.
 * Also detects if the page is a scanned document (has zero or empty text items).
 */
export async function extractPageTextQuads(
  page: PDFPageProxy,
  viewport: any
): Promise<PageTextLayerData> {
  const textContent = await page.getTextContent();
  const items = textContent.items as any[];

  if (!items || items.length === 0) {
    return {
      pageNumber: page.pageNumber,
      isScanned: true,
      textQuads: [],
    };
  }

  const textQuads: TextQuad[] = [];
  let totalCharacters = 0;

  for (const item of items) {
    if (!item.str || item.str.trim().length === 0) {
      continue;
    }

    totalCharacters += item.str.trim().length;
    const transform = item.transform; // [scaleX, skewY, skewX, scaleY, transX, transY]
    const itemWidth = item.width;
    const itemHeight = item.height || Math.hypot(transform[2], transform[3]) || 12;

    const isRTL = item.dir === 'rtl' || isRTLText(item.str);

    // Transform PDF coordinates into viewport/unscaled page coordinates
    // PDF coordinates have (0,0) at bottom-left; viewport transforms it to top-left
    let [vx, vy] = viewport.convertToViewportPoint(transform[4], transform[5]);

    // Handle RTL and direction offsets
    let quadWidth = itemWidth;
    let quadHeight = itemHeight;

    // Normalization to ensure positive dimensions and correct top-left origin
    if (quadWidth < 0) {
      vx += quadWidth;
      quadWidth = Math.abs(quadWidth);
    }

    // In viewport space, Y goes downwards
    const yTop = vy - quadHeight;

    textQuads.push({
      str: item.str,
      dir: item.dir,
      x: vx / viewport.scale,
      y: yTop / viewport.scale,
      width: Math.abs(quadWidth) / viewport.scale,
      height: Math.abs(quadHeight) / viewport.scale,
      isRTL,
    });
  }

  const isScanned = totalCharacters === 0;

  return {
    pageNumber: page.pageNumber,
    isScanned,
    textQuads,
  };
}

/**
 * Finds all text quads intersecting a selection rectangle (in PDF space)
 */
export function findIntersectingQuads(
  selectionRect: HighlightRect,
  quads: TextQuad[]
): HighlightRect[] {
  const selLeft = Math.min(selectionRect.x, selectionRect.x + selectionRect.width);
  const selRight = Math.max(selectionRect.x, selectionRect.x + selectionRect.width);
  const selTop = Math.min(selectionRect.y, selectionRect.y + selectionRect.height);
  const selBottom = Math.max(selectionRect.y, selectionRect.y + selectionRect.height);

  const intersecting: HighlightRect[] = [];

  for (const quad of quads) {
    const quadLeft = quad.x;
    const quadRight = quad.x + quad.width;
    const quadTop = quad.y;
    const quadBottom = quad.y + quad.height;

    const overlaps =
      selLeft < quadRight &&
      selRight > quadLeft &&
      selTop < quadBottom &&
      selBottom > quadTop;

    if (overlaps) {
      intersecting.push({
        x: quad.x,
        y: quad.y,
        width: quad.width,
        height: quad.height,
      });
    }
  }

  // If no exact text quads intersected (e.g. freehand highlight or scanned fallback), return the selection rect directly
  return intersecting.length > 0 ? intersecting : [selectionRect];
}

/**
 * Draws highlight annotation (both text-snapped rectangles and freehand highlighter paths) onto canvas
 */
export function drawHighlightAnnotation(
  ctx: CanvasRenderingContext2D,
  annotation: HighlightAnnotation,
  scale: number
): void {
  const color = annotation.color || '#ffeb3b';
  const opacity = annotation.opacity !== undefined ? annotation.opacity * 0.4 : 0.38;

  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = opacity;

  // 1. Text-snapped quad rectangles
  if (annotation.rects && annotation.rects.length > 0) {
    ctx.fillStyle = color;
    for (const rect of annotation.rects) {
      ctx.fillRect(
        rect.x * scale,
        rect.y * scale,
        rect.width * scale,
        rect.height * scale
      );
    }
  }

  // 2. Freehand highlighter stroke path
  if (annotation.points && annotation.points.length >= 2) {
    const strokeWidth = (annotation.strokeWidth || 18) * scale;
    ctx.strokeStyle = color;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(annotation.points[0][0] * scale, annotation.points[0][1] * scale);

    for (let i = 1; i < annotation.points.length; i++) {
      const p = annotation.points[i];
      ctx.lineTo(p[0] * scale, p[1] * scale);
    }

    ctx.stroke();
  }

  ctx.restore();
}
