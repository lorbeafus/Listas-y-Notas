const CACHE_NAME = 'Agenda-docente-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './pages/notas.html',
  './pages/asistencia.html',
  './assets/css/index.css',
  './assets/css/notas.css',
  './assets/css/asistencia.css',
  './js/index.js',
  './js/notas.js',
  './js/asistencia.js',
  './manifest.json',
  './assets/img/logo_agenda.png',
  './assets/img/icon-192.png',
  './assets/img/screenshot-desktop.png',
  './assets/img/screenshot-mobile.png',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests for caching
  if (event.request.method !== 'GET') return;

  // For external resources or CDNs, cache first is fine, but for local app files, network first is better.
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // If successful, update the cache and return network response
        if (networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // If offline or network fails, fallback to cache
        return caches.match(event.request);
      })
  );
});


