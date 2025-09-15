const CACHE = "commissions-pwa-v2"; // ← sube la versión
const ASSETS = [
  "/",
  "/index.html",
  "/css/styles.css",
  "/js/settings.js",
  "/js/store.js",
  "/js/calc.js",
  "/js/export.js",
  "/js/ui.js",
  "/js/app.js",
  "/data/commissions.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png", // ← añade
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (url.pathname.endsWith("/data/commissions.json")) {
    // Stale-While-Revalidate con notificación de update
    e.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        const cached = await cache.match(e.request);
        const fetchPromise = fetch(e.request)
          .then((networkResp) => {
            if (cached) {
              // comparar versiones (hash simple por tamaño)
              if (
                networkResp.status === 200 &&
                networkResp.headers.get("content-length") !==
                  cached.headers.get("content-length")
              ) {
                cache.put(e.request, networkResp.clone());
                notifyClientsUpdate();
              } else {
                cache.put(e.request, networkResp.clone());
              }
            } else {
              cache.put(e.request, networkResp.clone());
            }
            return networkResp.clone();
          })
          .catch(() => cached);
        return cached || fetchPromise;
      })()
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then((resp) => resp || fetch(e.request))
  );
});

async function notifyClientsUpdate() {
  const clients = await self.clients.matchAll({ includeUncontrolled: true });
  clients.forEach((c) => c.postMessage("UPDATE_AVAILABLE"));
}
