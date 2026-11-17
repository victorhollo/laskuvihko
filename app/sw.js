// Laskuvihon nettiversio toimii myös ilman nettiä: kaikki ladattu talletetaan välimuistiin.
// Netin ollessa päällä haetaan aina uusin versio (päivitykset näkyvät heti), muuten käytetään talletettua.
const C = 'laskuvihko-v1';
const CORE = ['./', 'index.html', 'style.css', 'app.js', 'calc.js', 'graph.js', 'draw.js', 'webfs.js',
  'kieli.js', 'kielet/en.js', 'kaavasto.js', 'kaavasto-mat.js', 'kaavasto-fys.js', 'kaavasto-taul.js',
  'vendor/mathlive.min.js', 'vendor/nerdamer.min.js', 'vendor/modern-screenshot.js', 'icon-192.png', 'manifest.webmanifest'];
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(CORE)).catch(() => {})); self.skipWaiting(); });
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(fetch(r).then(res => { if (res.ok) { const copy = res.clone(); caches.open(C).then(c => c.put(r, copy)); } return res; })
    .catch(() => caches.match(r, {ignoreSearch: true}).then(m => m || (r.mode === 'navigate' ? caches.match('index.html') : Response.error()))));
});
