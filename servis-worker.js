// service-worker.js

// Define a cache name
const CACHE_NAME = 'stellar-birthday-cache-v1';

// List the files to cache
const urlsToCache = [
  '/', // Cache the root directory (often serves index.html)
  '/index.html', // Cache the main HTML file
  // Add paths to CSS, JS, and image files if they are separate
  // 'style.css', // Example if you had a separate CSS file
  // 'script.js', // Example if you had a separate JS file
  // 'icons/icon-192x192.png', // Cache icons
  // 'icons/icon-512x512.png'
  // Add the Tailwind CDN URL if you want offline access to it,
  // but be aware CDN resources might change. Caching them is optional.
   'https://cdn.tailwindcss.com',
   'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap' // Cache font if desired

];

// Install event: Cache the core assets
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching app shell');
        // Use addAll for atomic caching
        return cache.addAll(urlsToCache).catch(error => {
           console.error('Service Worker: Failed to cache initial assets:', error);
           // Optionally, you might want to prevent the SW from installing if core assets fail
           // throw error;
        });
      })
      .then(() => {
        console.log('Service Worker: Installation complete.');
        // Force the waiting service worker to become the active service worker.
        return self.skipWaiting();
      })
  );
});

// Activate event: Clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  const cacheWhitelist = [CACHE_NAME]; // Only keep the current cache

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
        console.log('Service Worker: Activation complete.');
        // Take control of the page immediately
        return self.clients.claim();
    })
  );
});

// Fetch event: Serve cached content when offline, or fetch from network
self.addEventListener('fetch', event => {
  console.log('Service Worker: Fetching ', event.request.url);
  // Use a cache-first strategy for most assets
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response from cache
        if (response) {
          console.log('Service Worker: Found in cache: ', event.request.url);
          return response;
        }

        // Not in cache - fetch from network
        console.log('Service Worker: Not in cache, fetching: ', event.request.url);
        return fetch(event.request).then(
          networkResponse => {
            // Optional: Cache the newly fetched resource dynamically
            // Be careful caching everything, especially API calls or external resources
            // if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
            //   const responseToCache = networkResponse.clone();
            //   caches.open(CACHE_NAME)
            //     .then(cache => {
            //       cache.put(event.request, responseToCache);
            //     });
            // }
            return networkResponse;
          }
        ).catch(error => {
            console.error('Service Worker: Fetch failed; returning offline page instead.', error);
            // Optional: Return a custom offline fallback page if fetch fails
            // return caches.match('/offline.html'); // You would need to create and cache offline.html
            // Or simply let the browser handle the network error
        });
      })
  );
});
