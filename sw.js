 Service worker: shrani aplikacijo v telefon, da se odpre tudi brez signala.
const CACHE = 'predaja-v2';
const CORE = ['./', 'index.html', 'app.css', 'app.js', 'store.js', 'config.js', 'oprema.js', 'qrcode.js',
  'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var r = e.request;
  if (r.method !== 'GET') return;
  var u = new URL(r.url);
  var same = u.origin === self.location.origin;
  var sdk = u.hostname === 'www.gstatic.com' && u.pathname.indexOf('/firebasejs/') === 0;
  if (!same && !sdk) return;            // promet do baze gre mimo
  if (sdk) {                            // Firebase knjiÅ¾nice: najprej iz telefona
    e.respondWith(caches.match(r).then(function (m) {
      return m || fetch(r).then(function (res) {
        var c = res.clone(); caches.open(CACHE).then(function (x) { x.put(r, c); }); return res;
      });
    }));
    return;
  }
  // Datoteke aplikacije: najprej omreÅ¾je (da dobiÅ¡ posodobitve), sicer iz telefona
  e.respondWith(fetch(r).then(function (res) {
    if (res.ok) { var c = res.clone(); caches.open(CACHE).then(function (x) { x.put(r, c); }); }
    return res;
  }).catch(function () {
    return caches.match(r).then(function (m) {
      return m || (r.mode === 'navigate' ? caches.match('index.html') : null) || Response.error();
    });
  }));
});
