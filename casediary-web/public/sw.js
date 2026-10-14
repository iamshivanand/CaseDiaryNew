// Advocase Service Worker - High-Reliability PWA Engine
const CACHE_NAME = "advocase-pwa-v1";

const PRECACHE_ASSETS = [
  "/",
  "/manifest.json",
  "/logo.png",
  "/icon-192.png",
  "/icon-512.png",
  "/bare-acts",
  "/calculators",
];

// Install: Precache shell assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn("[SW] Precache asset fetch warning:", err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up old cache versions
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Network-first for dynamic API routes, Stale-while-revalidate for static assets
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // 1. Bypass non-GET requests
  if (event.request.method !== "GET") {
    return;
  }

  // 2. Dynamic API requests & uploads: strictly Network-First
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/uploads/")) {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        return new Response(
          JSON.stringify({
            error: "Offline",
            message: "You are currently offline. Local cache used where available.",
          }),
          {
            status: 503,
            headers: { "Content-Type": "application/json" },
          }
        );
      })
    );
    return;
  }

  // 3. Static assets, fonts, icons, navigation: Stale-while-revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === "basic"
          ) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If offline and no cache match, return fallback
          return cachedResponse;
        });

      return cachedResponse || fetchPromise;
    })
  );
});
