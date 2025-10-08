const CACHE = 'comisionesgo-v6';
const ASSETS = [
  '/', '/index.html', '/styles.css', '/app.js', '/manifest.json',
  '/data/tabuladores.json', '/data/financiamiento.json', '/data/seguros.json', '/data/garantias.json'
];
self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(ASSETS);
    self.skipWaiting();
  })());
});
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    self.clients.claim();
  })());
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin === location.origin) {
    e.respondWith((async () => {
      const cached = await caches.match(e.request);
      return cached || fetch(e.request);
    })());
  }
});
