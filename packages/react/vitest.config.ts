import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@tbib-pdf-viewer/core': path.resolve(__dirname, '../core/src/index.ts'),
    },
  },
});
