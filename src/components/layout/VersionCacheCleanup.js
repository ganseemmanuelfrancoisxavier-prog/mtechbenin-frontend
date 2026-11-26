"use client";

import { useEffect } from "react";

const BUILD_VERSION = "2026-11-26-no-pwa-cache";

export default function VersionCacheCleanup() {
  useEffect(() => {
    const storageKey = "mtechbenin-build-version";

    const cleanupOldVersion = async () => {
      try {
        if (window.localStorage.getItem(storageKey) === BUILD_VERSION) return;

        const registrations =
          "serviceWorker" in navigator
            ? await navigator.serviceWorker.getRegistrations()
            : [];
        const cacheNames =
          "caches" in window ? await window.caches.keys() : [];

        await Promise.all(registrations.map((registration) => registration.unregister()));
        await Promise.all(
          cacheNames.map((cacheName) => window.caches.delete(cacheName)),
        );
        window.localStorage.setItem(storageKey, BUILD_VERSION);

        // Reload once only when a previous worker or cache was actually removed,
        // so the browser requests the current production bundle from the network.
        if (registrations.length > 0 || cacheNames.length > 0) {
          window.location.reload();
        }
      } catch (error) {
        console.warn("Nettoyage de l'ancienne version impossible", error);
      }
    };

    void cleanupOldVersion();
  }, []);

  return null;
}
