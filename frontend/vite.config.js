import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    open: true,
  },
  // SPA fallback - serve index.html for all routes
  appType: 'spa',
});
