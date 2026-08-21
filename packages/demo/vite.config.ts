import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@tbib-pdf-viewer/core': path.resolve(__dirname, '../core/src'),
      '@tbib-pdf-viewer/react': path.resolve(__dirname, '../react/src'),
    },
  },
  server: {
    port: 3000,
  },
});
