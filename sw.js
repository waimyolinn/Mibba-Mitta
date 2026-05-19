// sw.js - MIBA MYITTA Service Worker
const CACHE_NAME = 'miba-mitta-v1';
const urlsToCache = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
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
  
  // App Icon Badge
  if ('setAppBadge' in self.navigator) {
    self.navigator.setAppBadge(1);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
  if ('clearAppBadge' in self.navigator) {
    self.navigator.clearAppBadge();
  }
});

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
});