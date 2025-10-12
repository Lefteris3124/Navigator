/* eslint-disable no-restricted-globals */

// Bump this on each deploy if you like: 'boatzone-<date/commit>'
const STATIC_CACHE = 'boatzone-static-v1.2';

// Only cache immutable, hashed files (CRA/Vite produce hashed names).
// Do NOT list '/', '/navigator.html' here — HTML must stay network fresh.
const PRECACHE_ASSETS = [
    // e.g. '/assets/index-abc123.js', '/assets/index-abc123.css'
    // Leave empty if you don't want to precache; runtime will still cache hashed assets.
];

self.addEventListener('install', (event) => {
    event.waitUntil((async () => {
        const cache = await caches.open(STATIC_CACHE);
        await cache.addAll(PRECACHE_ASSETS);
        self.skipWaiting();          // activate immediately
    })());
});

self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        const keys = await caches.keys();
        await Promise.all(keys.filter(k => k !== STATIC_CACHE).map(k => caches.delete(k)));
        await self.clients.claim();  // control pages right away
    })());
});

// Helper: treat navigation requests specially (NEVER cache navigator.html)
function isNavigationRequest(req) {
    return req.mode === 'navigate' || (req.method === 'GET' && req.headers.get('accept')?.includes('text/html'));
}

// Cache-first for immutable/static assets; network-first for everything else.
// Never cache HTML navigations to avoid stale app shells after deploys.
self.addEventListener('fetch', (event) => {
    const req = event.request;
    const url = new URL(req.url);

    // Bypass cross-origin (maps tiles, CDNs) — let the browser handle
    if (url.origin !== self.location.origin) return;

    if (isNavigationRequest(req)) {
        // Always go to network for HTML; fallback to cache only if offline and cached.
        event.respondWith((async () => {
            try {
                return await fetch(req);
            } catch {
                const cache = await caches.open(STATIC_CACHE);
                const cached = await cache.match('/navigator.html');
                return cached || new Response('Offline', { status: 503, statusText: 'Offline' });
            }
        })());
        return;
    }

    // Static assets heuristic: hashed filenames like main.[hash].js/css/png
    const isStatic = /\.(?:js|css|png|jpg|jpeg|webp|gif|svg|ico|woff2?)$/i.test(url.pathname);

    if (isStatic) {
        event.respondWith((async () => {
            const cache = await caches.open(STATIC_CACHE);
            const cached = await cache.match(req);
            const fetchAndCache = fetch(req).then(res => {
                if (res.ok) cache.put(req, res.clone());
                return res;
            });
            return cached || fetchAndCache;
        })());
    } else {
        // network-first for other requests (JSON, API, etc.)
        event.respondWith((async () => {
            try {
                const res = await fetch(req);
                return res;
            } catch {
                const cache = await caches.open(STATIC_CACHE);
                const cached = await cache.match(req);
                return cached || new Response('Offline', { status: 503 });
            }
        })());
    }
});