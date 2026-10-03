import {
  Annotation,
  AnnotationDocument,
  StrokeAnnotation,
  HighlightAnnotation,
  ShapeAnnotation,
  NoteAnnotation,
  TextAnnotation,
  ToolType,
  HighlightRect,
} from '../types';
import { PageView } from '../engine/page-view';
import { drawStrokeAnnotation } from './pen-renderer';
import { drawHighlightAnnotation, findIntersectingQuads } from './highlight-detector';
import { drawShapeAnnotation } from './shape-renderer';
import { drawNoteAnnotation, isPointInNote } from './note-manager';
import { drawTextAnnotation, isPointInTextAnnotation } from './text-renderer';
import { CommandManager } from '../commands/command-manager';
import {
  AddAnnotationCommand,
  DeleteAnnotationCommand,
  UpdateAnnotationCommand,
} from '../commands/command';
import { createAnnotationDocument } from '../export/json';

export class OverlayManager {
  private annotations: Annotation[] = [];
  private selectedAnnotationId: string | null = null;
  private commandManager: CommandManager;
  private currentTool: ToolType = 'pen';
  private currentColor = '#1e1e1e';
  private currentFillColor = 'transparent';
  private currentOpacity = 1;
  private currentStrokeWidth = 3;
  private currentFontSize = 18;
  private pageViews: Map<number, PageView> = new Map();
  private onChangeCallback?: (doc: AnnotationDocument) => void;
  private debounceTimer: any = null;

  // Active interaction state
  private isDrawing = false;
  private isPanning = false;
  private panStartX = 0;
  private panStartY = 0;
  private scrollStartX = 0;
  private scrollStartY = 0;
  private panContainer: HTMLElement | null = null;
  private activePageNumber: number | null = null;
  private currentPoints: [number, number, number?][] = [];
  private dragStartPoint: { x: number; y: number } | null = null;
  private dragCurrentPoint: { x: number; y: number } | null = null;
  private movingAnnotationInitialState: Annotation | null = null;
  private activePointerIds: Set<number> = new Set();

  constructor(commandManager: CommandManager, onChange?: (doc: AnnotationDocument) => void) {
    this.commandManager = commandManager;
    this.onChangeCallback = onChange;
  }

  setTool(tool: ToolType): void {
    this.currentTool = tool;
    this.selectedAnnotationId = null;
    this.updateCursors();
    this.redrawAll();
  }

  private updateCursors(): void {
    let cursor = 'default';
    if (this.currentTool === 'pan') {
      cursor = this.isPanning ? 'grabbing' : 'grab';
    } else if (
      this.currentTool === 'pen' ||
      this.currentTool === 'highlight' ||
      this.currentTool === 'rectangle' ||
      this.currentTool === 'ellipse'
    ) {
      cursor = 'crosshair';
    } else if (this.currentTool === 'text') {
      cursor = 'text';
    } else if (this.currentTool === 'note') {
      cursor = 'pointer';
    } else if (this.currentTool === 'select') {
      cursor = 'default';
    }

    for (const pv of this.pageViews.values()) {
      pv.annotationCanvas.style.cursor = cursor;
    }
  }

  setColor(color: string): void {
    this.currentColor = color;
  }

  setFillColor(fillColor: string): void {
    this.currentFillColor = fillColor;
  }

  setOpacity(opacity: number): void {
    this.currentOpacity = Math.max(0, Math.min(1, opacity));
  }

  setStrokeWidth(width: number): void {
    this.currentStrokeWidth = width;
  }

  setFontSize(fontSize: number): void {
    this.currentFontSize = fontSize;
  }

  registerPageView(pageView: PageView): void {
    this.pageViews.set(pageView.pageNumber, pageView);
    this.attachEvents(pageView);
    this.updateCursors();
    this.renderPageAnnotations(pageView.pageNumber);
  }

  unregisterPageView(pageNumber: number): void {
    this.pageViews.delete(pageNumber);
  }

  getAnnotations(): Annotation[] {
    return this.annotations;
  }

  setAnnotations(annotations: Annotation[]): void {
    this.annotations = JSON.parse(JSON.stringify(annotations));
    this.selectedAnnotationId = null;
    this.redrawAll();
    this.triggerChange();
  }

  addAnnotation(annotation: Annotation, pushToStack = true): void {
    if (pushToStack) {
      const cmd = new AddAnnotationCommand(
        annotation,
        (ann) => this.internalAdd(ann),
        (id) => this.internalRemove(id)
      );
      this.commandManager.execute(cmd);
    } else {
      this.internalAdd(annotation);
    }
  }

  deleteAnnotation(id: string, pushToStack = true): void {
    const ann = this.annotations.find((a) => a.id === id);
    if (!ann) return;

    if (pushToStack) {
      const cmd = new DeleteAnnotationCommand(
        ann,
        (a) => this.internalAdd(a),
        (i) => this.internalRemove(i)
      );
      this.commandManager.execute(cmd);
    } else {
      this.internalRemove(id);
    }
  }

  updateAnnotation(updated: Annotation, pushToStack = true): void {
    const prev = this.annotations.find((a) => a.id === updated.id);
    if (!prev) return;

    if (pushToStack) {
      const cmd = new UpdateAnnotationCommand(
        JSON.parse(JSON.stringify(prev)),
        JSON.parse(JSON.stringify(updated)),
        (a) => this.internalUpdate(a)
      );
      this.commandManager.execute(cmd);
    } else {
      this.internalUpdate(updated);
    }
  }

  private internalAdd(ann: Annotation): void {
    this.annotations.push(ann);
    this.renderPageAnnotations(ann.page);
    this.triggerChange();
  }

  private internalRemove(id: string): void {
    const idx = this.annotations.findIndex((a) => a.id === id);
    if (idx !== -1) {
      const page = this.annotations[idx].page;
      this.annotations.splice(idx, 1);
      if (this.selectedAnnotationId === id) {
        this.selectedAnnotationId = null;
      }
      this.renderPageAnnotations(page);
      this.triggerChange();
    }
  }

  private internalUpdate(updated: Annotation): void {
    const idx = this.annotations.findIndex((a) => a.id === updated.id);
    if (idx !== -1) {
      this.annotations[idx] = updated;
      this.renderPageAnnotations(updated.page);
      this.triggerChange();
    }
  }

  undo(): void {
    this.commandManager.undo();
  }

  redo(): void {
    this.commandManager.redo();
  }

  canUndo(): boolean {
    return this.commandManager.canUndo();
  }

  canRedo(): boolean {
    return this.commandManager.canRedo();
  }

  renderPageAnnotations(pageNumber: number): void {
    const pageView = this.pageViews.get(pageNumber);
    if (!pageView) return;

    const ctx = pageView.annotationCtx;
    const { width, height, scale } = pageView.getDimensions();
    const dpr = window.devicePixelRatio || 1;

    ctx.clearRect(0, 0, width * dpr, height * dpr);

    ctx.save();
    if (dpr !== 1) {
      ctx.scale(dpr, dpr);
    }

    const pageAnns = this.annotations.filter((a) => a.page === pageNumber);

    // 1. Draw Highlights (bottom)
    for (const ann of pageAnns) {
      if (ann.type === 'highlight') {
        drawHighlightAnnotation(ctx, ann as HighlightAnnotation, scale);
      }
    }

    // 2. Draw Shapes
    for (const ann of pageAnns) {
      if (ann.type === 'rectangle' || ann.type === 'ellipse') {
        drawShapeAnnotation(ctx, ann as ShapeAnnotation, scale);
      }
    }

    // 3. Draw Strokes
    for (const ann of pageAnns) {
      if (ann.type === 'stroke') {
        drawStrokeAnnotation(ctx, ann as StrokeAnnotation, scale);
      }
    }

    // 4. Draw Text annotations
    for (const ann of pageAnns) {
      if (ann.type === 'text') {
        drawTextAnnotation(
          ctx,
          ann as TextAnnotation,
          scale,
          ann.id === this.selectedAnnotationId
        );
      }
    }

    // 5. Draw Notes (for backwards compatibility)
    for (const ann of pageAnns) {
      if (ann.type === 'note') {
        drawNoteAnnotation(
          ctx,
          ann as NoteAnnotation,
          scale,
          ann.id === this.selectedAnnotationId
        );
      }
    }

    // 6. Draw active in-progress preview (during drawing/dragging)
    if (this.isDrawing && this.activePageNumber === pageNumber) {
      this.drawActivePreview(ctx, scale, pageView);
    }

    ctx.restore();
  }

  private drawActivePreview(
    ctx: CanvasRenderingContext2D,
    scale: number,
    pageView: PageView
  ): void {
    if (this.currentTool === 'pen' && this.currentPoints.length > 1) {
      const tempStroke: StrokeAnnotation = {
        id: 'temp',
        type: 'stroke',
        page: this.activePageNumber!,
        color: this.currentColor,
        strokeWidth: this.currentStrokeWidth,
        opacity: this.currentOpacity,
        points: this.currentPoints,
        createdAt: Date.now(),
      };
      drawStrokeAnnotation(ctx, tempStroke, scale);
    } else if (this.currentTool === 'highlight' && this.dragStartPoint && this.dragCurrentPoint) {
      const selRect: HighlightRect = {
        x: Math.min(this.dragStartPoint.x, this.dragCurrentPoint.x),
        y: Math.min(this.dragStartPoint.y, this.dragCurrentPoint.y),
        width: Math.abs(this.dragCurrentPoint.x - this.dragStartPoint.x),
        height: Math.abs(this.dragCurrentPoint.y - this.dragStartPoint.y),
      };

      const textLayerData = pageView.getTextLayerData();
      const hasTextQuads = textLayerData && !textLayerData.isScanned && textLayerData.textQuads.length > 0;
      const intersectingQuads = hasTextQuads
        ? findIntersectingQuads(selRect, textLayerData.textQuads)
        : [];

      if (intersectingQuads.length > 0 && !(intersectingQuads.length === 1 && intersectingQuads[0] === selRect)) {
        // Text snapped highlight preview
        const tempHl: HighlightAnnotation = {
          id: 'temp',
          type: 'highlight',
          page: this.activePageNumber!,
          color: this.currentColor || '#ffeb3b',
          opacity: this.currentOpacity,
          rects: intersectingQuads,
          createdAt: Date.now(),
        };
        drawHighlightAnnotation(ctx, tempHl, scale);
      } else if (this.currentPoints.length >= 2) {
        // Freehand highlighter stroke preview
        const freehandHl: HighlightAnnotation = {
          id: 'temp',
          type: 'highlight',
          page: this.activePageNumber!,
          color: this.currentColor || '#ffeb3b',
          opacity: this.currentOpacity,
          points: this.currentPoints.map((p) => [p[0], p[1]]),
          strokeWidth: 18,
          createdAt: Date.now(),
        };
        drawHighlightAnnotation(ctx, freehandHl, scale);
      }
    } else if (
      (this.currentTool === 'rectangle' || this.currentTool === 'ellipse') &&
      this.dragStartPoint &&
      this.dragCurrentPoint
    ) {
      const tempShape: ShapeAnnotation = {
        id: 'temp',
        type: this.currentTool,
        page: this.activePageNumber!,
        color: this.currentColor,
        fillColor: this.currentFillColor,
        opacity: this.currentOpacity,
        strokeWidth: this.currentStrokeWidth,
        x: Math.min(this.dragStartPoint.x, this.dragCurrentPoint.x),
        y: Math.min(this.dragStartPoint.y, this.dragCurrentPoint.y),
        width: Math.abs(this.dragCurrentPoint.x - this.dragStartPoint.x),
        height: Math.abs(this.dragCurrentPoint.y - this.dragStartPoint.y),
        createdAt: Date.now(),
      };
      drawShapeAnnotation(ctx, tempShape, scale);
    }
  }

  redrawAll(): void {
    for (const pageNumber of this.pageViews.keys()) {
      this.renderPageAnnotations(pageNumber);
    }
  }

  private triggerChange(): void {
    if (!this.onChangeCallback) return;

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      const doc = createAnnotationDocument(this.annotations);
      if (this.onChangeCallback) {
        this.onChangeCallback(doc);
      }
    }, 300);
  }

  private attachEvents(pageView: PageView): void {
    const canvas = pageView.annotationCanvas;

    canvas.addEventListener('pointerdown', (e) => this.handlePointerDown(e, pageView));
    window.addEventListener('pointermove', (e) => this.handlePointerMove(e));
    window.addEventListener('pointerup', (e) => this.handlePointerUp(e));
    window.addEventListener('pointercancel', (e) => this.handlePointerUp(e));

    // Double click to edit text annotation in select mode
    canvas.addEventListener('dblclick', (e) => {
      if (this.currentTool === 'select') {
        const pt = pageView.screenToPdfPoint(e.clientX, e.clientY);
        const scale = pageView.getDimensions().scale;
        const pageAnns = this.annotations.filter((a) => a.page === pageView.pageNumber && a.type === 'text') as TextAnnotation[];
        const hit = pageAnns.find((ann) => isPointInTextAnnotation(pt.x * scale, pt.y * scale, ann, scale));
        if (hit) {
          this.openTextEditor(hit, pageView);
        }
      }
    });

    // Keyboard delete for selected annotation
    window.addEventListener('keydown', (e) => {
      if (
        (e.key === 'Delete' || e.key === 'Backspace') &&
        this.selectedAnnotationId &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        this.deleteAnnotation(this.selectedAnnotationId);
      }
    });
  }

  cancelInteraction(): void {
    if (this.isDrawing || this.isPanning) {
      const pageToRedraw = this.activePageNumber;
      this.isDrawing = false;
      this.isPanning = false;
      this.panContainer = null;
      this.currentPoints = [];
      this.dragStartPoint = null;
      this.dragCurrentPoint = null;
      this.activePageNumber = null;
      if (pageToRedraw !== null) {
        this.renderPageAnnotations(pageToRedraw);
      }
      this.updateCursors();
    }
  }

  private handlePointerDown(e: PointerEvent, pageView: PageView): void {
    this.activePointerIds.add(e.pointerId);
    if (this.activePointerIds.size > 1) {
      this.cancelInteraction();
      return;
    }

    if (this.currentTool === 'pan') {
      e.preventDefault();
      this.isPanning = true;
      this.panStartX = e.clientX;
      this.panStartY = e.clientY;
      const rootContainer = (pageView.container.closest('.tbib-pdf-viewer-root') ||
        pageView.container.parentElement) as HTMLElement;
      this.panContainer = rootContainer;
      if (this.panContainer) {
        this.scrollStartX = this.panContainer.scrollLeft;
        this.scrollStartY = this.panContainer.scrollTop;
      }
      this.updateCursors();
      return;
    }

    e.preventDefault();
    const pt = pageView.screenToPdfPoint(e.clientX, e.clientY);
    const pressure = e.pressure || 0.5;

    this.isDrawing = true;
    this.activePageNumber = pageView.pageNumber;
    this.dragStartPoint = { x: pt.x, y: pt.y };
    this.dragCurrentPoint = { x: pt.x, y: pt.y };

    if (this.currentTool === 'pen') {
      this.currentPoints = [[pt.x, pt.y, pressure]];
    } else if (this.currentTool === 'highlight') {
      this.currentPoints = [[pt.x, pt.y]];
    } else if (this.currentTool === 'text') {
      this.isDrawing = false;
      const scale = pageView.getDimensions().scale;

      // Check if clicking existing text to select/edit
      const pageAnns = this.annotations.filter((a) => a.page === pageView.pageNumber && a.type === 'text') as TextAnnotation[];
      const hit = pageAnns.find((ann) => isPointInTextAnnotation(pt.x * scale, pt.y * scale, ann, scale));

      if (hit) {
        this.selectedAnnotationId = hit.id;
        this.renderPageAnnotations(pageView.pageNumber);
        this.openTextEditor(hit, pageView);
        return;
      }

      // Create new text annotation
      const newText: TextAnnotation = {
        id: 'text_' + Math.random().toString(36).substring(2, 9),
        type: 'text',
        page: pageView.pageNumber,
        color: this.currentColor || '#1e1e1e',
        fontSize: this.currentFontSize || 18,
        x: pt.x,
        y: pt.y,
        text: '',
        createdAt: Date.now(),
      };

      this.openTextEditor(newText, pageView, true);
    } else if (this.currentTool === 'note') {
      // Check if clicked existing note
      const pageAnns = this.annotations.filter(
        (a) => a.page === pageView.pageNumber && a.type === 'note'
      ) as NoteAnnotation[];

      const hit = pageAnns.find((ann) =>
        isPointInNote(pt.x * pageView.getDimensions().scale, pt.y * pageView.getDimensions().scale, ann, pageView.getDimensions().scale)
      );

      if (hit) {
        this.selectedAnnotationId = hit.id;
        this.renderPageAnnotations(pageView.pageNumber);
        this.openNoteEditor(hit, pageView);
        this.isDrawing = false;
        return;
      }

      // Create new note
      const newNote: NoteAnnotation = {
        id: 'note_' + Math.random().toString(36).substring(2, 9),
        type: 'note',
        page: pageView.pageNumber,
        color: this.currentColor || '#ffc107',
        x: pt.x,
        y: pt.y,
        content: '',
        createdAt: Date.now(),
      };

      this.addAnnotation(newNote);
      this.selectedAnnotationId = newNote.id;
      this.openNoteEditor(newNote, pageView);
      this.isDrawing = false;
    } else if (this.currentTool === 'select') {
      // Hit testing text, notes, shapes
      const pageAnns = this.annotations.filter((a) => a.page === pageView.pageNumber);
      let hitId: string | null = null;
      const scale = pageView.getDimensions().scale;

      for (let i = pageAnns.length - 1; i >= 0; i--) {
        const ann = pageAnns[i];
        if (ann.type === 'text') {
          if (isPointInTextAnnotation(pt.x * scale, pt.y * scale, ann as TextAnnotation, scale)) {
            hitId = ann.id;
            break;
          }
        } else if (ann.type === 'note') {
          if (isPointInNote(pt.x * scale, pt.y * scale, ann as NoteAnnotation, scale)) {
            hitId = ann.id;
            break;
          }
        } else if (ann.type === 'rectangle' || ann.type === 'ellipse') {
          const s = ann as ShapeAnnotation;
          if (pt.x >= s.x && pt.x <= s.x + s.width && pt.y >= s.y && pt.y <= s.y + s.height) {
            hitId = ann.id;
            break;
          }
        }
      }

      this.selectedAnnotationId = hitId;
      if (hitId) {
        const hitAnn = this.annotations.find((a) => a.id === hitId)!;
        this.movingAnnotationInitialState = JSON.parse(JSON.stringify(hitAnn));
      }
      this.renderPageAnnotations(pageView.pageNumber);
    }
  }

  private handlePointerMove(e: PointerEvent): void {
    if (this.activePointerIds.size > 1) {
      return;
    }

    if (this.isPanning && this.panContainer) {
      const dx = e.clientX - this.panStartX;
      const dy = e.clientY - this.panStartY;
      this.panContainer.scrollLeft = this.scrollStartX - dx;
      this.panContainer.scrollTop = this.scrollStartY - dy;
      return;
    }

    if (!this.isDrawing || this.activePageNumber === null) return;

    const pageView = this.pageViews.get(this.activePageNumber);
    if (!pageView) return;

    const pt = pageView.screenToPdfPoint(e.clientX, e.clientY);
    const pressure = e.pressure || 0.5;

    if (this.currentTool === 'pen') {
      this.currentPoints.push([pt.x, pt.y, pressure]);
      this.renderPageAnnotations(this.activePageNumber);
    } else if (this.currentTool === 'highlight') {
      this.currentPoints.push([pt.x, pt.y]);
      this.dragCurrentPoint = { x: pt.x, y: pt.y };
      this.renderPageAnnotations(this.activePageNumber);
    } else if (
      this.currentTool === 'rectangle' ||
      this.currentTool === 'ellipse'
    ) {
      this.dragCurrentPoint = { x: pt.x, y: pt.y };
      this.renderPageAnnotations(this.activePageNumber);
    } else if (this.currentTool === 'select' && this.selectedAnnotationId && this.dragStartPoint && this.movingAnnotationInitialState) {
      const dx = pt.x - this.dragStartPoint.x;
      const dy = pt.y - this.dragStartPoint.y;
      const initial = this.movingAnnotationInitialState;

      if (initial.type === 'text') {
        const updated: TextAnnotation = {
          ...initial,
          x: initial.x + dx,
          y: initial.y + dy,
        };
        this.internalUpdate(updated);
      } else if (initial.type === 'note') {
        const updated: NoteAnnotation = {
          ...initial,
          x: initial.x + dx,
          y: initial.y + dy,
        };
        this.internalUpdate(updated);
      } else if (initial.type === 'rectangle' || initial.type === 'ellipse') {
        const updated: ShapeAnnotation = {
          ...initial,
          x: initial.x + dx,
          y: initial.y + dy,
        };
        this.internalUpdate(updated);
      }
    }
  }

  private handlePointerUp(e: PointerEvent): void {
    this.activePointerIds.delete(e.pointerId);

    if (this.isPanning) {
      this.isPanning = false;
      this.panContainer = null;
      this.updateCursors();
      return;
    }

    if (!this.isDrawing || this.activePageNumber === null) return;

    const pageView = this.pageViews.get(this.activePageNumber);
    const pageNumber = this.activePageNumber;

    this.isDrawing = false;
    this.activePageNumber = null;

    if (!pageView) return;

    if (this.currentTool === 'pen' && this.currentPoints.length >= 2) {
      const newStroke: StrokeAnnotation = {
        id: 'stroke_' + Math.random().toString(36).substring(2, 9),
        type: 'stroke',
        page: pageNumber,
        color: this.currentColor,
        opacity: this.currentOpacity,
        strokeWidth: this.currentStrokeWidth,
        points: [...this.currentPoints],
        createdAt: Date.now(),
      };
      this.addAnnotation(newStroke);
    } else if (this.currentTool === 'highlight' && this.dragStartPoint && this.dragCurrentPoint) {
      const width = Math.abs(this.dragCurrentPoint.x - this.dragStartPoint.x);
      const height = Math.abs(this.dragCurrentPoint.y - this.dragStartPoint.y);

      const selRect: HighlightRect = {
        x: Math.min(this.dragStartPoint.x, this.dragCurrentPoint.x),
        y: Math.min(this.dragStartPoint.y, this.dragCurrentPoint.y),
        width: Math.max(width, 1),
        height: Math.max(height, 1),
      };

      const textLayerData = pageView.getTextLayerData();
      const hasTextQuads = textLayerData && !textLayerData.isScanned && textLayerData.textQuads.length > 0;
      const intersectingQuads = hasTextQuads
        ? findIntersectingQuads(selRect, textLayerData.textQuads)
        : [];

      if (intersectingQuads.length > 0 && !(intersectingQuads.length === 1 && intersectingQuads[0] === selRect)) {
        // Text-snapped highlight
        const newHl: HighlightAnnotation = {
          id: 'hl_' + Math.random().toString(36).substring(2, 9),
          type: 'highlight',
          page: pageNumber,
          color: this.currentColor || '#ffeb3b',
          opacity: this.currentOpacity,
          rects: intersectingQuads,
          createdAt: Date.now(),
        };
        this.addAnnotation(newHl);
      } else if (this.currentPoints.length >= 2) {
        // Freehand highlighter stroke with real marker look
        const freehandHl: HighlightAnnotation = {
          id: 'hl_' + Math.random().toString(36).substring(2, 9),
          type: 'highlight',
          page: pageNumber,
          color: this.currentColor || '#ffeb3b',
          opacity: this.currentOpacity,
          points: this.currentPoints.map((p) => [p[0], p[1]]),
          strokeWidth: 18,
          isFreehandFallback: true,
          createdAt: Date.now(),
        };
        this.addAnnotation(freehandHl);
      }
    } else if (
      (this.currentTool === 'rectangle' || this.currentTool === 'ellipse') &&
      this.dragStartPoint &&
      this.dragCurrentPoint
    ) {
      const width = Math.abs(this.dragCurrentPoint.x - this.dragStartPoint.x);
      const height = Math.abs(this.dragCurrentPoint.y - this.dragStartPoint.y);

      if (width > 4 && height > 4) {
        const newShape: ShapeAnnotation = {
          id: 'shape_' + Math.random().toString(36).substring(2, 9),
          type: this.currentTool,
          page: pageNumber,
          color: this.currentColor,
          fillColor: this.currentFillColor,
          opacity: this.currentOpacity,
          strokeWidth: this.currentStrokeWidth,
          x: Math.min(this.dragStartPoint.x, this.dragCurrentPoint.x),
          y: Math.min(this.dragStartPoint.y, this.dragCurrentPoint.y),
          width,
          height,
          createdAt: Date.now(),
        };
        this.addAnnotation(newShape);
      }
    } else if (this.currentTool === 'select' && this.movingAnnotationInitialState && this.selectedAnnotationId) {
      const current = this.annotations.find((a) => a.id === this.selectedAnnotationId);
      if (current) {
        const cmd = new UpdateAnnotationCommand(
          this.movingAnnotationInitialState,
          JSON.parse(JSON.stringify(current)),
          (a) => this.internalUpdate(a)
        );
        this.commandManager.execute(cmd);
      }
      this.movingAnnotationInitialState = null;
    }

    this.currentPoints = [];
    this.dragStartPoint = null;
    this.dragCurrentPoint = null;
    this.renderPageAnnotations(pageNumber);
  }

  /**
   * Inline interactive text box editor for TextAnnotation
   */
  private openTextEditor(textAnn: TextAnnotation, pageView: PageView, isNew = false): void {
    // Remove existing text editors
    const existing = pageView.container.querySelector('.tbib-text-editor');
    if (existing) existing.remove();

    const scale = pageView.getDimensions().scale;
    const fontSize = (textAnn.fontSize || this.currentFontSize || 18) * scale;
    const fontFamily = textAnn.fontFamily || "'Rubik', sans-serif";

    const editor = document.createElement('textarea');
    editor.className = 'tbib-text-editor';
    editor.value = textAnn.text || '';
    editor.placeholder = 'Type text here...';
    editor.style.position = 'absolute';
    editor.style.left = `${textAnn.x * scale}px`;
    editor.style.top = `${textAnn.y * scale}px`;
    editor.style.zIndex = '100';
    editor.style.font = `500 ${fontSize}px ${fontFamily}`;
    editor.style.color = textAnn.color || this.currentColor || '#1e1e1e';
    editor.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    editor.style.border = '1.5px dashed #6965db';
    editor.style.borderRadius = '4px';
    editor.style.padding = '3px 6px';
    editor.style.margin = '0';
    editor.style.outline = 'none';
    editor.style.resize = 'both';
    editor.style.minWidth = `${fontSize * 5}px`;
    editor.style.minHeight = `${fontSize * 1.5}px`;
    editor.style.lineHeight = '1.25';
    editor.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
    editor.style.boxSizing = 'border-box';

    // Auto-resize
    const autoResize = () => {
      editor.style.height = 'auto';
      editor.style.height = `${editor.scrollHeight}px`;
      editor.style.width = 'auto';
      editor.style.width = `${Math.max(editor.scrollWidth, fontSize * 5)}px`;
    };

    editor.addEventListener('input', autoResize);

    const finishEditing = () => {
      const val = editor.value.trim();
      editor.remove();

      if (val.length > 0) {
        if (isNew) {
          const created: TextAnnotation = {
            ...textAnn,
            text: editor.value,
          };
          this.addAnnotation(created);
          this.selectedAnnotationId = created.id;
        } else {
          const updated: TextAnnotation = {
            ...textAnn,
            text: editor.value,
          };
          this.updateAnnotation(updated);
        }
      } else if (!isNew) {
        this.deleteAnnotation(textAnn.id);
      }
      this.renderPageAnnotations(pageView.pageNumber);
    };

    editor.addEventListener('blur', finishEditing);
    editor.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        editor.remove();
        this.renderPageAnnotations(pageView.pageNumber);
      }
    });

    pageView.container.appendChild(editor);
    editor.focus();
    autoResize();
  }

  private openNoteEditor(note: NoteAnnotation, pageView: PageView): void {
    const existing = pageView.container.querySelector('.tbib-note-editor');
    if (existing) existing.remove();

    const scale = pageView.getDimensions().scale;
    const popup = document.createElement('div');
    popup.className = 'tbib-note-editor';
    popup.style.position = 'absolute';
    popup.style.left = `${note.x * scale + 18}px`;
    popup.style.top = `${note.y * scale - 24}px`;
    popup.style.zIndex = '100';
    popup.style.backgroundColor = '#ffffff';
    popup.style.border = '1px solid #e9ecef';
    popup.style.borderRadius = '10px';
    popup.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.12)';
    popup.style.padding = '12px';
    popup.style.width = '240px';
    popup.style.fontFamily = "'Rubik', sans-serif";
    popup.style.boxSizing = 'border-box';

    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '8px';

    const headerTitle = document.createElement('div');
    headerTitle.style.display = 'flex';
    headerTitle.style.alignItems = 'center';
    headerTitle.style.gap = '6px';
    headerTitle.style.fontSize = '12px';
    headerTitle.style.fontWeight = '600';
    headerTitle.style.color = '#495057';
    headerTitle.innerHTML = `<span style="display:inline-block;width:10px;height:10px;border-radius:3px;background-color:${note.color || '#f08c00'}"></span> <span>Note</span>`;

    const closeBtn = document.createElement('button');
    closeBtn.innerText = '✕';
    closeBtn.style.border = 'none';
    closeBtn.style.background = 'none';
    closeBtn.style.color = '#868e96';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.fontSize = '12px';
    closeBtn.style.padding = '0';
    closeBtn.onclick = () => popup.remove();

    header.appendChild(headerTitle);
    header.appendChild(closeBtn);

    const textarea = document.createElement('textarea');
    textarea.value = note.content || '';
    textarea.placeholder = 'Type your note here...';
    textarea.style.width = '100%';
    textarea.style.height = '72px';
    textarea.style.boxSizing = 'border-box';
    textarea.style.border = '1px solid #ced4da';
    textarea.style.borderRadius = '6px';
    textarea.style.padding = '8px';
    textarea.style.fontSize = '12px';
    textarea.style.fontFamily = "'Rubik', sans-serif";
    textarea.style.resize = 'none';
    textarea.style.outline = 'none';

    const btnRow = document.createElement('div');
    btnRow.style.display = 'flex';
    btnRow.style.justifyContent = 'space-between';
    btnRow.style.alignItems = 'center';
    btnRow.style.marginTop = '8px';

    const deleteBtn = document.createElement('button');
    deleteBtn.innerText = 'Delete';
    deleteBtn.style.padding = '4px 8px';
    deleteBtn.style.fontSize = '11px';
    deleteBtn.style.color = '#e03131';
    deleteBtn.style.backgroundColor = '#fff5f5';
    deleteBtn.style.border = '1px solid #ffc9c9';
    deleteBtn.style.borderRadius = '4px';
    deleteBtn.style.cursor = 'pointer';
    deleteBtn.style.fontFamily = "'Rubik', sans-serif";

    const saveBtn = document.createElement('button');
    saveBtn.innerText = 'Save Note';
    saveBtn.style.padding = '5px 12px';
    saveBtn.style.fontSize = '11px';
    saveBtn.style.fontWeight = '500';
    saveBtn.style.backgroundColor = '#6965db';
    saveBtn.style.color = '#ffffff';
    saveBtn.style.border = 'none';
    saveBtn.style.borderRadius = '4px';
    saveBtn.style.cursor = 'pointer';
    saveBtn.style.fontFamily = "'Rubik', sans-serif";

    saveBtn.onclick = () => {
      const updated: NoteAnnotation = {
        ...note,
        content: textarea.value,
      };
      this.updateAnnotation(updated);
      popup.remove();
    };

    deleteBtn.onclick = () => {
      this.deleteAnnotation(note.id);
      popup.remove();
    };

    btnRow.appendChild(deleteBtn);
    btnRow.appendChild(saveBtn);

    popup.appendChild(header);
    popup.appendChild(textarea);
    popup.appendChild(btnRow);
    pageView.container.appendChild(popup);

    textarea.focus();
  }
}
