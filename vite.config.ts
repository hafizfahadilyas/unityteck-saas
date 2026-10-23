import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        ignored: ['**/apps/api/**', '**/storage/**', '**/bootstrap/cache/**', '**/dist/**', '**/.git/**', '**/public/**'],
      },
      // Soft SPA routes (/master/login, /store/login) must serve index.html
      // Proxy /api → Laravel artisan serve (see npm run api:serve)
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8010',
          changeOrigin: true,
        },
      },
    },
    preview: {
      port: 3010,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8010',
          changeOrigin: true,
        },
      },
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'lucide-react', 'motion', 'date-fns'],
    },
    build: {
      emptyOutDir: false,
      target: 'esnext',
      minify: 'esbuild',
      cssMinify: true,
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
              return 'vendor-react';
            }
            if (id.includes('node_modules/lucide-react/')) {
              return 'vendor-lucide';
            }
            if (id.includes('node_modules/motion/')) {
              return 'vendor-motion';
            }
          },
        },
      },
    },
    appType: 'spa' as const,
  };
});
