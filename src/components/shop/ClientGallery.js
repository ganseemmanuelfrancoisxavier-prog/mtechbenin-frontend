"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Volume2, VolumeX, Play } from "lucide-react";
import useClientMediaStore from "@/store/clientMediaStore";
import MediaLightbox from "./MediaLightbox";
import { urlVideoJouable, afficheVideo } from "@/lib/media";

// Vitesse du défilement automatique, en pixels par seconde. Assez lent pour
// qu'on puisse regarder une photo sans la poursuivre.
const VITESSE = 28;
// Délai avant que le défilement automatique ne reprenne après une manipulation.
const REPRISE_MS = 2500;
// Au-delà de ce déplacement, le geste est un glissement et non un clic : on
// n'ouvre pas la visionneuse en relâchant.
const SEUIL_GLISSEMENT = 6;

function VideoTile({ media, muted, suspendu }) {
  const videoRef = useRef(null);
  const contenantRef = useRef(null);
  const [visible, setVisible] = useState(false);

  // Un téléphone ne décode qu'un nombre limité de vidéos à la fois. Toutes les
  // lancer d'un coup en fait échouer une partie — certaines restent noires,
  // d'autres s'arrêtent quand le navigateur libère un décodeur. On ne joue donc
  // que ce qui est à l'écran, ce qui économise aussi les données mobiles.
  //
  // L'observation porte sur le contenant, jamais sur la balise `<video>` : sa
  // hauteur dépend de métadonnées pas encore chargées, et un élément de hauteur
  // nulle n'est jamais considéré comme visible — la vidéo ne démarrerait alors
  // jamais.
  useEffect(() => {
    const cible = contenantRef.current;
    if (!cible) return undefined;
    const obs = new IntersectionObserver(
      ([e]) => setVisible(e.isIntersecting),
      {
        // Marge horizontale : le carrousel défile de côté, pas vers le bas.
        rootMargin: "0px 300px",
        threshold: 0,
      },
    );
    obs.observe(cible);
    return () => obs.disconnect();
  }, []);

  // `suspendu` couvre la visionneuse plein écran : les vignettes sont alors
  // cachées derrière elle, mais l'observateur les croit toujours à l'écran.
  // Les laisser tourner mobilise des décodeurs et de la batterie pour rien.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = muted;
    if (visible && !suspendu) {
      if (v.paused) v.play().catch(() => {});
    } else if (!v.paused) {
      v.pause();
    }
  }, [muted, visible, suspendu]);

  return (
    <div ref={contenantRef} className="absolute inset-0">
      <video
        ref={videoRef}
        src={urlVideoJouable(media.url)}
        // Première image servie par Cloudinary : la tuile montre quelque chose
        // immédiatement, même avant le moindre octet de vidéo.
        poster={afficheVideo(media.url)}
        preload="metadata"
        loop
        playsInline
        muted={muted}
        className="w-full h-full object-cover block"
      />
    </div>
  );
}

function Tuile({ media, muted, suspendu, onOuvrir, onBasculerSon }) {
  return (
    // Proportions fixes : la tuile réserve sa place avant tout chargement.
    // Sans cela elle ne vaut aucun pixel tant que le média n'a pas annoncé ses
    // dimensions, et l'emplacement paraît vide.
    <div
      data-tuile
      className="group relative flex-shrink-0 w-[46vw] sm:w-[240px] lg:w-[260px] aspect-[3/4] overflow-hidden rounded-3xl bg-black/[0.05] select-none"
    >
      {media.type === "video" ? (
        <VideoTile media={media} muted={muted} suspendu={suspendu} />
      ) : (
        <Image
          src={media.url}
          alt={media.caption || "Client satisfait MTECHBENIN"}
          fill
          draggable={false}
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          sizes="(max-width: 640px) 46vw, 260px"
        />
      )}

      {/* Bouton plein cadre : ouvre la visionneuse. Frère (pas parent) des
          contrôles ci-dessous — un <button> ne peut pas en contenir un autre. */}
      <button
        type="button"
        onClick={onOuvrir}
        aria-label={media.caption || "Agrandir le média"}
        className="absolute inset-0 z-[5]"
      />

      {media.type === "video" && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onBasculerSon();
          }}
          aria-label={muted ? "Activer le son" : "Couper le son"}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition"
          style={{
            background: "rgba(0,0,0,0.40)",
            border: "1px solid rgba(255,255,255,0.15)",
          }}
        >
          {muted ? (
            <VolumeX className="w-3.5 h-3.5 text-white/80" />
          ) : (
            <Volume2 className="w-3.5 h-3.5 text-white" />
          )}
        </button>
      )}

      {media.type === "video" && (
        <span className="absolute top-3 left-3 z-10 w-7 h-7 rounded-full bg-black/40 border border-white/15 flex items-center justify-center pointer-events-none">
          <Play className="w-3 h-3 text-white fill-white" />
        </span>
      )}

      {media.caption && (
        <span className="absolute inset-x-0 bottom-0 p-4 pt-10 bg-gradient-to-t from-black/70 to-transparent pointer-events-none">
          <span className="block text-white text-[12px] font-medium leading-snug">
            {media.caption}
          </span>
        </span>
      )}
    </div>
  );
}

export default function ClientGallery() {
  const { medias, fetchMedias } = useClientMediaStore();
  const [mounted, setMounted] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  // Le son démarre coupé : les navigateurs bloquent la lecture auto sonore.
  const [soundOnId, setSoundOnId] = useState(null);

  const railRef = useRef(null);
  const periodeRef = useRef(0);
  const placeRef = useRef(false);
  // Instant après lequel le défilement automatique peut reprendre. Toute
  // manipulation le repousse.
  const repriseRef = useRef(0);
  const glissementRef = useRef(null);
  const aGlisseRef = useRef(false);

  useEffect(() => {
    setMounted(true);
    fetchMedias();
  }, []);

  // Trois copies au minimum : on navigue toujours dans celle du milieu, ce qui
  // laisse une liste complète de chaque côté. Il y a donc toujours du contenu
  // à afficher, qu'on aille vers la droite ou vers la gauche.
  const copies =
    medias.length > 0 ? Math.max(3, Math.ceil(18 / medias.length)) : 0;

  // Mesure la largeur d'une liste complète : c'est le pas de la boucle. Prise
  // sur le DOM plutôt que calculée, pour tenir compte des marges réelles.
  const mesurerPeriode = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const tuiles = rail.querySelectorAll("[data-tuile]");
    if (tuiles.length > medias.length) {
      periodeRef.current =
        tuiles[medias.length].offsetLeft - tuiles[0].offsetLeft;
      // Placement initial dans la copie du milieu, une seule fois : c'est ce
      // qui rend le défilement vers la gauche possible dès le départ.
      if (!placeRef.current && periodeRef.current > 0) {
        rail.scrollLeft = periodeRef.current;
        placeRef.current = true;
      }
    }
  }, [medias.length]);

  useEffect(() => {
    if (!mounted || medias.length === 0) return undefined;
    mesurerPeriode();
    window.addEventListener("resize", mesurerPeriode);
    return () => window.removeEventListener("resize", mesurerPeriode);
  }, [mounted, medias.length, mesurerPeriode]);

  // Ramène la position dans la copie du milieu, c'est-à-dire l'intervalle
  // [periode, 2 × periode). Comme le contenu se répète à l'identique tous les
  // `periode` pixels, le saut est invisible.
  //
  // Les deux bornes ne doivent surtout pas se recouvrir : avec `>= periode` et
  // `< 1`, la valeur `periode` déclenchait les deux tests à tour de rôle et la
  // position oscillait indéfiniment entre 0 et `periode`.
  const reboucler = useCallback(() => {
    const rail = railRef.current;
    const periode = periodeRef.current;
    if (!rail || periode <= 0) return;
    if (rail.scrollLeft >= periode * 2) rail.scrollLeft -= periode;
    else if (rail.scrollLeft < periode) rail.scrollLeft += periode;
  }, []);

  // Défilement automatique.
  useEffect(() => {
    if (!mounted || medias.length === 0) return undefined;
    const rail = railRef.current;
    if (!rail) return undefined;

    // Réglage système « réduire les animations » : on renonce au défilement
    // automatique, mais la boucle continue de tourner — c'est elle qui
    // reboucle, et sans elle le défilement manuel buterait sur les extrémités.
    const reduit = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    )?.matches;

    let raf;
    let precedent = performance.now();
    // Les pixels s'accumulent ici : à cette vitesse chaque image vaut moins
    // d'un pixel, et plusieurs navigateurs arrondissent `scrollLeft` — sans
    // report du reste, le carrousel n'avancerait jamais.
    let reste = 0;

    const avancer = (t) => {
      // Borne l'écart : un onglet resté en arrière-plan renverrait un delta
      // énorme, qui ferait bondir le carrousel au retour.
      const dt = Math.min((t - precedent) / 1000, 0.05);
      precedent = t;

      const enPause =
        reduit ||
        lightboxIndex !== null ||
        performance.now() < repriseRef.current;

      if (!enPause) {
        reste += VITESSE * dt;
        const pas = Math.floor(reste);
        if (pas > 0) {
          reste -= pas;
          rail.scrollLeft += pas;
        }
      }
      // Rebouclage à chaque image, y compris pendant une manipulation : les
      // événements de défilement sont regroupés par le navigateur et peuvent
      // manquer le passage de la borne, alors que cette boucle-ci tourne en
      // continu.
      reboucler();
      raf = requestAnimationFrame(avancer);
    };

    raf = requestAnimationFrame(avancer);
    return () => cancelAnimationFrame(raf);
  }, [mounted, medias.length, lightboxIndex, reboucler]);

  // Toute manipulation suspend l'automatique et reboucle aussi, pour que le
  // défilement manuel soit infini dans les deux sens.
  const surInteraction = useCallback(() => {
    repriseRef.current = performance.now() + REPRISE_MS;
  }, []);

  const surDefilement = useCallback(() => {
    reboucler();
  }, [reboucler]);

  // Glissement à la souris : sur ordinateur, un conteneur défilant ne se tire
  // pas au pointeur. Sur mobile le défilement tactile natif s'en charge déjà.
  const surPointerDown = useCallback(
    (e) => {
      if (e.pointerType === "touch") return;
      const rail = railRef.current;
      if (!rail) return;
      glissementRef.current = { x: e.clientX, depart: rail.scrollLeft };
      aGlisseRef.current = false;
      surInteraction();
    },
    [surInteraction],
  );

  const surPointerMove = useCallback(
    (e) => {
      const g = glissementRef.current;
      const rail = railRef.current;
      if (!g || !rail) return;
      const delta = e.clientX - g.x;
      if (Math.abs(delta) > SEUIL_GLISSEMENT) aGlisseRef.current = true;
      rail.scrollLeft = g.depart - delta;
      reboucler();
      surInteraction();
    },
    [reboucler, surInteraction],
  );

  const surPointerUp = useCallback(() => {
    glissementRef.current = null;
    surInteraction();
  }, [surInteraction]);

  const ouvrir = useCallback((indexOriginal) => {
    // Un glissement finit par un clic sur la tuile relâchée : sans ce garde,
    // chaque déplacement à la souris ouvrirait la visionneuse.
    if (aGlisseRef.current) {
      aGlisseRef.current = false;
      return;
    }
    // Coupe le son de la vignette en ouvrant : sans ça, sa vidéo continue de
    // jouer derrière et se superpose à celle de la visionneuse.
    setSoundOnId(null);
    setLightboxIndex(indexOriginal);
  }, []);

  // Section entièrement masquée tant qu'il n'y a rien à montrer : jamais de
  // titre orphelin au-dessus du vide.
  if (!mounted || medias.length === 0) return null;

  return (
    <section className="pt-8 pb-16">
      <div className="max-w-7xl mx-auto px-5 mb-10">
        <p className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-2">
          En images
        </p>
        <h2 className="font-display font-black text-3xl md:text-4xl text-apple-black tracking-tight">
          Nos clients satisfaits
        </h2>
      </div>

      <div
        ref={railRef}
        onScroll={surDefilement}
        onWheel={surInteraction}
        onTouchStart={surInteraction}
        onTouchMove={surInteraction}
        onPointerDown={surPointerDown}
        onPointerMove={surPointerMove}
        onPointerUp={surPointerUp}
        onPointerLeave={surPointerUp}
        className="flex gap-3 overflow-x-auto pb-2 cursor-grab active:cursor-grabbing"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          paddingLeft: "max(1.25rem, calc((100vw - 80rem) / 2 + 1.25rem))",
          paddingRight: "max(1.25rem, calc((100vw - 80rem) / 2 + 1.25rem))",
        }}
      >
        {Array.from({ length: copies }).flatMap((_, c) =>
          medias.map((media, i) => (
            <Tuile
              key={`${c}-${media.id}`}
              media={media}
              muted={soundOnId !== media.id}
              suspendu={lightboxIndex !== null}
              onOuvrir={() => ouvrir(i)}
              onBasculerSon={() =>
                setSoundOnId(soundOnId === media.id ? null : media.id)
              }
            />
          )),
        )}
      </div>

      {lightboxIndex !== null && (
        <MediaLightbox
          items={medias}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </section>
  );
}
