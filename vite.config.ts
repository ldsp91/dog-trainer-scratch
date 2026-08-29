import path from 'path';
import { defineConfig } from 'vite';

import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    allowedHosts: [
      "1515-2a02-8071-5cf1-3e0-1163-6d5f-fa13-d044.ngrok-free.app",
    ],
  },
});
