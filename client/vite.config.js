import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Simple dev proxy so the client can call /api and /uploads without CORS
// juggling. In production, serve the built client behind the same host as
// the API (see README) or set VITE_API_BASE.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:4000',
      '/uploads': 'http://localhost:4000',
    },
  },
});
