import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // NSFWJS ships several on-demand ML model shards, each just under 6 MB.
    // They are loaded only for video calls, so this limit prevents a false alarm.
    chunkSizeWarningLimit: 6000
  }
});
