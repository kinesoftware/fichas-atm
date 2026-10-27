const CACHE_NAME = "fichas-atm-v1";
const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon.svg",
  "./css/styles.css",
  "./css/base.css",
  "./css/library.css",
  "./css/form.css",
  "./css/compare.css",
  "./css/print.css",
  "./js/app.bundle.js",
  "./js/app.js",
  "./js/storage/db.js",
  "./js/core/ficha-rules.mjs",
  "./js/core/ficha-compare.mjs",
  "./js/modules/dom.js",
  "./js/modules/form.js",
  "./js/modules/form-image.js",
  "./js/modules/form-restrictions.js",
  "./js/modules/library.js",
  "./js/modules/library-rows.js",
  "./js/modules/compare.js",
  "./js/modules/print.js",
  "./js/modules/settings.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((networkResponse) => {
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          networkResponse.type === "basic"
        ) {
          const toCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, toCache);
          });
        }
        return networkResponse;
      }).catch(() => caches.match("./index.html"));
    })
  );
});
