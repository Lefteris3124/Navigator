/* eslint-disable no-restricted-globals */
/* global clients */

// 🧱 Versioned static cache
const STATIC_CACHE = "boatzone-static-v1.4";

// Optionally pre-cache immutable files
const PRECACHE_ASSETS = [
    // Example: "/index.html", "/assets/main.js"
];

// ⚙️ INSTALL
self.addEventListener("install", (event) => {
    event.waitUntil(
        (async () => {
            const cache = await caches.open(STATIC_CACHE);
            await cache.addAll(PRECACHE_ASSETS);
            self.skipWaiting(); // Activate immediately
        })()
    );
});

// ⚙️ ACTIVATE
self.addEventListener("activate", (event) => {
    event.waitUntil(
        (async () => {
            const keys = await caches.keys();
            await Promise.all(
                keys.filter((k) => k !== STATIC_CACHE).map((k) => caches.delete(k))
            );
            await self.clients.claim(); // Take control immediately
        })()
    );
});

// 🧭 Detect navigation (HTML) requests
function isNavigationRequest(req) {
    return (
        req.mode === "navigate" ||
        (req.method === "GET" && req.headers.get("accept")?.includes("text/html"))
    );
}

// 🧰 FETCH HANDLER
self.addEventListener("fetch", (event) => {
    const req = event.request;
    const url = new URL(req.url);

    // Skip cross-origin requests (like Google Maps tiles)
    if (url.origin !== self.location.origin) return;

    // 🏠 Always fetch navigations fresh (don’t cache HTML)
    if (isNavigationRequest(req)) {
        event.respondWith(
            (async () => {
                try {
                    return await fetch(req);
                } catch {
                    const cache = await caches.open(STATIC_CACHE);
                    const cached = await cache.match("/navigator.html");
                    return (
                        cached ||
                        new Response("Offline", { status: 503, statusText: "Offline" })
                    );
                }
            })()
        );
        return;
    }

    // 🧩 Cache-first for static hashed assets
    const isStatic = /\.(?:js|css|png|jpg|jpeg|webp|gif|svg|ico|woff2?)$/i.test(
        url.pathname
    );

    if (isStatic) {
        event.respondWith(
            (async () => {
                const cache = await caches.open(STATIC_CACHE);
                const cached = await cache.match(req);
                const fetchAndCache = fetch(req).then((res) => {
                    if (res.ok) cache.put(req, res.clone());
                    return res;
                });
                return cached || fetchAndCache;
            })()
        );
    } else {
        // 🛰️ Network-first for dynamic/API requests
        event.respondWith(
            (async () => {
                try {
                    const res = await fetch(req);
                    return res;
                } catch {
                    const cache = await caches.open(STATIC_CACHE);
                    const cached = await cache.match(req);
                    return cached || new Response("Offline", { status: 503 });
                }
            })()
        );
    }
});

/* -----------------------------------------------------------------------
   📬 PUSH NOTIFICATIONS HANDLER
   ----------------------------------------------------------------------- */

// When the browser receives a push event from the server
self.addEventListener("push", (event) => {
    if (!event.data) {
        console.warn("📭 Push event received but no data found");
        return;
    }

    console.log("📬 Push event received:", event.data.text());

    let data = {};
    try {
        data = event.data.json();
    } catch {
        data = { title: "New Notification", body: event.data.text() };
    }

    const title = data.title || "Notification";
    const options = {
        body: data.body || "You have a new update.",
        icon: data.icon || "/icons/icon-192.png",
        badge: data.badge || "/icons/icon-72.png",
        data: { url: data.url || "/", timestamp: Date.now() },
    };

    event.waitUntil(
        (async () => {
            const permission = await self.registration.showNotification(title, options);
            console.log("✅ Notification shown:", title);
            return permission;
        })().catch((err) => {
            console.error("❌ Failed to show notification:", err);
        })
    );
});

// Handle notification clicks (focus/open the app)
self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const targetUrl = event.notification.data?.url || "/";

    event.waitUntil(
        clients
            .matchAll({ type: "window", includeUncontrolled: true })
            .then((clientList) => {
                for (const client of clientList) {
                    if (client.url.includes(targetUrl) && "focus" in client) {
                        return client.focus();
                    }
                }
                if (clients.openWindow) return clients.openWindow(targetUrl);
            })
    );
});