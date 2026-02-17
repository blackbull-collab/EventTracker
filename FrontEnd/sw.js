const STATIC_CACHE = 'campusx-static-v2';
const IMAGE_CACHE = 'campusx-images-v1';
const ALL_CACHES = [STATIC_CACHE, IMAGE_CACHE];
const MAX_IMAGE_ENTRIES = 60;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/clubs.html',
  '/signup.html',
  '/login.html',
  '/manifest.json',
  '/offline.html',
  '/styles/aliases.css',
  '/assets/logo.svg',
  '/assets/logo-192.png',
  '/assets/logo-512.png'
];

self.addEventListener('install', (ev) => {
  ev.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => {
      if (!ALL_CACHES.includes(k)) return caches.delete(k);
    }));
    await clients.claim();
  })());
});

async function limitCache(cacheName, maxItems){
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxItems) return;
  const deleteCount = keys.length - maxItems;
  for (let i = 0; i < deleteCount; i++){
    await cache.delete(keys[i]);
  }
}

self.addEventListener('fetch', (ev) => {
  const req = ev.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Navigation requests: network-first, fall back to cache then offline page
  if (req.mode === 'navigate'){
    ev.respondWith((async () => {
      try {
        const networkResp = await fetch(req);
        const cache = await caches.open(STATIC_CACHE);
        cache.put(req, networkResp.clone()).catch(()=>{});
        return networkResp;
      } catch (err){
        const cached = await caches.match(req) || await caches.match('/offline.html');
        return cached;
      }
    })());
    return;
  }

  // Images: cache-first with background update (stale-while-revalidate)
  if (req.destination === 'image' || req.headers.get('accept')?.includes('image')){
    ev.respondWith((async () => {
      const cache = await caches.open(IMAGE_CACHE);
      const cached = await cache.match(req);
      const networkFetch = fetch(req).then(res => {
        if (res && res.ok) cache.put(req, res.clone());
        limitCache(IMAGE_CACHE, MAX_IMAGE_ENTRIES).catch(()=>{});
        return res;
      }).catch(()=>null);
      return cached || (await networkFetch) || (await caches.match('/assets/logo-192.png'));
    })());
    return;
  }

  // Fallback: try cache, then network
  ev.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      const res = await fetch(req);
      // Cache same-origin static requests
      if (url.origin === location.origin && (req.destination === 'style' || req.destination === 'script' || req.destination === 'font')){
        const cache = await caches.open(STATIC_CACHE);
        cache.put(req, res.clone()).catch(()=>{});
      }
      return res;
    } catch (err){
      return await caches.match('/offline.html');
    }
  })());
});
