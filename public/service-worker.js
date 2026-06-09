const CACHE_NAME = 'breathflow-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  // NOTE: For a Vite/Create React App project, you should add the paths
  // to your built JS and CSS files here. These often have hashes in their names.
  // Using a plugin like 'vite-plugin-pwa' can automate this.
];

self.addEventListener('install', event => {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        if (response) {
          return response; // Cache hit - return response
        }
        return fetch(event.request);
      })
  );
});