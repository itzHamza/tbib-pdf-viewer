/**
 * Injected minimal PDF.js TextLayer CSS styles
 * Enables high-performance, transparent selectable text and native selection highlights.
 */
export function injectTextLayerStyles(): void {
  if (typeof document === 'undefined') return;
  const styleId = 'tbib-pdf-textlayer-styles';
  if (document.getElementById(styleId)) return;

  const styleEl = document.createElement('style');
  styleEl.id = styleId;
  styleEl.textContent = `
    .tbib-pdf-page-container {
      --scale-factor: 1;
    }
    .textLayer {
      position: absolute;
      text-align: initial;
      inset: 0;
      overflow: clip;
      opacity: 1;
      line-height: 1;
      -webkit-text-size-adjust: none;
      -moz-text-size-adjust: none;
      text-size-adjust: none;
      forced-color-adjust: none;
      transform-origin: 0 0;
      caret-color: transparent;
      z-index: 2;
    }
    .textLayer :is(span, br) {
      color: transparent;
      position: absolute;
      white-space: pre;
      cursor: text;
      transform-origin: 0% 0%;
    }
    .textLayer > :not(.markedContent),
    .textLayer .markedContent span:not(.markedContent) {
      z-index: 1;
    }
    .textLayer span.markedContent {
      top: 0;
      height: 0;
    }
    .textLayer span[role="img"] {
      -webkit-user-select: none;
      -moz-user-select: none;
      user-select: none;
      cursor: default;
    }
    .textLayer ::-moz-selection {
      background: rgba(0, 102, 255, 0.28);
      background: color-mix(in srgb, AccentColor, transparent 72%);
    }
    .textLayer ::selection {
      background: rgba(0, 102, 255, 0.28);
      background: color-mix(in srgb, AccentColor, transparent 72%);
    }
    .textLayer br::-moz-selection,
    .textLayer br::selection {
      background: transparent;
    }
    .textLayer .endOfContent {
      display: block;
      position: absolute;
      inset: 100% 0 0;
      z-index: 0;
      cursor: default;
      -webkit-user-select: none;
      -moz-user-select: none;
      user-select: none;
    }
  `;
  document.head.appendChild(styleEl);
}
