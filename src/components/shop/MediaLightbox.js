"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { urlVideoJouable } from "@/lib/media";

export default function MediaLightbox({ items, index, onClose, onNavigate }) {
  const current = items?.[index];
  const panneauRef = useRef(null);
  // Le panneau est monté dans `document.body`, pas là où il est écrit. Sans
  // cela, un parent portant `backdrop-filter` (nos `glass-card`) devient le
  // bloc conteneur du `position: fixed` : le plein écran se retrouve enfermé
  // dans la carte. Le montage différé est nécessaire car `document` n'existe
  // pas au rendu serveur.
  const [monte, setMonte] = useState(false);
  useEffect(() => setMonte(true), []);
  // Élément qui avait le focus avant l'ouverture, pour le lui rendre après.
  const focusPrecedentRef = useRef(null);

  const goPrev = useCallback(() => {
    if (index > 0) onNavigate(index - 1);
  }, [index, onNavigate]);

  // `items?.length` et non `items.length` : les hooks s'exécutent avant le
  // `return null` de garde plus bas, donc l'écouteur clavier est déjà en place
  // même si `items` n'a pas été fourni — une flèche droite planterait.
  const goNext = useCallback(() => {
    if (index < (items?.length ?? 0) - 1) onNavigate(index + 1);
  }, [index, items, onNavigate]);

  // Navigation clavier et fermeture par Échap.
  // La garde `!current` est indispensable : les hooks s'exécutent avant le
  // `return null` plus bas. Sans elle, un index hors plage installait quand même
  // l'écouteur clavier et bloquait le défilement de la page, sans rien afficher.
  useEffect(() => {
    if (!current) return undefined;

    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);

    // Bloque le défilement de la page pendant l'ouverture.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [current, onClose, goPrev, goNext]);

  // Confinement du focus : `aria-modal="true"` promet à un lecteur d'écran que
  // le reste de la page est inerte. On ramène le focus dès qu'il sort du
  // panneau, plutôt que d'intercepter Tab. Intercepter Tab paraissait plus
  // direct mais rendait les commandes natives de la vidéo inatteignables : leurs
  // boutons vivent dans un shadow DOM, `document.activeElement` reste le
  // `<video>`, qui est le dernier élément — chaque Tab repartait donc au début.
  useEffect(() => {
    if (!current) return undefined;
    const onFocusIn = (e) => {
      const panneau = panneauRef.current;
      if (panneau && !panneau.contains(e.target)) panneau.focus();
    };
    document.addEventListener("focusin", onFocusIn);
    return () => document.removeEventListener("focusin", onFocusIn);
  }, [current]);

  // Prise et restitution du focus. Séparé des effets ci-dessus, qui se rejouent
  // à chaque changement de média : le focus ne doit être déplacé qu'à
  // l'ouverture, et rendu qu'à la fermeture.
  // Dépend de `monte` : au premier rendu le panneau n'existe pas encore (il est
  // posé dans le portail juste après), donc `panneauRef` serait vide.
  useEffect(() => {
    if (!monte) return undefined;
    focusPrecedentRef.current = document.activeElement;
    panneauRef.current?.focus();
    return () => {
      const cible = focusPrecedentRef.current;
      if (cible && typeof cible.focus === "function") cible.focus();
    };
  }, [monte]);

  // Après un changement de média, la flèche qui avait le focus peut avoir
  // disparu (on atteint la première ou la dernière image) : le focus retombe
  // alors sur `body`, hors du panneau. On le rattrape.
  useEffect(() => {
    if (!current) return;
    const panneau = panneauRef.current;
    if (panneau && !panneau.contains(document.activeElement)) panneau.focus();
  }, [index, current]);

  if (!current || !monte) return null;

  return createPortal(
    <div
      ref={panneauRef}
      tabIndex={-1}
      className="fixed inset-0 z-[100] flex items-center justify-center outline-none"
      role="dialog"
      aria-modal="true"
      aria-label="Média agrandi"
    >
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-sm"
        onClick={onClose}
      />

      <button
        onClick={onClose}
        aria-label="Fermer"
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur border border-white/15 transition"
      >
        <X className="w-5 h-5 text-white" />
      </button>

      {index > 0 && (
        <button
          onClick={goPrev}
          aria-label="Média précédent"
          className="absolute left-3 z-10 w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur border border-white/15 transition"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
      )}

      {index < items.length - 1 && (
        <button
          onClick={goNext}
          aria-label="Média suivant"
          className="absolute right-3 z-10 w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur border border-white/15 transition"
        >
          <ChevronRight className="w-5 h-5 text-white" />
        </button>
      )}

      <div className="relative z-[1] w-full max-w-4xl px-4">
        <div className="relative w-full" style={{ maxHeight: "80vh" }}>
          {current.type === "video" ? (
            <video
              key={current.url}
              src={urlVideoJouable(current.url)}
              controls
              autoPlay
              playsInline
              className="w-full max-h-[80vh] rounded-2xl bg-black"
            />
          ) : (
            <Image
              src={current.url}
              alt={current.caption || "Client satisfait"}
              width={1200}
              height={1600}
              className="w-full h-auto max-h-[80vh] object-contain rounded-2xl"
              sizes="(max-width: 768px) 100vw, 900px"
            />
          )}
        </div>

        {current.caption && (
          <p className="text-white/80 text-[13px] text-center mt-4">
            {current.caption}
          </p>
        )}
        {items.length > 1 && (
          <p className="text-white/40 text-[11px] text-center mt-1 font-mono">
            {index + 1} / {items.length}
          </p>
        )}
      </div>
    </div>,
    document.body,
  );
}
