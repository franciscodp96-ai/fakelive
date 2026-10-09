// Cache mínimo para que la PWA abra sin red. Las llamadas a la API nunca pasan por aquí.
const CACHE = 'fakelive-v5';
const ASSETS = ['./', './index.html', './css/style.css', './manifest.webmanifest', './icons/icon.svg',
  './js/app.js', './js/live.js', './js/bank.js', './js/viewers.js', './js/scheduler.js',
  './js/hearts.js', './js/stt.js', './js/llm.js', './js/consignas.js','./js/format.js', './js/avatar.js', './js/ui.js', './css/controls.css'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(r => {
    const copy = r.clone();
    caches.open(CACHE).then(c => c.put(e.request, copy));
    return r;
  }).catch(() => caches.match(e.request)));
});
