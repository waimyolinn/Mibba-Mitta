const CACHE_NAME = 'mibamittaa-v4';
const API_CACHE = 'api-cache-v1';
const IMAGE_CACHE = 'image-cache-v1';

const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json'
];

// Install
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
    );
    self.skipWaiting();
});

// Activate - Clean old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(names => {
            return Promise.all(
                names.filter(n => n !== CACHE_NAME && n !== API_CACHE && n !== IMAGE_CACHE)
                    .map(n => caches.delete(n))
            );
        })
    );
    self.clients.claim();
});

// Fetch
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    
    // API - Network first, cache fallback (1 min cache)
    if (url.hostname.includes('workers.dev')) {
        event.respondWith(networkFirst(event.request, API_CACHE));
        return;
    }
    
    // Images - Cache first, network fallback
    if (url.hostname.includes('telegram.org') && event.request.destination === 'image') {
        event.respondWith(cacheFirst(event.request, IMAGE_CACHE));
        return;
    }
    
    // Static files - Cache first
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});

// Network First Strategy
async function networkFirst(request, cacheName) {
    const cache = await caches.open(cacheName);
    try {
        const response = await fetch(request);
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    } catch(e) {
        const cached = await cache.match(request);
        return cached || new Response(JSON.stringify({ success: false, error: 'offline' }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Cache First Strategy
async function cacheFirst(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    if (cached) return cached;
    try {
        const response = await fetch(request);
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    } catch(e) {
        return new Response('', { status: 408 });
    }
}

// Message handler
self.addEventListener('message', event => {
    if (event.data === 'SKIP_WAITING') self.skipWaiting();
    if (event.data === 'CLEAR_CACHE') {
        caches.delete(API_CACHE);
        caches.delete(IMAGE_CACHE);
    }
});