const CACHE = 'fabrika-v129';
const V = '?v=129';
const ASSETS = ['./', './index.html', './manifest.webmanifest',
  './style.css'+V, './raporlar.js'+V, './xlsx-yaz.js'+V, './app.js'+V, './foto-onizleme.js'+V, './saat.js'+V, './diyalog.js'+V,
  './qr.js'+V, './etiket.js'+V, './arama.js'+V, './israpor.js'+V, './fotookut.js'+V, './sesasistan.js'+V, './adrsec.js'+V, './talimat.js'+V, './tahsilat.js'+V, './bildirim.js'+V, './surum.js'+V, './maliyet.js'+V, './granul.js'+V, './pano.js'+V, './stokaktar.js'+V, './baglanti.js'+V, './sw-kayit.js'+V, './yazi.js'+V, './hesap.js'+V,
  './icon-192.png', './icon-512.png', './apple-touch-icon.png', './favicon-32.png'];

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

// Telefon bildirimine dokununca: açık uygulama penceresini öne getir (yoksa aç) ve hangi bildirime dokunulduğunu bildir
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const k = (e.notification.data && e.notification.data.k) || '';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
    for (const c of cs) {
      if ('focus' in c) { try { c.postMessage({ bil: k }); } catch (x) {} return c.focus(); }
    }
    return self.clients.openWindow(self.registration.scope + '#bil=' + encodeURIComponent(k));
  }));
});

// v123: Uygulama KAPALIYKEN gelen bildirim (Cloudflare bildirim sunucusu -> standart Web Push)
// v125: bildirim gösterilince sunucuya «aldım» haberi gider (yönetici «Kimlerde çalışıyor?» listesinde görür)
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { b: e.data ? e.data.text() : '' }; }
  const o = { body: d.m || '', icon: 'icon-192.png', badge: 'icon-192.png', tag: d.key || 'fabrika', renotify: true, data: { k: d.key || '' }, vibrate: [200, 100, 200] };
  const goster = self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
    // uygulama ekranda açıksa sessiz göster (uygulama kendi uyarısını çıkarıyor); deneme bildirimi her zaman sesli
    if (!d.test && cs.some(c => c.visibilityState === 'visible')) o.silent = true;
    return self.registration.showNotification(d.b || 'MAG AMBALAJ', o);
  });
  const haber = (typeof d.cb === 'string' && /^https:\/\/[^\s]+$/.test(d.cb))
    ? self.registration.pushManager.getSubscription().then(s => s && fetch(d.cb + '/alindi', { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ endpoint: s.endpoint, test: !!d.test }) })).catch(() => {})
    : Promise.resolve();
  e.waitUntil(Promise.all([goster, haber]));
});
