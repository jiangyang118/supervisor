import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    host: true,
    port: 4300,
    proxy: {
      '/api': {
        target: 'http://localhost:3300',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // Fallback: if VITE_API_BASE is empty and code calls '/reg/*' directly
      '/reg': {
        target: 'http://localhost:3300',
        changeOrigin: true,
      },
    },
  },
});
