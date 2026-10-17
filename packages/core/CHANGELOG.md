# @tbib-pdf-viewer/core

## 0.2.1

### Patch Changes

- Add DOM TextLayer rendering with standard styles for high-fidelity text selection and native copying in Pan and Select modes
- Handle pointer event pass-through on text spans while keeping background pan and annotation dragging fluid

## 0.2.0

### Minor Changes

- 55d9af1: Initial release of `@tbib-pdf-viewer/core` and `@tbib-pdf-viewer/react`.
  - Framework-agnostic PDF viewing engine with bundled worker.
  - Vector annotations (pen, highlight with RTL/Arabic support & scanned fallback, rectangle, ellipse, note pins).
  - Full Undo/Redo command history stack.
  - JSON serialization (`AnnotationDocument`) and flattened PDF export via `pdf-lib`.
  - React wrapper (`<PdfViewer>`, `<PdfToolbar>`).
- Fix download icon, improve phone responsiveness, add loading and failed states, add mobile pinch-to-zoom, add top-bar file upload, and require clicking twice on active tools to open styling properties.
