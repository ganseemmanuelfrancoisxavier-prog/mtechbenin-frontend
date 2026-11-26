/* Temporary cleanup worker: removes legacy MTECHBENIN offline caches and registration. */
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    await self.clients.claim();

    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));

    const windows = await self.clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    });

    await self.registration.unregister();

    await Promise.all(
      windows.map((client) => {
        if ("navigate" in client) return client.navigate(client.url);
        return Promise.resolve();
      }),
    );
  })());
});
