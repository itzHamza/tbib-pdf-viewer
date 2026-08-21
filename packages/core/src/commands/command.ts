import { Annotation } from '../types';

export interface Command {
  execute(): void;
  undo(): void;
  description?: string;
}

export class AddAnnotationCommand implements Command {
  constructor(
    private annotation: Annotation,
    private addFn: (annotation: Annotation) => void,
    private removeFn: (id: string) => void
  ) {}

  execute(): void {
    this.addFn(this.annotation);
  }

  undo(): void {
    this.removeFn(this.annotation.id);
  }
}

export class DeleteAnnotationCommand implements Command {
  constructor(
    private annotation: Annotation,
    private addFn: (annotation: Annotation) => void,
    private removeFn: (id: string) => void
  ) {}

  execute(): void {
    this.removeFn(this.annotation.id);
  }

  undo(): void {
    this.addFn(this.annotation);
  }
}

export class UpdateAnnotationCommand implements Command {
  constructor(
    private prevAnnotation: Annotation,
    private newAnnotation: Annotation,
    private updateFn: (annotation: Annotation) => void
  ) {}

  execute(): void {
    this.updateFn(this.newAnnotation);
  }

  undo(): void {
    this.updateFn(this.prevAnnotation);
  }
}
