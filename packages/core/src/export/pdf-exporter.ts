import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import {
  Annotation,
  AnnotationDocument,
  StrokeAnnotation,
  HighlightAnnotation,
  ShapeAnnotation,
  NoteAnnotation,
  TextAnnotation,
} from '../types';
import { generateStrokeOutline, getSvgPathFromStroke } from '../annotations/pen-renderer';

export function parseHexColor(colorStr: string): { r: number; g: number; b: number } {
  if (!colorStr) {
    return { r: 1, g: 0, b: 0 };
  }

  let hex = colorStr.trim();
  if (hex.startsWith('#')) {
    hex = hex.slice(1);
  }

  if (hex.length === 3) {
    hex = hex.split('').map((c) => c + c).join('');
  }

  if (hex.length >= 6) {
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    return { r, g, b };
  }

  return { r: 1, g: 0, b: 0 };
}

export async function exportPdfWithAnnotations(
  originalPdfBytes: Uint8Array | ArrayBuffer,
  annotationDoc: AnnotationDocument
): Promise<Blob> {
  const pdfDoc = await PDFDocument.load(originalPdfBytes);
  const pages = pdfDoc.getPages();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Group annotations by page (1-indexed)
  const annotationsByPage = new Map<number, Annotation[]>();
  for (const ann of annotationDoc.annotations) {
    const pageAnns = annotationsByPage.get(ann.page) || [];
    pageAnns.push(ann);
    annotationsByPage.set(ann.page, pageAnns);
  }

  for (let pageNum = 1; pageNum <= pages.length; pageNum++) {
    const page = pages[pageNum - 1];
    const pageAnns = annotationsByPage.get(pageNum);
    if (!pageAnns || pageAnns.length === 0) continue;

    const { height: pageHeight } = page.getSize();

    for (const ann of pageAnns) {
      const { r, g, b } = parseHexColor(ann.color);
      const pdfColor = rgb(r, g, b);

      if (ann.type === 'stroke') {
        const strokeAnn = ann as StrokeAnnotation;
        if (strokeAnn.points && strokeAnn.points.length >= 2) {
          const strokeOpacity = strokeAnn.opacity !== undefined ? strokeAnn.opacity : 1;
          const strokeWidth = strokeAnn.strokeWidth || 3;

          for (let i = 0; i < strokeAnn.points.length - 1; i++) {
            const p1 = strokeAnn.points[i];
            const p2 = strokeAnn.points[i + 1];
            page.drawLine({
              start: { x: p1[0], y: pageHeight - p1[1] },
              end: { x: p2[0], y: pageHeight - p2[1] },
              thickness: strokeWidth,
              color: pdfColor,
              opacity: strokeOpacity,
            });
          }
        }
      } else if (ann.type === 'highlight') {
        const hlAnn = ann as HighlightAnnotation;
        const hlOpacity = hlAnn.opacity !== undefined ? hlAnn.opacity * 0.4 : 0.35;

        // Text-snapped rectangles
        if (hlAnn.rects && hlAnn.rects.length > 0) {
          for (const rect of hlAnn.rects) {
            page.drawRectangle({
              x: rect.x,
              y: pageHeight - (rect.y + rect.height),
              width: rect.width,
              height: rect.height,
              color: pdfColor,
              opacity: hlOpacity,
            });
          }
        }

        // Freehand highlighter stroke
        if (hlAnn.points && hlAnn.points.length >= 2) {
          const thickness = hlAnn.strokeWidth || 18;
          for (let i = 0; i < hlAnn.points.length - 1; i++) {
            const p1 = hlAnn.points[i];
            const p2 = hlAnn.points[i + 1];
            page.drawLine({
              start: { x: p1[0], y: pageHeight - p1[1] },
              end: { x: p2[0], y: pageHeight - p2[1] },
              thickness,
              color: pdfColor,
              opacity: hlOpacity,
            });
          }
        }
      } else if (ann.type === 'text') {
        const textAnn = ann as TextAnnotation;
        if (textAnn.text) {
          const fontSize = textAnn.fontSize || 18;
          const lineHeight = fontSize * 1.25;
          const lines = textAnn.text.split('\n');
          const opacity = textAnn.opacity !== undefined ? textAnn.opacity : 1;

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (!line) continue;

            const safeLine = line.replace(/[^\x20-\x7E]/g, '?');
            try {
              page.drawText(safeLine, {
                x: textAnn.x,
                y: pageHeight - textAnn.y - fontSize - i * lineHeight,
                size: fontSize,
                font,
                color: pdfColor,
                opacity,
              });
            } catch {
              // Ignore font encoding error
            }
          }
        }
      } else if (ann.type === 'rectangle') {
        const shapeAnn = ann as ShapeAnnotation;
        const width = shapeAnn.width;
        const height = shapeAnn.height;
        const x = shapeAnn.x;
        const y = pageHeight - (shapeAnn.y + height);

        let fillPdfColor = undefined;
        if (shapeAnn.fillColor && shapeAnn.fillColor !== 'transparent') {
          const fc = parseHexColor(shapeAnn.fillColor);
          fillPdfColor = rgb(fc.r, fc.g, fc.b);
        }

        page.drawRectangle({
          x,
          y,
          width,
          height,
          borderColor: pdfColor,
          borderWidth: shapeAnn.strokeWidth || 2,
          color: fillPdfColor,
          opacity: shapeAnn.opacity !== undefined ? shapeAnn.opacity : 1,
        });
      } else if (ann.type === 'ellipse') {
        const shapeAnn = ann as ShapeAnnotation;
        const centerX = shapeAnn.x + shapeAnn.width / 2;
        const centerY = pageHeight - (shapeAnn.y + shapeAnn.height / 2);
        const xScale = Math.abs(shapeAnn.width / 2);
        const yScale = Math.abs(shapeAnn.height / 2);

        let fillPdfColor = undefined;
        if (shapeAnn.fillColor && shapeAnn.fillColor !== 'transparent') {
          const fc = parseHexColor(shapeAnn.fillColor);
          fillPdfColor = rgb(fc.r, fc.g, fc.b);
        }

        page.drawEllipse({
          x: centerX,
          y: centerY,
          xScale,
          yScale,
          borderColor: pdfColor,
          borderWidth: shapeAnn.strokeWidth || 2,
          color: fillPdfColor,
          opacity: shapeAnn.opacity !== undefined ? shapeAnn.opacity : 1,
        });
      } else if (ann.type === 'note') {
        const noteAnn = ann as NoteAnnotation;
        const x = noteAnn.x;
        const y = pageHeight - noteAnn.y;

        page.drawCircle({
          x,
          y,
          size: 7,
          color: pdfColor,
        });

        if (noteAnn.content) {
          const safeContent = noteAnn.content.replace(/[^\x20-\x7E]/g, '?');
          const truncatedContent = safeContent.length > 60
            ? safeContent.substring(0, 57) + '...'
            : safeContent;

          page.drawRectangle({
            x: x + 10,
            y: y - 8,
            width: Math.min(200, truncatedContent.length * 6 + 10),
            height: 18,
            color: rgb(1, 1, 0.9),
            borderColor: pdfColor,
            borderWidth: 1,
          });

          try {
            page.drawText(truncatedContent, {
              x: x + 14,
              y: y - 4,
              size: 9,
              font,
              color: rgb(0.1, 0.1, 0.1),
            });
          } catch {
            // Ignore font encoding error
          }
        }
      }
    }
  }

  const modifiedPdfBytes = await pdfDoc.save();
  const buffer = modifiedPdfBytes.buffer.slice(
    modifiedPdfBytes.byteOffset,
    modifiedPdfBytes.byteOffset + modifiedPdfBytes.byteLength
  ) as ArrayBuffer;
  return new Blob([buffer], { type: 'application/pdf' });
}
