// Service Worker for WorkLog App
const cacheName = 'worklog-app-v2'; // Changed cache name to force update
const assetsToCache = [
  './',
  './index.html',    // Keep this for the welcome screen
  './app.html',      // ADD THIS - your main app
  './styles.css',
  './app.js',
  './manifest.json',
  './sw.js',
  './icons/icon-72x72.png',
  './icons/icon-144x144.png', 
  './icons/icon-192x192.png',
  './icons/icon-512x512.png'
];

self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(cacheName)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(assetsToCache)
          .then(() => console.log('All assets cached successfully'))
          .catch(err => {
            console.error('Failed to cache assets:', err);
          });
      })
  );
  self.skipWaiting(); // ADD THIS - forces immediate activation
});

self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== cacheName) {
            console.log('Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim(); // ADD THIS - controls all clients immediately
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});
