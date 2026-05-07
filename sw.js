const CACHE_NAME = 'mibamittaa-v8';
const API_CACHE = 'api-cache-v1';

self.addEventListener('install', event => {
    event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(['/','/index.html','/manifest.json'])));
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(caches.keys().then(names => Promise.all(names.filter(n => n !== CACHE_NAME && n !== API_CACHE).map(n => caches.delete(n)))));
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    if (url.hostname.includes('workers.dev')) {
        event.respondWith(caches.open(API_CACHE).then(cache => 
            fetch(event.request).then(res => { 
                if (res.ok) cache.put(event.request, res.clone()); 
                return res; 
            }).catch(() => cache.match(event.request))
        ));
        return;
    }
    event.respondWith(caches.match(event.request).then(res => res || fetch(event.request)));
});