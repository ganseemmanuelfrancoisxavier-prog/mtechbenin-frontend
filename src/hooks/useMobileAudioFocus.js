"use client";

import { useEffect, useRef } from "react";
import useAbonnementStore from "@/store/abonnementStore";

/**
 * Mobile-only audio focus for subscription cards.
 *
 * Browser constraint: mobile browsers (Chrome Android, Safari iOS) block
 * programmatic audio without a user gesture. video.muted = false updates
 * the DOM property but the browser keeps audio silent until play() is called
 * inside a gesture handler.
 *
 * Strategy:
 *  1. IntersectionObserver tracks which card has focus + updates the store
 *     (UI reflects the correct mute state immediately).
 *  2. A touchstart listener calls video.play() in user-gesture context
 *     the moment the user next touches the screen — this unlocks audio.
 *     On mobile the "next touch" is typically the start of the following
 *     scroll, so the gap is imperceptible.
 */
export function useMobileAudioFocus({ services, cardRefs, mounted }) {
  const userMutedRef = useRef(new Set());
  const focusedSlugRef = useRef(null);

  // ── Wrapped toggle: records user intent ──────────────────────────────────
  const handleToggleMute = (slug) => {
    const { services: live, toggleServiceMute } = useAbonnementStore.getState();
    const svc = live.find((s) => s.slug === slug);
    if (!svc) return;
    if (svc.mediaMuted !== false) {
      userMutedRef.current.delete(slug); // was muted → user unmutes
    } else {
      userMutedRef.current.add(slug);    // was playing → user mutes
    }
    toggleServiceMute(slug);
  };

  // ── Audio unlock on next user gesture ────────────────────────────────────
  // Mobile browsers silently keep audio blocked even after video.muted=false
  // unless play() is called within a touchstart/click handler.
  useEffect(() => {
    if (!mounted) return;
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(max-width: 767px)").matches) return;

    const unlockAudio = () => {
      const slug = focusedSlugRef.current;
      if (!slug) return;

      const { services: live } = useAbonnementStore.getState();
      const svc = live.find((s) => s.slug === slug);
      // Respect manual mute choice
      if (!svc || svc.mediaMuted !== false) return;

      const video = cardRefs.current[slug]?.querySelector("video");
      if (!video) return;

      video.muted = false;
      // play() in user-gesture context definitively unblocks audio
      video.play().catch(() => {});
    };

    document.addEventListener("touchstart", unlockAudio, { passive: true });
    return () => document.removeEventListener("touchstart", unlockAudio);
  }, [mounted, cardRefs]);

  // ── IntersectionObserver — focus detection ────────────────────────────────
  useEffect(() => {
    if (!mounted) return;
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(max-width: 767px)").matches) return;
    if (!services.length) return;

    const ratios = {};
    let focusedSlug = null;
    const observers = [];

    services.forEach((service) => {
      const el = cardRefs.current[service.slug];
      if (!el) return;

      const obs = new IntersectionObserver(
        ([entry]) => {
          ratios[service.slug] = entry.intersectionRatio;

          let bestSlug = null;
          let bestRatio = 0;
          Object.entries(ratios).forEach(([slug, ratio]) => {
            if (ratio >= 0.6 && ratio > bestRatio) {
              bestSlug = slug;
              bestRatio = ratio;
            }
          });

          if (!bestSlug || bestSlug === focusedSlug) return;
          focusedSlug = bestSlug;
          focusedSlugRef.current = bestSlug;

          const { services: live, toggleServiceMute } =
            useAbonnementStore.getState();

          live.forEach((svc) => {
            const isMuted = svc.mediaMuted !== false;
            if (svc.slug === focusedSlug) {
              // Update UI state immediately; audio unlocks on next touchstart
              if (isMuted && !userMutedRef.current.has(svc.slug)) {
                toggleServiceMute(svc.slug);
              }
            } else {
              if (!isMuted) toggleServiceMute(svc.slug);
            }
          });
        },
        { threshold: [0, 0.3, 0.6, 0.9, 1.0] }
      );

      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((obs) => obs.disconnect());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, services.length]);

  return { handleToggleMute };
}
