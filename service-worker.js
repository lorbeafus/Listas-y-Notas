const CACHE_NAME = 'Agenda-docente-v1';
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
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached response if found, else fetch from network
        return response || fetch(event.request);
      })
  );
});

