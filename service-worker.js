const CACHE = 'hondago-commissions-v1';
const ASSETS = [
  'index.html','manifest.json',
  'assets/css/styles.css',
  'assets/js/app.js','assets/js/store.js','assets/js/calc.js','assets/js/ui.js','assets/js/export.js',
  'assets/data/commissions.json','assets/data/addons.json',
  'assets/icons/io-192.png','assets/icons/io-512.png','assets/icons/io-maskable-512.png'
];
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    for (const url of ASSETS) {
      try { await cache.add(new Request(url, { cache: 'no-cache' })); }
      catch (err) { console.warn('[SW] Omitiendo asset en precache:', url, err); }
    }
  })());
});
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', (event) => {
  const req = event.request;
  event.respondWith((async () => {
    const sameOrigin = new URL(req.url).origin === self.location.origin;
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      const net = await fetch(req);
      if (sameOrigin && req.method === 'GET') {
        const cache = await caches.open(CACHE);
        cache.put(req, net.clone());
      }
      return net;
    } catch (e) {
      return cached || Response.error();
    }
  })());
});
