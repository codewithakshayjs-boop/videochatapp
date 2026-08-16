import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // TensorFlow.js is lazy-loaded for video moderation; its isolated 1.88 MB
    // chunk is expected and no longer part of the initial application bundle.
    chunkSizeWarningLimit: 2000
  }
});
