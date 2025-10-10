const CACHE='comisionesgo-v12';
const ASSETS=['./','./index.html','./styles.css','./app.js','./manifest.json','./data/tabuladores.json','./data/financiamiento.json','./data/seguros.json','./data/garantias.json'];
self.addEventListener('install',e=>{e.waitUntil((async()=>{const c=await caches.open(CACHE);await c.addAll(ASSETS);self.skipWaiting()})())});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{const ks=await caches.keys();await Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)));self.clients.claim()})())});
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(u.origin===location.origin){e.respondWith((async()=>{const r=await caches.match(e.request);return r||fetch(e.request)})())}});
