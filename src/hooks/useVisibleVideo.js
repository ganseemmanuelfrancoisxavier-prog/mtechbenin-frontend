"use client";

import { useEffect, useRef, useState } from "react";

// Choisit une seule vidéo de boutique parmi celles qui coupent la fenêtre.
// Le ratio visible le plus élevé gagne ; en cas d'égalité, l'inscription la
// plus ancienne garde la priorité pour éviter les bascules entre voisines.
const candidates = new Map();
let sequence = 0;

function selectWinner() {
  // Attendre les premiers rapports des candidats montés : sinon plusieurs
  // callbacks initiaux successifs peuvent faire démarrer puis interrompre des
  // vidéos avant que le navigateur ait évalué toute la page.
  if ([...candidates.values()].some((candidate) => candidate.enabled && !candidate.initialized)) return;
  let winner = null;
  for (const candidate of candidates.values()) {
    if (!candidate.visible || !candidate.enabled) continue;
    if (
      !winner ||
      candidate.ratio > winner.ratio ||
      (candidate.ratio === winner.ratio && candidate.order < winner.order)
    ) winner = candidate;
  }
  for (const candidate of candidates.values()) {
    const selected = candidate === winner;
    if (!selected && candidate.video) {
      candidate.video.pause();
      if (candidate.video.hasAttribute("src")) {
        candidate.video.removeAttribute("src");
        candidate.video.load();
      }
    }
    candidate.setSelected(selected);
  }
}

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
    const key = {};
    const candidate = {
      enabled,
      initialized: false,
      visible: false,
      ratio: 0,
      order: sequence++,
      setSelected,
      video: node,
    };
    candidates.set(key, candidate);
    const observer = new IntersectionObserver(([entry]) => {
      candidate.initialized = true;
      candidate.visible = entry.isIntersecting;
      candidate.ratio = entry.intersectionRatio || 0;
      selectWinner();
    }, { rootMargin, threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] });
    observer.observe(node);
    selectWinner();
    return () => {
      observer.disconnect();
      candidates.delete(key);
      setSelected(false);
      selectWinner();
    };
  }, [enabled, rootMargin, identity]);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (selected && shouldPlay && !reducedMotion) {
      video.muted = true;
      video.play().catch(() => {});
    } else {
      video.pause();
      if (!selected && video.hasAttribute("src")) {
        video.removeAttribute("src");
        video.load();
      }
    }
  }, [selected, reducedMotion, shouldPlay]);

  return { ref, selected, reducedMotion };
}
