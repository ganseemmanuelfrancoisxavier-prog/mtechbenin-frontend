"use client";

import { useEffect, useRef, useState } from "react";

// Échantillonne le scroll au plus une fois par image et ne rend React que
// lorsque le franchissement du seuil change.
export default function useScrollThreshold(threshold) {
  const [passed, setPassed] = useState(false);
  const current = useRef(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const next = window.scrollY > threshold;
      if (current.current === next) return;
      current.current = next;
      setPassed(next);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [threshold]);

  return passed;
}
