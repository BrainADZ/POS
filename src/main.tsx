import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initCrossTabSync } from './store/posStore';
import './index.css';

initCrossTabSync();

// Register the service worker for offline support (production build only,
// so it never interferes with the Vite dev server).
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* offline support is best-effort in the demo */
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
