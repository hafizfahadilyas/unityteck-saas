// Ensure window.fetch is writable and does not throw getter-only errors
(function() {
  try {
    if (typeof window !== 'undefined') {
      const _orig = window.fetch;
      let _curr = _orig;
      try {
        Object.defineProperty(window, 'fetch', {
          get: () => _curr,
          set: (v) => { _curr = v; },
          configurable: true,
          enumerable: true,
        });
      } catch (e) {}
    }
  } catch (err) {}
})();

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
