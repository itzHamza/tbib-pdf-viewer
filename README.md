# 📄 TBiB PDF Viewer

[![npm version (react)](https://img.shields.io/npm/v/@tbib-pdf-viewer/react.svg?color=6965db&label=react)](https://www.npmjs.com/package/@tbib-pdf-viewer/react)
[![npm version (core)](https://img.shields.io/npm/v/@tbib-pdf-viewer/core.svg?color=6965db&label=core)](https://www.npmjs.com/package/@tbib-pdf-viewer/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?logo=vercel)](https://tbib-pdf-viewer-demo.vercel.app/)

An open-source, high-performance PDF viewer and annotator with an **Excalidraw-grade UI**. Built for modern web applications with zero external canvas bloat.

🔗 **[Live Interactive Demo ➔](https://tbib-pdf-viewer-demo.vercel.app/)**

---

## ✨ Features

- 🎨 **Excalidraw-Grade Controls**: Floating dock toolbar with Font Awesome icons, dynamic keyboard shortcuts (`1`–`6`, `H`), and anchored styling popup cards (Stroke, Background, Thickness, Opacity).
- 🖋️ **Pressure-Sensitive Freehand Drawing**: Smooth, natural ink strokes powered by `perfect-freehand`.
- 🔍 **Smart Text Highlighter**: Sub-character snapping text highlighting with native support for **RTL (Arabic/Hebrew)** and automatic fallback for scanned pages.
- 📐 **Vector Shapes & Note Pins**: Precise Rectangles, Ellipses, and sleek sticker-style Note Cards with inline popover text editors.
- ⚡ **High-DPI & Lazy Multi-Page Rendering**: 2-layer vector architecture (PDF canvas + PDF-space unscaled overlay) with `IntersectionObserver` viewport rendering for 100+ page documents.
- 💾 **Native Flattened PDF Export**: Export annotated documents directly to standard flattened PDF files via `pdf-lib` without quality loss.
- 🔄 **Undo / Redo System**: Command-pattern transaction manager supporting unlimited history and `Ctrl+Z` / `Ctrl+Y` shortcuts.
- 📱 **Self-Contained & Responsive**: Designed to run seamlessly either full-window or inside responsive inline containers (e.g. `65vw` × `82vh`).

---

## 📦 Packages

| Package | Description | Version |
|---|---|---|
| [`@tbib-pdf-viewer/core`](https://www.npmjs.com/package/@tbib-pdf-viewer/core) | Framework-agnostic PDF rendering & annotation engine | [![npm](https://img.shields.io/npm/v/@tbib-pdf-viewer/core)](https://www.npmjs.com/package/@tbib-pdf-viewer/core) |
| [`@tbib-pdf-viewer/react`](https://www.npmjs.com/package/@tbib-pdf-viewer/react) | Ready-to-use React components (`<PdfViewer>`, `<PdfToolbar>`) | [![npm](https://img.shields.io/npm/v/@tbib-pdf-viewer/react)](https://www.npmjs.com/package/@tbib-pdf-viewer/react) |

---

## 🚀 Quick Start (React)

### 1. Install

```bash
npm install @tbib-pdf-viewer/react @tbib-pdf-viewer/core
```

### 2. Usage

```tsx
import React, { useRef, useState } from 'react';
import { PdfViewer, PdfToolbar } from '@tbib-pdf-viewer/react';
import type { PdfAnnotator, ToolType } from '@tbib-pdf-viewer/core';

export function DocumentViewer() {
  const annotatorRef = useRef<PdfAnnotator | null>(null);
  const [tool, setTool] = useState<ToolType>('pen');
  const [color, setColor] = useState('#1e1e1e');
  const [fillColor, setFillColor] = useState('transparent');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [opacity, setOpacity] = useState(1.0);

  const handleExport = async () => {
    if (!annotatorRef.current) return;
    const blob = await annotatorRef.current.exportPdfWithAnnotations();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'annotated-document.pdf';
    a.click();
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
      {/* Floating Excalidraw Toolbar */}
      <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 50 }}>
        <PdfToolbar
          annotator={annotatorRef.current}
          currentTool={tool}
          onToolChange={setTool}
          currentColor={color}
          onColorChange={setColor}
          currentFillColor={fillColor}
          onFillColorChange={setFillColor}
          strokeWidth={strokeWidth}
          onStrokeWidthChange={setStrokeWidth}
          opacity={opacity}
          onOpacityChange={setOpacity}
          onExportPdf={handleExport}
        />
      </div>

      {/* PDF Viewer */}
      <PdfViewer
        pdfSrc="/path/to/document.pdf"
        tool={tool}
        color={color}
        fillColor={fillColor}
        opacity={opacity}
        strokeWidth={strokeWidth}
        onAnnotatorReady={(annotator) => {
          annotatorRef.current = annotator;
        }}
        onChange={(doc) => {
          console.log('Annotations updated:', doc);
        }}
      />
    </div>
  );
}
```

---

## 🛠️ Vanilla JavaScript / TypeScript

```ts
import { PdfAnnotator } from '@tbib-pdf-viewer/core';

const container = document.getElementById('pdf-root')!;

const annotator = new PdfAnnotator({
  container,
  pdfSrc: 'https://example.com/sample.pdf',
  tool: 'pen',
  color: '#6965db',
  strokeWidth: 3,
  onChange: (doc) => {
    console.log('Live Annotations:', doc);
  },
});

// Switch tool
annotator.setTool('rectangle');

// Export annotated PDF
const pdfBlob = await annotator.exportPdfWithAnnotations();
```

---

## 📄 License

MIT © [itzHamza](https://github.com/itzHamza)
