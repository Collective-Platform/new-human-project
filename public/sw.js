/// <reference lib="webworker" />

const CACHE_NAME = "nhp-v3";
const STATIC_ASSETS = ["/manifest.json"];
const API_CACHE_NAME = "nhp-api-v1";
const OFFLINE_QUEUE_STORE = "offline-completions";

// ---------- Install ----------
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

// ---------- Activate ----------
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME && k !== API_CACHE_NAME).map((k) => caches.delete(k)),
        ),
      ),
  );
  self.clients.claim();
});

// ---------- Fetch: offline caching strategies ----------
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // API routes: stale-while-revalidate
  if (
    url.pathname.startsWith("/api/dashboard") ||
    url.pathname.startsWith("/api/community") ||
    url.pathname.startsWith("/api/progress")
  ) {
    event.respondWith(staleWhileRevalidate(event.request));
    return;
  }

  // Offline task completion queue (Background Sync)
  if (url.pathname === "/api/tasks/complete" && event.request.method === "POST") {
    event.respondWith(handleTaskComplete(event));
    return;
  }

  // Static assets: cache-first
  if (
    event.request.method === "GET" &&
    (url.pathname.startsWith("/_next/static") ||
      url.pathname.startsWith("/icons") ||
      url.pathname === "/manifest.json")
  ) {
    event.respondWith(cacheFirst(event.request));
    return;
  }
});

async function staleWhileRevalidate(request) {
  const cache = await caches.open(API_CACHE_NAME);
  const cached = await cache.match(request);

  const networkPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);

  return cached || (await networkPromise);
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Offline", { status: 503 });
  }
}

// ---------- Offline task completion queue ----------
async function handleTaskComplete(event) {
  try {
    const response = await fetch(event.request.clone());
    return response;
  } catch {
    // Offline — queue the request for later
    const body = await event.request.clone().json();
    await saveToOfflineQueue(body);

    // Register for background sync
    if (self.registration.sync) {
      await self.registration.sync.register("replay-completions");
    }

    return new Response(JSON.stringify({ success: true, queued: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// IndexedDB helpers for offline queue
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("nhp-offline", 2);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(OFFLINE_QUEUE_STORE)) {
        db.createObjectStore(OFFLINE_QUEUE_STORE, {
          keyPath: "id",
          autoIncrement: true,
        });
      }
      if (!db.objectStoreNames.contains("badge-count")) {
        db.createObjectStore("badge-count");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getBadgeCount() {
  try {
    const db = await openDB();
    return await new Promise((resolve) => {
      const tx = db.transaction("badge-count", "readonly");
      const req = tx.objectStore("badge-count").get("count");
      req.onsuccess = () => resolve(req.result ?? 0);
      req.onerror = () => resolve(0);
    });
  } catch {
    return 0;
  }
}

async function setBadgeCount(count) {
  try {
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction("badge-count", "readwrite");
      tx.objectStore("badge-count").put(count, "count");
      tx.oncomplete = resolve;
      tx.onerror = reject;
    });
  } catch {
    // ignore
  }
}

async function saveToOfflineQueue(body) {
  const db = await openDB();
  const tx = db.transaction(OFFLINE_QUEUE_STORE, "readwrite");
  tx.objectStore(OFFLINE_QUEUE_STORE).add({
    body,
    timestamp: Date.now(),
  });
  await new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = reject;
  });
}

async function replayOfflineQueue() {
  const db = await openDB();
  const tx = db.transaction(OFFLINE_QUEUE_STORE, "readonly");
  const store = tx.objectStore(OFFLINE_QUEUE_STORE);

  const items = await new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  for (const item of items) {
    try {
      const res = await fetch("/api/tasks/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item.body),
      });

      if (res.ok) {
        // Remove from queue
        const deleteTx = db.transaction(OFFLINE_QUEUE_STORE, "readwrite");
        deleteTx.objectStore(OFFLINE_QUEUE_STORE).delete(item.id);
      }
    } catch {
      // Still offline — stop replaying
      break;
    }
  }
}

// ---------- Background Sync ----------
self.addEventListener("sync", (event) => {
  if (event.tag === "replay-completions") {
    event.waitUntil(replayOfflineQueue());
  }
});

// ---------- Push Notifications ----------
self.addEventListener("push", (event) => {
  let data = { title: "Rhythm", body: "", url: "/" };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    (async () => {
      const count = await getBadgeCount();
      const newCount = count + 1;
      await setBadgeCount(newCount);
      await self.registration.showNotification(data.title, {
        body: data.body,
        icon: "/icons/icon-192x192.png",
        badge: "/icons/icon-192x192.png",
        vibrate: [200, 100, 200],
        data: { url: data.url || "/" },
      });
      if (self.navigator?.setAppBadge) {
        await self.navigator.setAppBadge(newCount).catch(() => {});
      }
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/";

  setBadgeCount(0).catch(() => {});
  if (self.navigator?.clearAppBadge) {
    self.navigator.clearAppBadge().catch(() => {});
  }

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      // Focus existing window if available
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Open new window
      return self.clients.openWindow(url);
    }),
  );
});
