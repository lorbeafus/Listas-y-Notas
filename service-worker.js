const CACHE_NAME = 'listas-notas-v2';
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
  './assets/img/icon-192.png',
  './assets/img/icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached response if found, else fetch from network
        return response || fetch(event.request);
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
