# @tbib-pdf-viewer/core

Framework-agnostic engine for PDF viewing and interactive annotations.

## Features

- **Built-in Annotations**: Freehand pen (via `perfect-freehand`), text-layer highlighting with RTL/Arabic support & scanned PDF fallback, rectangles, ellipses, and note pins.
- **Resolution Independent**: All annotations are stored in unscaled PDF coordinates.
- **Zero Config Worker**: Bundles `pdfjs-dist` worker automatically via `import.meta.url` with optional custom `workerSrc` override. No third-party CDN dependency.
- **Lazy Rendering**: Viewport-based on-demand canvas rendering for long documents and exam papers.
- **PDF Export**: Burn vector annotations directly into PDF files with `pdf-lib`.
- **Undo / Redo**: Integrated command stack.

## Installation

```bash
npm install @tbib-pdf-viewer/core
```

## Quickstart

```ts
import { PdfAnnotator } from '@tbib-pdf-viewer/core';

const annotator = new PdfAnnotator({
  container: document.getElementById('viewer')!,
  pdfSrc: '/sample.pdf',
  tool: 'pen',
  color: '#ff0000',
  strokeWidth: 3,
  onChange: (doc) => {
    console.log('Annotations changed:', doc);
  },
});

// Switch tool
annotator.setTool('highlight');

// Undo / Redo
annotator.undo();
annotator.redo();

// Export annotated PDF
const blob = await annotator.exportPdfWithAnnotations();
```

## License

MIT
