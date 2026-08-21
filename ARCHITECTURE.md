# TBiB PDF Viewer — Architecture & Spec

## 1. Goal

An open-source, framework-agnostic PDF viewer with built-in annotation tools
(pen/brush, highlight, shapes, text notes), published to npm, free for anyone
to install and drop into their project by passing a `pdfSrc` prop/param.

Inspiration for the gap this fills: existing viewers are either missing
annotation features or are paid/closed-source (e.g. PSPDFKit-tier products).

## 2. Package Structure (monorepo, pnpm workspaces)

```
tbib-pdf-viewer/
├── packages/
│   ├── core/          → @tbib-pdf-viewer/core   (framework-agnostic engine)
│   ├── react/          → @tbib-pdf-viewer/react   (React wrapper)
│   └── demo/            → Next.js demo/docs site (not published)
├── pnpm-workspace.yaml
├── package.json
└── turbo.json (optional, if build graph gets complex)
```

Rationale: the core must not depend on React so that Vue/Svelte/vanilla-JS
users can adopt it later. React wrapper is a thin adapter package.

## 3. Core Dependencies

| Concern              | Library         | Why |
|-----------------------|-----------------|-----|
| PDF rendering          | `pdfjs-dist` (PDF.js) | Battle-tested, used in Firefox, handles parsing/rendering to canvas |
| Freehand strokes       | `perfect-freehand` | Produces natural, pressure-like smooth strokes without hand-rolled math |
| PDF export/merge       | `pdf-lib`        | Burn annotations into a real PDF for download/export |
| Bundling                | `tsup`           | ESM + CJS + `.d.ts` in one config, zero-hassle |
| Testing                 | `vitest`         | Fast, works well with TS/ESM |
| Versioning/publish      | `changesets`     | Standard for monorepo npm packages |

## 4. Worker Configuration

`pdfjs-dist` parses/renders PDFs off the main thread via a web worker. The
worker file ships **inside the package bundle** and is wired up
automatically — consumers should not need to configure anything to get a
working viewer:

```ts
GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();
```

An optional `workerSrc` field is exposed on the `PdfAnnotator` config for
consumers who want to self-host the worker file elsewhere (e.g. serve it
from their own domain instead of relying on the bundler's resolution). No
CDN (unpkg, jsdelivr, etc.) is used by default — a third-party CDN as a
default dependency would make the viewer fail if that CDN is down or
serves a mismatched version, and is an unnecessary runtime dependency for
something that should just work out of the box.

## 5. Rendering Architecture

Two stacked layers per page, absolutely positioned:

1. **PDF canvas** — rendered by PDF.js (`page.render()`), read-only.
2. **Annotation canvas (or SVG) overlay** — same dimensions, transparent
   background, captures pointer events for drawing tools.

On zoom/resize, both layers re-render at the new scale. Annotation
coordinates are stored in **PDF-space (unscaled) units**, not pixels, so
they stay correct across zoom levels and device pixel ratios.

## 6. Annotation Data Model

Annotations are stored as vector JSON, not rasterized pixels — this keeps
them resolution-independent and exportable/importable.

```ts
type AnnotationType = 'stroke' | 'highlight' | 'rectangle' | 'ellipse' | 'note' | 'text';

interface BaseAnnotation {
  id: string;
  type: AnnotationType;
  page: number;          // 1-indexed
  color: string;
  createdAt: number;
  authorId?: string;
}

interface StrokeAnnotation extends BaseAnnotation {
  type: 'stroke';
  points: [number, number, number?][]; // x, y, pressure — PDF-space units
  strokeWidth: number;
}

interface HighlightAnnotation extends BaseAnnotation {
  type: 'highlight';
  rects: { x: number; y: number; width: number; height: number }[]; // text-selection quads
}

interface ShapeAnnotation extends BaseAnnotation {
  type: 'rectangle' | 'ellipse';
  x: number; y: number; width: number; height: number;
}

interface NoteAnnotation extends BaseAnnotation {
  type: 'note';
  x: number; y: number;
  content: string;
}
```

Document-level export shape:

```ts
interface AnnotationDocument {
  version: 1;
  pdfHash?: string;      // optional integrity check against source PDF
  annotations: BaseAnnotation[];
}
```

## 7. Core API (framework-agnostic)

```ts
import { PdfAnnotator } from '@tbib-pdf-viewer/core';

const annotator = new PdfAnnotator({
  container: document.getElementById('viewer'),
  pdfSrc: '/path/or/url/to.pdf',
  annotations: savedAnnotationDocument,   // optional — AnnotationDocument from a previous session, rendered on load
  onChange: (doc) => save(doc),           // fired on every add/delete/move — always the full current AnnotationDocument
  tool: 'pen',            // 'pen' | 'highlight' | 'rectangle' | 'ellipse' | 'note' | 'select' | 'pan'
  color: '#ff0000',
  strokeWidth: 3,
});

annotator.setTool('highlight');
annotator.undo();
annotator.redo();
annotator.exportAnnotations();       // → AnnotationDocument (same shape passed to onChange / annotations)
annotator.exportPdfWithAnnotations(); // → Blob, via pdf-lib
annotator.destroy();
```

`onChange` is debounced internally (e.g. ~300ms after the pointer/drag ends,
not on every intermediate point) so consumers can wire it straight to a
save call without building their own debounce.

Undo/redo via a simple command stack (push a command object on every
add/delete/move; undo/redo replay inverse/forward commands).

## 8. React Wrapper API

```tsx
import { PdfViewer } from '@tbib-pdf-viewer/react';

<PdfViewer
  pdfSrc={fileOrUrl}
  annotations={savedDoc}          // optional — pass a previously-saved AnnotationDocument to restore old drawings
  onChange={(doc) => save(doc)}   // called with the updated AnnotationDocument whenever annotations change
  tool="pen"
  color="#ff0000"
/>
```

These three (`pdfSrc`, `annotations`, `onChange`) are the only props most
consumers need: pass a PDF source, optionally seed it with a previously
saved `AnnotationDocument`, and get the updated document back on every
change to persist it (e.g. to Supabase).

Thin wrapper: mounts a `PdfAnnotator` instance in a `useEffect`, syncs
props → imperative calls, exposes annotations via the `onChange` callback.

## 9. MVP Feature Scope

- [ ] Render PDF (multi-page, virtualized/lazy for large docs)
- [ ] Zoom + pan
- [ ] Pen/brush tool (freehand strokes)
- [ ] Highlight tool (drag over rendered text)
- [ ] Rectangle/ellipse shape tool
- [ ] Text note/pin tool
- [ ] Undo/redo
- [ ] Export annotations as JSON
- [ ] Import annotations from JSON
- [ ] Export flattened PDF (annotations burned in) via pdf-lib
- [ ] Color + stroke-width picker (UI is consumer's responsibility — core exposes state only)

## 10. Out of Scope for v1

- Real-time multi-user collaboration (can be layered on top later via any
  websocket provider — architecture should not block this)
- OCR / text extraction beyond what PDF.js gives for free
- Mobile native (React Native) — web only for v1

## 11. License

MIT — required for "anyone can download free and use in their project."
