const CACHE_NAME = 'mw-partner-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/oferty.html',
  '/aktualnosci.html',
  '/kalkulator-kredytowy.html',
  '/artykul-home-staging.html',
  '/artykul-trendy-2025.html',
  '/poradnik-kupno-mieszkania.html',
  '/assets/css/style.css',
  '/assets/css/chatbot.css',
  '/assets/js/main.js',
  '/assets/js/chatbot.js',
  '/assets/js/modal.js',
  '/assets/js/kalkulator.js',
  '/assets/images/logo.png'
];
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
});
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
