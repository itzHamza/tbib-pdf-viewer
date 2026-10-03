# @tbib-pdf-viewer/react

## 0.2.0

### Minor Changes

- 55d9af1: Initial release of `@tbib-pdf-viewer/core` and `@tbib-pdf-viewer/react`.
  - Framework-agnostic PDF viewing engine with bundled worker.
  - Vector annotations (pen, highlight with RTL/Arabic support & scanned fallback, rectangle, ellipse, note pins).
  - Full Undo/Redo command history stack.
  - JSON serialization (`AnnotationDocument`) and flattened PDF export via `pdf-lib`.
  - React wrapper (`<PdfViewer>`, `<PdfToolbar>`).
- Fix download icon, improve phone responsiveness, add loading and failed states, add mobile pinch-to-zoom, add top-bar file upload, and require clicking twice on active tools to open styling properties.

### Patch Changes

- Updated dependencies [55d9af1]
- Updated dependencies
  - @tbib-pdf-viewer/core@0.2.0
