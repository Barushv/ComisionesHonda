const CACHE = 'hondago-commissions-v3';
const ASSETS = [
  '/', '/index.html', '/manifest.json',
  '/assets/css/styles.css',
  '/assets/js/app.js','/assets/js/store.js','/assets/js/calc.js','/assets/js/ui.js','/assets/js/export.js',
  '/assets/data/commissions.json','/assets/data/addons.json',
  '/assets/icons/io-192.png','/assets/icons/io-512.png','/assets/icons/io-maskable-512.png'
];
self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
});
self.addEventListener('activate', e=>{
  e.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', e=>{
  const url = new URL(e.request.url);
  if(url.origin === location.origin){
    e.respondWith(caches.match(e.request).then(res=>res || fetch(e.request)));
  }
});
