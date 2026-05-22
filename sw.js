// sw.js - MIBA MYITTA Service Worker
const CACHE_NAME = 'miba-mitta-v2'; // Version update
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install Service Worker and cache core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

// Fetch strategy: Cache First for images, Network First for others
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Cache images from any source (including Telegram/Cloudinary/etc)
  if (event.request.destination === 'image' || url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) return cachedResponse;
        
        return fetch(event.request).then(networkResponse => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && networkResponse.type !== 'cors') {
            return networkResponse;
          }
          
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          
          return networkResponse;
        });
      })
    );
  } else {
    // Network First for other requests
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
  }
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

// Notification Click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
  if ('clearAppBadge' in self.navigator) {
    self.navigator.clearAppBadge();
  }
});

// Activate and Clean up old caches
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
