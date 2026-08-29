// Service worker for the Thunder Trainer PWA.
// Served statically from GitHub Pages (no build step), so it lives in public/
// and is copied to dist root by Vite. Register it from src/main.tsx.

const CACHE_VERSION = 'v1';
const SHELL_CACHE = `trainer-shell-${CACHE_VERSION}`;

// App-shell assets to pre-cache on install so the app works offline.
// Vite copies public/ to dist root, so these paths match the deployed site.
const SHELL_ASSETS = [
  '/',
  './',
  'manifest.json',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-512-maskable.png',
  'apple-touch-icon.png',
  '/src/main.tsx',
];

// Cache the app shell on install.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .catch(() => {
        // If addAll fails (e.g. a shell asset is missing), fall back to
        // precaching just the index so the app still launches offline.
        return caches.open(SHELL_CACHE).then((cache) => cache.add('/'));
      })
      .then(() => self.skipWaiting())
  );
});

// Activate: delete old caches so stale build assets don't pile up.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => (key === SHELL_CACHE ? undefined : caches.delete(key)))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Helper: respond to a fetch from cache, falling back to network.
function fromCacheOrNetwork(request, cache, networkFirst = true) {
  return caches.cache(request, { cacheName: SHELL_CACHE }).then((cached) => {
    if (cached) return cached;
    if (!networkFirst) return Response.error();
    return fetch(request).then((response) => {
      const responseToCache = response.clone();
      caches
        .open(SHELL_CACHE)
        .then((cache) => cache.put(request, responseToCache))
        .catch(() => undefined);
      return response;
    });
  });
}

// Runtime strategy.
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Navigation requests (page loads): network first, cache the result.
  if (request.mode === 'navigate') {
    return;
  }

  // Sound files: network first so new sounds are picked up, cache on success.
  if (request.url.match(/\.(mp3|wav|ogg|m4a)$/)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseToCache = response.clone();
          caches
            .open(SHELL_CACHE)
            .then((cache) => cache.put(request, responseToCache))
            .catch(() => undefined);
          return response;
        })
        .catch(() => caches.cache(request, { cacheName: SHELL_CACHE }))
    );
    return;
  }

  // Static app assets (JS, CSS, icons): cache first, refresh in background.
  if (request.url.startsWith(self.location.origin)) {
    event.respondWith(fromCacheOrNetwork(request, SHELL_CACHE, false));
    return;
  }

  // Everything else (fonts, external): go straight to network.
});

// Tell the page a new version of the SW is available so it can reload.
self.addEventListener('message', (event) => {
  if (event.data === 'clientsClaim') {
    self.clients.claim();
  }
});
