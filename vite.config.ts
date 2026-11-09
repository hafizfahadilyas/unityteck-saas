import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv, type Plugin} from 'vite';

/** Public Clerk pk_ — same as src/auth/clerkSession.ts fallback (safe in SPA). */
const CLERK_PUBLISHABLE_KEY_FALLBACK =
  'pk_test_cXVpZXQtYWxiYWNvcmUtMzkwNi5jbGVyay5hY2NvdW50cy5kZXYk';

function resolveClerkPublishableKey(raw: string): string {
  const trimmed = String(raw || '').trim();
  if (
    (trimmed.startsWith('pk_test_') || trimmed.startsWith('pk_live_')) &&
    trimmed.length >= 24 &&
    !/x{3,}|REPLACE|your_key|xxxxx/i.test(trimmed)
  ) {
    return trimmed;
  }
  return CLERK_PUBLISHABLE_KEY_FALLBACK;
}

/** Bake Clerk publishable key into index.html so Hostinger static deploys never boot without it. */
function injectClerkPublishableKey(key: string): Plugin {
  return {
    name: 'inject-clerk-publishable-key',
    transformIndexHtml(html) {
      const trimmed = resolveClerkPublishableKey(key);
      const snippet = `<script>window.__CLERK_PUBLISHABLE_KEY=${JSON.stringify(trimmed)};</script>`;
      if (html.includes('window.__CLERK_PUBLISHABLE_KEY')) {
        return html.replace(
          /window\.__CLERK_PUBLISHABLE_KEY\s*=\s*[^;]+;/,
          `window.__CLERK_PUBLISHABLE_KEY=${JSON.stringify(trimmed)};`,
        );
      }
      return html.replace('<head>', `<head>\n    ${snippet}`);
    },
  };
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), '');
  const clerkPublishableKey = resolveClerkPublishableKey(
    String(env.VITE_CLERK_PUBLISHABLE_KEY || env.CLERK_PUBLISHABLE_KEY || ''),
  );

  return {
    envDir: process.cwd(),
    define: {
      // Ensure production bundles always receive a real pk_ even if CI secret was empty.
      'import.meta.env.VITE_CLERK_PUBLISHABLE_KEY': JSON.stringify(clerkPublishableKey),
    },
    plugins: [react(), tailwindcss(), injectClerkPublishableKey(clerkPublishableKey)],
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
        ignored: [
          '**/apps/api/**',
          '**/storage/**',
          '**/bootstrap/cache/**',
          '**/dist/**',
          '**/.git/**',
          '**/public/**',
          '**/_chrome_profile*/**',
          '**/New folder/**',
          '**/_newfolder_changes_backup/**',
        ],
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
      include: ['react', 'react-dom', 'lucide-react', 'motion', 'date-fns', 'ag-psd'],
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
            if (id.includes('node_modules/ag-psd')) {
              return 'vendor-ag-psd';
            }
          },
        },
      },
    },
    appType: 'spa' as const,
  };
});
