// sw.js - Stale-While-Revalidate (Fast + Auto Update)
const CACHE_NAME = 'mibamittaa-v10'; // Code ပြင်တိုင်း Version တိုးပေးရင် Force Update ဖြစ်မယ်
const API_CACHE = 'api-cache-v1';

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(['/', '/index.html', '/manifest.json']);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(names => {
            return Promise.all(
                names.filter(n => n !== CACHE_NAME && n !== API_CACHE)
                    .map(n => caches.delete(n))
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    
    // API - Network first (no change)
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
    
    // HTML files - Stale-While-Revalidate
    if (event.request.destination === 'document' || url.pathname.endsWith('.html')) {
        event.respondWith(
            caches.open(CACHE_NAME).then(cache => {
                return cache.match(event.request).then(cachedResponse => {
                    const fetchPromise = fetch(event.request).then(networkResponse => {
                        // Update cache with new version silently
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    }).catch(() => cachedResponse); // if network fails, stick with cached
                    // Return cached immediately if available, otherwise wait for network
                    return cachedResponse || fetchPromise;
                });
            })
        );
        return;
    }
    
    // Other static files - Cache first (fast)
    event.respondWith(
        caches.match(event.request).then(res => res || fetch(event.request))
    );
});