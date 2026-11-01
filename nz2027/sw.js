const CACHE = '2027nz-v3';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon.svg', './logo.svg', './offline-map.svg', './apple-touch-icon.png', './sw.js', './remote-content.json'];
const isCacheableRequest = request => request.method === 'GET' && new URL(request.url).origin === self.location.origin;
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => (key.startsWith('nz17-') || key.startsWith('sc17-') || key.startsWith('2027nz-')) && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  if (!isCacheableRequest(event.request)) return;
  const requestURL = new URL(event.request.url);
  if (requestURL.pathname.endsWith('/remote-content.json')) {
    event.respondWith(fetch(event.request).then(response => {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put('./remote-content.json', copy));
      return response;
    }).catch(() => caches.match('./remote-content.json')));
    return;
  }
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then(response => {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put('./index.html', copy));
      return response;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    const copy = response.clone();
    caches.open(CACHE).then(cache => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match('./index.html'))));
});
