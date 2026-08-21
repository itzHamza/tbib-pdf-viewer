# Implementation Plan for Claude Code Agent

> Read `ARCHITECTURE.md` first — it defines the full spec, data model, and
> API surface referenced below. Follow these phases **in order**. Do not
> skip ahead to React/demo work before the core engine is functional.

## Phase 0 — Repo bootstrap

1. Init pnpm workspace monorepo:
   - `pnpm-workspace.yaml` listing `packages/*`
   - Root `package.json` with shared devDependencies (`typescript`, `tsup`, `vitest`, `changesets`)
   - `packages/core`, `packages/react`, `packages/demo`
   - Root `tsconfig.base.json`, each package extends it
2. Set up ESLint + Prettier at root, shared config.
3. Add MIT `LICENSE` file and root `README.md` (can be filled in later phases).
4. Git init, `.gitignore` (node_modules, dist, .turbo).

## Phase 1 — Core: PDF rendering only (no annotations yet)

1. In `packages/core`, add `pdfjs-dist` as a dependency.
2. Configure the PDF.js worker per `ARCHITECTURE.md` §4 — bundle the worker file and set `GlobalWorkerOptions.workerSrc` automatically via `import.meta.url`, plus expose an optional `workerSrc` config override. Do not default to a CDN.
3. Implement `PdfAnnotator` class skeleton:
   - Constructor accepts `{ container, pdfSrc }`
   - Loads the PDF via `pdfjs-dist`, renders page 1 to a `<canvas>` inside `container`
   - Handle `pdfSrc` as: URL string, `File`/`Blob`, or `ArrayBuffer`
3. Add pagination (render page N, `goToPage(n)`, `nextPage()`, `prevPage()`)
4. Add zoom (`setZoom(scale)`) and pan.
5. Write a minimal Vitest test that loads a small sample PDF (add one to `packages/core/fixtures/`) and asserts the canvas renders without throwing.
6. **Checkpoint:** confirm this builds with `tsup` and produces valid ESM+CJS+d.ts output before continuing.

## Phase 2 — Core: annotation overlay + pen tool

1. Add a second `<canvas>` (or SVG layer — pick canvas for perf) absolutely positioned over the PDF canvas, matched to page dimensions.
2. Implement pointer event capture (`pointerdown`/`pointermove`/`pointerup`) that feeds points into `perfect-freehand`.
3. Implement the `StrokeAnnotation` data model from `ARCHITECTURE.md` §6.
4. Store annotation coordinates in PDF-space units (divide by current scale before storing, multiply by scale when rendering).
5. Implement `setTool('pen' | 'select' | 'pan')` state machine.
6. Implement the command-stack undo/redo (`undo()`, `redo()`) for add/delete of strokes.
7. Write tests: adding a stroke updates internal state; undo removes it; redo restores it.

## Phase 3 — Core: remaining annotation types

1. Highlight tool — needs text-layer positions from PDF.js (`getTextContent()` + `getViewport()`) to compute selectable quads.
2. Rectangle/ellipse shape tool — simple drag-to-draw.
3. Note/pin tool — click to place, attach text content.
4. Extend the command stack to cover all annotation types uniformly (generic `AddAnnotationCommand`, `DeleteAnnotationCommand`, `MoveAnnotationCommand`).

## Phase 4 — Core: import/export

1. `exportAnnotations()` → returns `AnnotationDocument` (JSON-serializable, per §6).
2. `importAnnotations(doc)` → validates `version` field, replaces/merges current annotation state, re-renders overlay.
3. `exportPdfWithAnnotations()` using `pdf-lib`:
   - Load original PDF bytes
   - For each page, draw vector representations of strokes/shapes/highlights onto the corresponding `pdf-lib` page
   - Return a `Blob`
4. Tests: round-trip export → import → export produces identical `AnnotationDocument` (minus timestamps).

## Phase 5 — React wrapper package

1. `packages/react`: peer-dep on `react` + `react-dom`, dependency on `@tbib-pdf-viewer/core`.
2. `<PdfViewer>` component per `ARCHITECTURE.md` §7:
   - `useRef` container div, mount `PdfAnnotator` in `useEffect`, `destroy()` on unmount
   - Sync `tool`/`color`/`strokeWidth` props to imperative setters on prop change
   - `onChange` fires on the core's `annotation:add`/`delete`/`update` events (debounced), passing the full `AnnotationDocument`
   - `annotations` prop (initial saved `AnnotationDocument`) is loaded on mount to restore prior drawings
3. Basic unstyled toolbar subcomponent (`<PdfToolbar>`) as an optional convenience export — tool buttons, color swatch, undo/redo. Keep it minimal and unopinionated on styling (expose `className` hooks).

## Phase 6 — Demo / docs site

1. `packages/demo`: Next.js app (matches existing stack conventions).
2. One page: file upload or URL input → renders `<PdfViewer>` with a toolbar, shows live annotation JSON in a side panel, "Download annotated PDF" button.
3. Deployable as the project's docs/landing page.

## Phase 7 — Publish prep

1. Add `changesets` config; write initial changeset for `0.1.0` of both `@tbib-pdf-viewer/core` and `@tbib-pdf-viewer/react`.
2. Verify `package.json` `exports`/`main`/`module`/`types` fields are correct in both packages (test with `pnpm pack` + install in a throwaway project).
3. Write real `README.md` for each package: install command, quickstart snippet, link to demo.
4. Confirm `LICENSE` (MIT) is present in both published packages.
5. `pnpm changeset publish` (dry run first).

## Notes for the agent

- Keep `packages/core` free of any DOM-framework dependency — this is a hard constraint, not a suggestion.
- Prefer small, incremental commits per numbered step above over one giant commit.
- If a step is ambiguous or you hit a design decision not covered in `ARCHITECTURE.md`, stop and flag it rather than guessing silently — the human will review.
- Any errors or blockers encountered should be reported back with enough context (error message, which phase/step) to be handed to Claude (chat) for debugging help.
