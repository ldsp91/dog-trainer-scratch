// Registers the service worker for offline support.
//
// The SW is a static file served from the site root (public/sw.js -> dist/sw.js),
// so it must be registered from the Vite base URL. On GitHub Pages project pages
// the base is e.g. "/dog-trainer-scratch/", and import.meta.env.BASE_URL gives
// that prefix.
//
// Registration is best-effort: it only runs in browsers that support SW and only
// when served over https (GitHub Pages is https; localhost is treated as secure).

export function registerServiceWorker(): void {
  if (
    'serviceWorker' in navigator &&
    (window.location.protocol === 'https:' ||
      window.location.hostname === 'localhost' ||
      /localhost/i.test(window.location.hostname) ||
      /\.local/i.test(window.location.hostname) ||
      /^127(\.\d{1,3}){3}$/.test(window.location.hostname) ||
      /^::1$/.test(window.location.hostname) ||
      window.location.protocol === 'file:')
  ) {
    navigator.serviceWorker
      .register(import.meta.env.BASE_URL + 'sw.js')
      .then((registration) => {
        // Scope must match the app base so the SW controls the whole app.
        console.log('PWA service worker registered', registration.scope);

        // If an existing SW for this scope already controls the page, re-register
        // to pick up the latest registration.
        if (navigator.serviceWorker.controller && registration.waiting) {
          registration.update();
        }

        // New content available: offer to reload.
        registration.onupdatefound = () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.onstatechange = () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              if (window.confirm('An update is available. Reload now?')) {
                navigator.serviceWorker.controller.postMessage('clientsClaim');
                window.location.reload();
              }
            }
          };
        };
      })
      .catch((error) => {
        console.warn('PWA service worker registration failed', error);
      });
  } else {
    console.log('Service worker not supported in this browser; offline mode disabled.');
  }
}
