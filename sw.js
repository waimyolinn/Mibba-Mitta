const CACHE_NAME = 'mibamittaa-v5';
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

// Activate
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
    
    // API - Network first
    if (url.hostname.includes('workers.dev')) {
        event.respondWith(
            caches.open(API_CACHE).then(cache => {
                return fetch(event.request).then(response => {
                    if (response.ok) cache.put(event.request, response.clone());
                    return response;
                }).catch(() => cache.match(event.request));
            })
        );
        return;
    }
    
    // Images - Cache first
    if (event.request.destination === 'image') {
        event.respondWith(
            caches.open(IMAGE_CACHE).then(cache => {
                return cache.match(event.request).then(cached => {
                    const fetchPromise = fetch(event.request).then(response => {
                        if (response.ok) cache.put(event.request, response.clone());
                        return response;
                    });
                    return cached || fetchPromise;
                });
            })
        );
        return;
    }
    
    // Static files - Cache first
    event.respondWith(
        caches.match(event.request).then(response => response || fetch(event.request))
    );
});

// Handle messages from the page (PWA link opening workaround)
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'OPEN_URL') {
        // Open URL using clients.openWindow
        const url = event.data.url;
        if (url.startsWith('https://') || url.startsWith('http://')) {
            self.clients.openWindow(url);
        }
    }
    
    if (event.data === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data === 'CLEAR_CACHE') {
        caches.delete(API_CACHE);
        caches.delete(IMAGE_CACHE);
    }
});