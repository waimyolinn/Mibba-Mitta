// sw.js - MIBA MYITTA Service Worker (Fixed for Offline Mode)
const CACHE_NAME = 'miba-mitta-v4';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install: Cache core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Activate: Clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Network First, then Cache (for everything including images)
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // If network request is successful, clone it and save to cache
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // If network fails (offline), try to serve from cache
        return caches.match(event.request);
      })
  );
});

// Push Notifications
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'MIBA MYITTA', body: event.data.text() };
    }
  }
  const title = data.title || 'MIBA MYITTA';
  const options = {
    body: data.body || 'ပုံအသစ်တင်ထားပါပြီ။',
    icon: 'https://i.ibb.co/35gzXLbQ/IMG-6de218e2feaca195291ffde8799f98ab-V.png',
    badge: 'https://i.ibb.co/35gzXLbQ/IMG-6de218e2feaca195291ffde8799f98ab-V.png',
    data: { url: data.url || '/' }
  };
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification Click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
