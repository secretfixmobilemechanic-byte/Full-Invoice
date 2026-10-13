
/* Secret Fix Invoice Maker — scoped, network-first navigation */

const CACHE_NAME = 'secret-fix-full-invoice-v3';

const APP_FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './app-icon.png',
  './secret-fix-logo.png',
  './secret-fix-skull.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key =>
            key.startsWith('secret-fix-') &&
            key !== CACHE_NAME
          )
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;

  if (
    request.method !== 'GET' ||
    new URL(request.url).origin !== self.location.origin
  ) return;

  const scope = new URL(self.registration.scope);

  if (
    !new URL(request.url).pathname.startsWith(scope.pathname)
  ) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();

            event.waitUntil(
              caches.open(CACHE_NAME)
                .then(cache => cache.put(request, copy))
            );
          }

          return response;
        })
        .catch(() =>
          caches.match(request)
            .then(cached =>
              cached || caches.match('./index.html')
            )
        )
    );
    return;
  }

  event.respondWith(
    caches.match(request)
      .then(cached =>
        cached || fetch(request)
          .then(response => {
            if (response.ok) {
              const copy = response.clone();

              event.waitUntil(
                caches.open(CACHE_NAME)
                  .then(cache => cache.put(request, copy))
              );
            }

            return response;
          })
      )
  );
});
