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
import { clerkAllowedRedirectOrigins } from './auth/storefrontOrigins';

function AppRoot() {
  const publishableKey = getClerkPublishableKey();
  const clerkOn = isClerkConfigured();
  if (!clerkOn || !publishableKey) {
    return <App />;
  }
  return (
    <ClerkProvider
      publishableKey={publishableKey}
      afterSignOutUrl="/store/login"
      allowedRedirectOrigins={clerkAllowedRedirectOrigins()}
    >
      <App />
    </ClerkProvider>
  );
}

const root = document.getElementById('root')!;
createRoot(root).render(
  <StrictMode>
    <AppRoot />
  </StrictMode>,
);
