// service-worker.js

// Define a cache name
const CACHE_NAME = 'stellar-birthday-cache-v2'; // Updated version for new dependency

// List the files to cache
const urlsToCache = [
  '/', // Cache the root directory
  '/index.html', // Cache the main HTML file
  // Add paths to icons (ensure these paths are correct)
  '/icons/favicon.ico',
  // '/icons/icon-192x192.png', // Add paths to your actual icons
  // '/icons/icon-512x512.png',
  // Cache CDNs
   'https://cdn.tailwindcss.com',
   'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap',
   'https://fonts.gstatic.com', // Needed for font files
   // *** ADDED: Three.js CDN ***
   'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
];

// Install event: Cache the core assets
self.addEventListener('install', event => {
  console.log('[SW] Install event');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching app shell');
        return cache.addAll(urlsToCache).catch(error => {
           console.error('[SW] Failed to cache initial assets:', error);
           // Optional: Prevent SW activation if core assets fail
           // throw error;
        });
      })
      .then(() => {
        console.log('[SW] Installation complete, skipping wait.');
        return self.skipWaiting(); // Activate immediately
      })
  );
});

// Activate event: Clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activate event');
  const cacheWhitelist = [CACHE_NAME]; // Only keep the current cache

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
        console.log('[SW] Activation complete, claiming clients.');
        return self.clients.claim(); // Take control immediately
    })
  );
});

// Fetch event: Serve cached content when offline (Cache-First strategy)
self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // console.log('[SW] Fetching:', event.request.url);
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          // console.log('[SW] Found in cache:', event.request.url);
          return response;
        }

        // Not in cache - fetch from network
        // console.log('[SW] Not in cache, fetching from network:', event.request.url);
        return fetch(event.request).then(
          networkResponse => {
            // Check if we received a valid response to cache
            if (!networkResponse || networkResponse.status !== 200 || (networkResponse.type !== 'basic' && networkResponse.type !== 'cors')) {
              return networkResponse; // Don't cache invalid or opaque responses
            }

            // Clone the response because it's a stream and can only be consumed once.
            const responseToCache = networkResponse.clone();

            // Cache the new response
            caches.open(CACHE_NAME)
              .then(cache => {
                // console.log('[SW] Caching new resource:', event.request.url);
                cache.put(event.request, responseToCache);
              });

            // Return the original response to the browser
            return networkResponse;
          }
        ).catch(error => {
            console.error('[SW] Fetch failed:', error);
            // Optional: Return a custom offline fallback page if needed
            // return caches.match('/offline.html');
        });
      })
  );
});
