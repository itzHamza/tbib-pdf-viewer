# @tbib-pdf-viewer/react

React wrapper and functional toolbar components for TBiB PDF Viewer.

## Installation

```bash
npm install @tbib-pdf-viewer/react @tbib-pdf-viewer/core
```

## Quickstart

```tsx
import React, { useState } from 'react';
import { PdfViewer, PdfToolbar, AnnotationDocument, ToolType } from '@tbib-pdf-viewer/react';

export function MyViewer() {
  const [tool, setTool] = useState<ToolType>('pen');
  const [color, setColor] = useState('#ff0000');
  const [annotations, setAnnotations] = useState<AnnotationDocument>();

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <PdfToolbar
        currentTool={tool}
        onToolChange={setTool}
        currentColor={color}
        onColorChange={setColor}
      />
      <div style={{ flex: 1 }}>
        <PdfViewer
          pdfSrc="/my-document.pdf"
          tool={tool}
          color={color}
          onChange={(doc) => setAnnotations(doc)}
        />
      </div>
    </div>
  );
}
```

## License

MIT
