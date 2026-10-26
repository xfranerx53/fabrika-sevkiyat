// Eski adresteki önbelleği temizler ve kendini kaldırır; sayfalar yeni adrese yönlenir.
self.addEventListener('install', function(){ self.skipWaiting(); });
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys()
      .then(function(keys){ return Promise.all(keys.map(function(k){ return caches.delete(k); })); })
      .then(function(){ return self.registration.unregister(); })
      .then(function(){ return self.clients.matchAll({type:'window'}); })
      .then(function(list){ list.forEach(function(c){ try{ c.navigate(c.url); }catch(x){} }); })
  );
});
