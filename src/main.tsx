// Ensure window.fetch is writable and does not throw getter-only errors
(function () {
  try {
    if (typeof window !== 'undefined') {
      const _orig = window.fetch;
      let _curr = _orig;
      try {
        Object.defineProperty(window, 'fetch', {
          get: () => _curr,
          set: (v) => {
            _curr = v;
          },
          configurable: true,
          enumerable: true,
        });
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* ignore */
  }
})();

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App.tsx';
import './index.css';
import { getClerkPublishableKey, isClerkConfigured } from './auth/clerkSession';

const root = document.getElementById('root')!;
const publishableKey = getClerkPublishableKey();

createRoot(root).render(
  <StrictMode>
    {isClerkConfigured() ? (
      <ClerkProvider publishableKey={publishableKey} afterSignOutUrl="/">
        <App />
      </ClerkProvider>
    ) : (
      <App />
    )}
  </StrictMode>,
);
