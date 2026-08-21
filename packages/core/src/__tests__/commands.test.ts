import { describe, it, expect } from 'vitest';
import { CommandManager } from '../commands/command-manager';
import {
  AddAnnotationCommand,
  DeleteAnnotationCommand,
  UpdateAnnotationCommand,
} from '../commands/command';
import { StrokeAnnotation } from '../types';

describe('CommandManager and Undo/Redo', () => {
  it('should execute, undo, and redo add annotation commands', () => {
    const list: StrokeAnnotation[] = [];
    const manager = new CommandManager();

    const annotation: StrokeAnnotation = {
      id: 'stroke_1',
      type: 'stroke',
      page: 1,
      color: '#ff0000',
      strokeWidth: 3,
      points: [[10, 10], [20, 20]],
      createdAt: 1000,
    };

    const cmd = new AddAnnotationCommand(
      annotation,
      (a) => list.push(a as StrokeAnnotation),
      (id) => {
        const idx = list.findIndex((x) => x.id === id);
        if (idx !== -1) list.splice(idx, 1);
      }
    );

    manager.execute(cmd);
    expect(list.length).toBe(1);
    expect(list[0].id).toBe('stroke_1');
    expect(manager.canUndo()).toBe(true);
    expect(manager.canRedo()).toBe(false);

    // Undo
    manager.undo();
    expect(list.length).toBe(0);
    expect(manager.canUndo()).toBe(false);
    expect(manager.canRedo()).toBe(true);

    // Redo
    manager.redo();
    expect(list.length).toBe(1);
    expect(list[0].id).toBe('stroke_1');
  });

  it('should properly update annotations with undo and redo', () => {
    let current: StrokeAnnotation = {
      id: 'stroke_1',
      type: 'stroke',
      page: 1,
      color: '#ff0000',
      strokeWidth: 3,
      points: [[0, 0]],
      createdAt: 1000,
    };

    const updated: StrokeAnnotation = {
      ...current,
      color: '#0000ff',
      strokeWidth: 5,
    };

    const manager = new CommandManager();
    const cmd = new UpdateAnnotationCommand(
      current,
      updated,
      (ann) => {
        current = ann as StrokeAnnotation;
      }
    );

    manager.execute(cmd);
    expect(current.color).toBe('#0000ff');
    expect(current.strokeWidth).toBe(5);

    manager.undo();
    expect(current.color).toBe('#ff0000');
    expect(current.strokeWidth).toBe(3);

    manager.redo();
    expect(current.color).toBe('#0000ff');
  });
});
