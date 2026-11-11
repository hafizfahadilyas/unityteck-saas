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
      // SPA navigates itself after logout — afterSignOutUrl caused a hard remount / 2nd OTP.
      allowedRedirectOrigins={clerkAllowedRedirectOrigins()}
    >
      <App />
    </ClerkProvider>
  );
}

type UnityRootStore = typeof globalThis & {
  __unityteckReactRoot?: ReturnType<typeof createRoot>;
};

const container = document.getElementById('root')!;
const store = globalThis as UnityRootStore;

// HMR-safe: never call createRoot twice on #root (avoids nested ClerkProvider)
if (!store.__unityteckReactRoot) {
  store.__unityteckReactRoot = createRoot(container);
}

store.__unityteckReactRoot.render(
  <StrictMode>
    <AppRoot />
  </StrictMode>,
);

if (import.meta.hot) {
  import.meta.hot.accept();
}
