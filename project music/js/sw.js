const CACHE_NAME = 'fantac-v1.0.0';
const STATIC_ASSETS = [
  '/', '/index.html', '/login.html', '/register.html', '/home.html',
  '/explore.html', '/profile.html', '/artist.html', '/camps.html',
  '/giveaway.html', '/leaderboard.html',
  '/css/style.css', '/css/auth.css', '/css/app.css',
  '/js/firebase-config.js', '/js/auth.js', '/js/app.js', '/js/player.js',
  '/manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('firestore') || e.request.url.includes('firebase')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetchPromise = fetch(e.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

self.addEventListener('push', e => {
  const data = e.data?.json() || { title: 'FantaC', body: 'You have a new notification!' };
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-72.png',
      vibrate: [200, 100, 200]
    })
  );
});