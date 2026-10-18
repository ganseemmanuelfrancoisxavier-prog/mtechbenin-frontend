"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import useAdStore from "@/store/adStore";
import { urlVideoJouable, afficheVideo } from "@/lib/media";

// Temps d'affichage d'une annonce en image. Une annonce en vidéo, elle, dure
// le temps de sa vidéo — voir le minuteur plus bas.
const DUREE_AFFICHAGE_MS = 6000;

// Durée maximale accordée à une vidéo avant de passer à l'annonce suivante,
// même si sa fin de lecture n'a jamais été signalée. Ne sert que de filet.
const PLAFOND_VIDEO_MS = 90000;

export default function AdvertisingSection() {
  const { ads, fetchAds } = useAdStore();
  const [index, setIndex] = useState(0);
  const [survole, setSurvole] = useState(false);
  const [focalise, setFocalise] = useState(false);
  const conteneurRef = useRef(null);
  const videoWrapRef = useRef(null);
  const videoRef = useRef(null);
  // Comme dans ClientGallery : un téléphone ne décode qu'un nombre limité de
  // vidéos à la fois, et les lancer sans condition de visibilité en fait
  // échouer certaines — elles restent noires, ou s'arrêtent quand le
  // navigateur libère un décodeur. On ne joue donc que si la section est
  // réellement à l'écran.
  const [videoVisible, setVideoVisible] = useState(false);

  useEffect(() => {
    fetchAds();
  }, []);

  // Dépend de `ads.length` : tant qu'aucune annonce n'est chargée, ce
  // composant rend `null` (voir plus bas) et `videoWrapRef.current` est donc
  // encore vide au premier passage. Un tableau de dépendances figé à `[]`
  // manquerait alors définitivement l'observation, puisque cet effet ne
  // rejouerait jamais une fois le conteneur réellement monté.
  useEffect(() => {
    const cible = videoWrapRef.current;
    if (!cible) return undefined;
    const obs = new IntersectionObserver(
      ([e]) => setVideoVisible(e.isIntersecting),
      { threshold: 0 },
    );
    obs.observe(cible);
    return () => obs.disconnect();
  }, [ads.length]);

  // Un carrousel qui défile seul est une trappe pour qui lit lentement ou
  // navigue au clavier/lecteur d'écran (WCAG 2.2.2) : la pause au survol et
  // au focus laisse le temps de lire un message que l'annonceur paie pour
  // faire lire.
  //
  // Déclaré AVANT l'effet de lecture, qui s'en sert dans ses dépendances : un
  // `const` lu plus haut que sa déclaration lève une erreur au rendu.
  const enPause = survole || focalise;

  // Joue la vidéo courante uniquement quand la section est visible, la met en
  // pause sinon. Placé au-dessus du garde `ads.length === 0` comme les autres
  // Hooks : on relit `ads`/`index` directement plutôt que la variable
  // `courante`, qui n'est calculée qu'après ce garde.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const actuelle = ads[index % (ads.length || 1)];
    if (!actuelle || actuelle.type !== "video") return;
    // La vidéo se met aussi en pause au survol et au focus. Sans cela, elle
    // continuerait de tourner sous les yeux du visiteur pendant qu'il lit, et
    // sa fin de lecture ferait sauter l'annonce au moment précis où il a
    // demandé qu'on l'attende.
    if (videoVisible && !enPause) {
      if (v.paused) v.play().catch(() => {});
    } else if (!v.paused) {
      v.pause();
    }
  }, [ads, index, videoVisible, enPause]);

  const avancer = () => setIndex((i) => (i + 1) % (ads.length || 1));

  // Une image s'affiche un temps fixe ; une vidéo, elle, va jusqu'au bout —
  // c'est l'annonceur qui décide de sa durée, pas nous. Le passage à
  // l'annonce suivante est donc déclenché par la fin de lecture (`onEnded`),
  // et le minuteur ci-dessous ne concerne que les images.
  //
  // Le minuteur n'a de sens qu'à partir de deux annonces, et doit être
  // réellement arrêté pendant la pause (pas seulement ignoré) : un minuteur
  // qui continue de tourner en arrière-plan ferait sauter l'annonce dès la
  // reprise.
  const couranteEstVideo = ads[index % (ads.length || 1)]?.type === "video";

  useEffect(() => {
    if (ads.length <= 1 || enPause) return undefined;

    // Filet de sécurité pour les vidéos. `onEnded` peut ne jamais se produire :
    // fichier illisible, hébergeur qui refuse de servir le média, décodeur
    // libéré par le navigateur. Sans ce plafond, le carrousel resterait figé
    // pour toujours sur une annonce muette et les autres annonceurs ne
    // seraient jamais vus.
    //
    // On appelle directement la mise à jour d'état plutôt que `avancer` :
    // cette fonction est recréée à chaque rendu, et la mettre en dépendance
    // relancerait le minuteur en boucle au lieu de le laisser courir.
    const delai = couranteEstVideo ? PLAFOND_VIDEO_MS : DUREE_AFFICHAGE_MS;
    const t = setTimeout(
      () => setIndex((i) => (i + 1) % ads.length),
      delai,
    );
    return () => clearTimeout(t);
  }, [ads.length, enPause, index, couranteEstVideo]);

  // Aucune annonce active : la section disparaît entièrement. Pas de titre
  // orphelin ni de bloc vide sur la page d'accueil.
  if (ads.length === 0) return null;

  // Le tableau peut rétrécir entre deux rendus (annonce éteinte côté panel) :
  // sans ce garde-fou, l'index resterait au-delà de la fin et la section
  // planterait sur un accès à `undefined`.
  const courante = ads[index % ads.length];
  const cliquable = Boolean(courante.href);

  // `onBlur` (focusout) remonte à chaque perte de focus d'un descendant, y
  // compris quand le focus saute d'un point à l'autre à l'intérieur du
  // conteneur. On ne reprend le défilement que si le prochain élément
  // focalisé (relatedTarget) est vraiment hors du conteneur — sinon il
  // repartirait puis se figerait de nouveau à chaque tabulation interne.
  const gererSortieFocus = (e) => {
    if (!conteneurRef.current?.contains(e.relatedTarget)) {
      setFocalise(false);
    }
  };

  const contenu = (
    <div
      ref={videoWrapRef}
      className="relative w-full overflow-hidden rounded-3xl"
      // 16/9, le rapport standard de la vidéo. Le bandeau était en 16/6, trop
      // écrasé : un visuel filmé au téléphone y perdait le haut et le bas.
      // Toute modification ici doit être répercutée sur la vignette du panel
      // (AdminPublicites.js) et sur la mention de format du formulaire, sans
      // quoi l'administrateur valide un cadrage que le visiteur ne verra pas.
      style={{ aspectRatio: "16 / 9" }}
    >
      {courante.type === "video" ? (
        <video
          ref={videoRef}
          src={urlVideoJouable(courante.url)}
          // Image d'attente pendant le chargement : sans elle, le visiteur
          // voit un rectangle noir le temps que la vidéo se décode.
          poster={afficheVideo(courante.url)}
          muted
          // On ne boucle que s'il n'y a rien d'autre à montrer. Dès qu'une
          // deuxième annonce existe, boucler empêcherait `onEnded` de se
          // produire et le carrousel ne tournerait plus jamais.
          loop={ads.length === 1}
          onEnded={ads.length > 1 ? avancer : undefined}
          // Une vidéo illisible ne doit pas bloquer les autres annonceurs :
          // on passe à la suivante au lieu d'attendre le plafond.
          onError={ads.length > 1 ? avancer : undefined}
          playsInline
          preload="metadata"
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <Image
          src={courante.url}
          alt={courante.advertiser}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 1200px"
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

      <div className="absolute bottom-0 left-0 right-0 p-5 md:p-7">
        <p className="font-display font-bold text-white text-lg md:text-2xl">
          {courante.advertiser}
        </p>
        {courante.caption && (
          <p className="text-white/75 text-[13px] md:text-sm mt-0.5">
            {courante.caption}
          </p>
        )}
        {cliquable && (
          <span className="inline-flex items-center gap-1 text-white text-[13px] font-semibold mt-2">
            Découvrir <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        )}
      </div>
    </div>
  );

  return (
    <section
      aria-label="Annonce"
      className="max-w-7xl mx-auto px-5 py-10 md:py-14"
    >
      {/* Libellé volontairement neutre : ces emplacements sont vendus à des
          tiers. Un titre chaleureux laisserait croire que la boutique
          recommande ces marques, alors que la section « Témoignages / Ils
          parlent de nous » juste en dessous parle, elle, de vrais clients. */}
      <p className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-3">
        Annonce
      </p>

      <div
        ref={conteneurRef}
        onMouseEnter={() => setSurvole(true)}
        onMouseLeave={() => setSurvole(false)}
        onFocus={() => setFocalise(true)}
        onBlur={gererSortieFocus}
      >
        {cliquable ? (
          <a
            href={courante.href}
            target="_blank"
            // Sans `noopener`, le site de l'annonceur peut manipuler l'onglet
            // d'origine — jusqu'à y afficher une fausse page MTECHBENIN.
            rel="noopener noreferrer sponsored"
            className="block"
          >
            {contenu}
          </a>
        ) : (
          contenu
        )}

        {ads.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-4">
            {ads.map((a, i) => (
              <button
                key={a.id}
                onClick={() => setIndex(i)}
                aria-label={`Afficher l'annonce ${i + 1} sur ${ads.length}`}
                className={`transition-all duration-300 rounded-full ${
                  i === index % ads.length
                    ? "w-5 h-1.5 bg-apple-black"
                    : "w-1.5 h-1.5 bg-apple-black/25 hover:bg-apple-black/40"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
