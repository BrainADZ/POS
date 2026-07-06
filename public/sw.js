/* Scran POS - simple offline-first service worker (demo) */
const CACHE = 'scran-pos-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(['/', '/index.html', '/manifest.json', '/icon.svg'])));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

// Cache-first with network fallback + runtime caching for same-origin GET requests.
// The /api/ payment endpoints must never be cached — they are live session state.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || !request.url.startsWith(self.location.origin)) return;
  if (new URL(request.url).pathname.startsWith('/api/')) return;
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request)
          .then((resp) => {
            if (resp.ok) {
              const copy = resp.clone();
              caches.open(CACHE).then((c) => c.put(request, copy));
            }
            return resp;
          })
          .catch(() => caches.match('/index.html'))
    )
  );
});
