const CACHE = 'fabrika-v56';
const V = '?v=56';
const ASSETS = ['./', './index.html', './manifest.webmanifest',
  './style.css'+V, './raporlar.js'+V, './app.js'+V, './foto-onizleme.js'+V, './saat.js'+V, './diyalog.js'+V,
  './qr.js'+V, './etiket.js'+V, './arama.js'+V, './talimat.js'+V, './tahsilat.js'+V, './sw-kayit.js'+V,
  './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Sadece kendi dosyalarımızı yönet; Firebase (veritabanı/giriş) istekleri aynen ağa gider.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  // Ağ öncelikli: güncel sürüm gelsin, internet yoksa önbellekten aç
  e.respondWith(
    fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy));
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
  );
});
