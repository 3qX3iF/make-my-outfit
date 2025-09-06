const CACHE_NAME = "make-my-outfit-cache-v1";
const URLS_TO_CACHE = [
  "./",                // index.html
  "./index.html",
  "./app.js",
  "./manifest.json",
  "./styles.css",      // if you have one
  "./icons/icon-192x192.png",
  "./icons/icon-512x512.png"
];

// Install SW and cache files
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(URLS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate SW and clean old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch handler – cache first, fallback to network
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).catch(() => {
        // Optional: return a fallback page/image if offline and not cached
      });
    })
  );
});
