const CACHE_NAME = 'mibamittaa-v2';
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    '/sw.js'
];

// Install Event
self.addEventListener('install', event => {
    console.log('[SW] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Caching files...');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log('[SW] Skip waiting...');
                return self.skipWaiting();
            })
    );
});

// Activate Event - Clean old caches
self.addEventListener('activate', event => {
    console.log('[SW] Activating...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(name => name !== CACHE_NAME)
                    .map(name => {
                        console.log('[SW] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        })
        .then(() => {
            console.log('[SW] Claiming clients...');
            return self.clients.claim();
        })
    );
});

// Fetch Event - Network first, then cache
self.addEventListener('fetch', event => {
    // API calls တွေအတွက် network only
    if (event.request.url.includes('workers.dev') || 
        event.request.url.includes('telegram')) {
        return; // bypass cache
    }
    
    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Clone response for cache
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, responseClone);
                });
                return response;
            })
            .catch(() => {
                // Offline - return cached version
                return caches.match(event.request);
            })
    );
});

// Message Event - Update cache on demand
self.addEventListener('message', event => {
    if (event.data === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

console.log('[SW] Service Worker Loaded!');