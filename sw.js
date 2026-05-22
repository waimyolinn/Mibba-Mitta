// sw.js - MIBA MYITTA Service Worker
2	const CACHE_NAME = 'miba-mitta-v3'; // Version update
3	const urlsToCache = [
4	  '/',
5	  '/index.html',
6	  '/manifest.json',
7	  '/api/posts'
8	];
9	
10	// Install Service Worker and cache core assets
11	self.addEventListener('install', event => {
12	  event.waitUntil(
13	    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
14	  );
15	  self.skipWaiting();
16	});
17	
18	// Fetch strategy: Cache First for images, Stale-While-Revalidate for others
19	self.addEventListener('fetch', event => {
20	  const url = new URL(event.request.url);
21	  
22	  // Cache images from any source (including Telegram/Cloudinary/etc)
23	  if (event.request.destination === 'image' || url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) {
24	    event.respondWith(
25	      caches.match(event.request).then(cachedResponse => {
26	        const fetchPromise = fetch(event.request).then(networkResponse => {
27	          if (networkResponse && networkResponse.status === 200) {
28	            const responseToCache = networkResponse.clone();
29	            caches.open(CACHE_NAME).then(cache => {
30	              cache.put(event.request, responseToCache);
31	            });
32	          }
33	          return networkResponse;
34	        }).catch(() => null);
35	        
36	        return cachedResponse || fetchPromise;
37	      })
38	    );
39	  } else {
40	    // Stale-While-Revalidate for other requests (like /api/posts)
41	    event.respondWith(
42	      caches.match(event.request).then(cachedResponse => {
43	        const fetchPromise = fetch(event.request).then(networkResponse => {
44	          if (networkResponse && networkResponse.status === 200) {
45	            const responseToCache = networkResponse.clone();
46	            caches.open(CACHE_NAME).then(cache => {
47	              cache.put(event.request, responseToCache);
48	            });
49	          }
50	          return networkResponse;
51	        }).catch(() => null);
52	        
53	        return cachedResponse || fetchPromise;
54	      })
55	    );
56	  }
57	});
58	
59	// Push Notifications
60	self.addEventListener('push', (event) => {
61	  let data = {};
62	  if (event.data) {
63	    try {
64	      data = event.data.json();
65	    } catch (e) {
66	      data = { title: 'MIBA MYITTA', body: event.data.text() };
67	    }
68	  }
69	  const title = data.title || 'MIBA MYITTA';
70	  const options = {
71	    body: data.body || 'ပုံအသစ်တင်ထားပါပြီ။',
72	    icon: 'https://i.ibb.co/35gzXLbQ/IMG-6de218e2feaca195291ffde8799f98ab-V.png',
73	    badge: 'https://i.ibb.co/35gzXLbQ/IMG-6de218e2feaca195291ffde8799f98ab-V.png',
74	    data: { url: data.url || '/' }
75	  };
76	  event.waitUntil(
77	    self.registration.showNotification(title, options)
78	  );
79	  
80	  // App Icon Badge
81	  if ('setAppBadge' in self.navigator) {
82	    self.navigator.setAppBadge(1);
83	  }
84	});
85	
86	// Notification Click
87	self.addEventListener('notificationclick', (event) => {
88	  event.notification.close();
89	  event.waitUntil(
90	    clients.openWindow(event.notification.data.url)
91	  );
92	  if ('clearAppBadge' in self.navigator) {
93	    self.navigator.clearAppBadge();
94	  }
95	});
96	
97	// Activate and Clean up old caches
98	self.addEventListener('activate', event => {
99	  event.waitUntil(
100	    caches.keys().then(cacheNames => {
101	      return Promise.all(
102	        cacheNames.map(cacheName => {
103	          if (cacheName !== CACHE_NAME) {
104	            return caches.delete(cacheName);
105	          }
106	        })
107	      );
108	    })
109	  );
110	  self.clients.claim();
111	});
112	
