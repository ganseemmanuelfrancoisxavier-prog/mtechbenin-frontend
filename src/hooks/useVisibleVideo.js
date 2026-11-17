"use client";

import { useEffect, useRef, useState } from "react";

// Chaque lecteur décide de sa lecture selon sa visibilité. L'arbitrage global
// d'une seule vidéo mettait en pause les autres lecteurs même lorsqu'ils étaient
// visibles à l'écran.

export default function useVisibleVideo({
  enabled = true,
  rootMargin = "0px",
  shouldPlay = true,
  identity = null,
} = {}) {
  const ref = useRef(null);
  const [selected, setSelected] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener?.("change", update);
    return () => query.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    if (!enabled) {
      setSelected(false);
      return undefined;
    }
    if (!("IntersectionObserver" in window)) {
      setSelected(true);
      return undefined;
    }

    const observer = new IntersectionObserver(([entry]) => {
      setSelected(Boolean(entry.isIntersecting && entry.intersectionRatio > 0));
    }, { rootMargin, threshold: [0, 0.01, 0.1] });
    observer.observe(node);
    return () => {
      observer.disconnect();
      setSelected(false);
    };
  }, [enabled, rootMargin, identity]);

  useEffect(() => {
    const video = ref.current;
    if (!video) return undefined;

    const tenterLecture = () => {
      if (!selected || !shouldPlay || reducedMotion) return;
      // Définir aussi les attributs avant play() aide Safari iOS à reconnaître
      // une lecture muette autorisée, notamment après la fin de l'introduction.
      video.muted = true;
      video.setAttribute("muted", "");
      video.playsInline = true;
      video.setAttribute("playsinline", "");
      const lecture = video.play();
      if (lecture && typeof lecture.catch === "function") {
        lecture.catch(() => {});
      }
    };

    if (selected && shouldPlay && !reducedMotion) {
      video.addEventListener("loadeddata", tenterLecture);
      video.addEventListener("canplay", tenterLecture);
      document.addEventListener("visibilitychange", tenterLecture);
      tenterLecture();
    } else {
      video.pause();
      if (!selected && video.hasAttribute("src")) {
        video.removeAttribute("src");
        video.load();
      }
    }

    return () => {
      video.removeEventListener("loadeddata", tenterLecture);
      video.removeEventListener("canplay", tenterLecture);
      document.removeEventListener("visibilitychange", tenterLecture);
    };
  }, [selected, reducedMotion, shouldPlay]);

  return { ref, selected, reducedMotion };
}
