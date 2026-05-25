// Learn Flags — Atlas Project · Service Worker
// Bump CACHE_VERSION whenever you ship a new build; the old cache will be cleared.
const CACHE_VERSION = 'v2';
const CACHE_NAME = `learnflags-${CACHE_VERSION}`;

// Files cached on install. The 197 flag SVGs are listed explicitly so they
// download up front and the app is fully usable offline immediately.
const FLAG_CODES = [
  'af','al','dz','ad','ao','ag','ar','am','au','at','az','bs','bh','bd','bb','by','be','bz','bj','bt',
  'bo','ba','bw','br','bn','bg','bf','bi','cv','kh','cm','ca','cf','td','cl','cn','co','km','cd','cg',
  'cr','ci','hr','cu','cy','cz','dk','dj','dm','do','ec','eg','sv','gq','er','ee','sz','et','fj','fi',
  'fr','ga','gm','ge','de','gh','gr','gd','gt','gn','gw','gy','ht','hn','hu','is','in','id','ir','iq',
  'ie','il','it','jm','jp','jo','kz','ke','ki','xk','kw','kg','la','lv','lb','ls','lr','ly','li','lt',
  'lu','mg','mw','my','mv','ml','mt','mh','mr','mu','mx','fm','md','mc','mn','me','ma','mz','mm','na',
  'nr','np','nl','nz','ni','ne','ng','kp','mk','no','om','pk','pw','ps','pa','pg','py','pe','ph','pl',
  'pt','qa','ro','ru','rw','kn','lc','vc','ws','sm','st','sa','sn','rs','sc','sl','sg','sk','si','sb',
  'so','za','kr','ss','es','lk','sd','sr','se','ch','sy','tw','tj','tz','th','tl','tg','to','tt','tn',
  'tr','tm','tv','ug','ua','ae','gb','us','uy','uz','vu','va','ve','vn','ye','zm','zw'
];

const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-48.png',
  './icons/icon-72.png',
  './icons/icon-96.png',
  './icons/icon-144.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
  './screenshots/screen-1-home.png',
  './screenshots/screen-2-flashcard.png',
  './screenshots/screen-3-map.png',
  './screenshots/screen-wide-1-home.png',
];

const FLAG_ASSETS = FLAG_CODES.map(c => `./flags/${c}.svg`);
const PRECACHE_URLS = APP_SHELL.concat(FLAG_ASSETS);

// On install: open the cache, fetch everything, and skip waiting so the new SW
// activates immediately. The progress can be slow on first run (~2MB of flags)
// but the app shell loads first so the user sees content quickly.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Cache the shell first (synchronous-feeling), then flags in the background
      return cache.addAll(APP_SHELL).then(() => {
        // Add flags one at a time with individual error tolerance — if one fails,
        // the others should still cache.
        return Promise.all(
          FLAG_ASSETS.map((url) =>
            fetch(url).then((res) => {
              if (res.ok) return cache.put(url, res);
            }).catch(() => { /* tolerate individual flag failure */ })
          )
        );
      });
    }).then(() => self.skipWaiting())
  );
});

// On activate: clean up old caches from previous versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k.startsWith('learnflags-') && k !== CACHE_NAME)
            .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// On fetch: cache-first for same-origin GETs. Falls back to network for anything
// not in cache (e.g. a flag we missed on install).
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        // Stash this fetch in the cache for next time, but only if it's OK
        if (res && res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return res;
      }).catch(() => {
        // Offline and not in cache — let it fail naturally
        return new Response('Offline', { status: 503, statusText: 'Offline' });
      });
    })
  );
});
