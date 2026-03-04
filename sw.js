// === MesRoutines Service Worker ===

const CACHE_NAME = 'mesroutines-v1';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/main.css',
  './css/themes.css',
  './css/components.css',
  './css/animations.css',
  './js/app.js',
  './js/state.js',
  './js/router.js',
  './js/kiosk.js',
  './js/notifications.js',
  './js/sounds.js',
  './js/utils.js',
  './js/icons.js',
  './js/data.js',
  './js/pwa.js',
  './js/components/header.js',
  './js/components/modal.js',
  './js/components/pin-pad.js',
  './js/components/routine-card.js',
  './js/components/bridge-card.js',
  './js/views/family-dashboard.js',
  './js/views/parent-panel.js',
  './js/views/profile-editor.js',
  './js/views/routine-editor.js',
  './js/views/rewards.js',
  './js/views/data-manager.js',
  './js/views/routine-run.js',
];

// Install — cache all assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — cache-first, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        // Return cache but update in background
        const fetchPromise = fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        }).catch(() => {});
        return cached;
      }
      return fetch(event.request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
