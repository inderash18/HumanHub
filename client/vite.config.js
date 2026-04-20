import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0', // Ensure visibility in Docker
    open: false,     // MUST be false in Docker/Headless to prevent loop/crashes
    watch: {
        usePolling: true, // Crucial for Docker on Windows/Mac
    },
    hmr: {
        clientPort: 80, // Browser is at port 80 (Nginx), not 3000
    }
  },
  build: {
    outDir: 'dist',
  },
});
