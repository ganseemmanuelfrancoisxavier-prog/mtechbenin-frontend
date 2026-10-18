"use client";

import { useState } from "react";
import Image from "next/image";
import MediaLightbox from "./MediaLightbox";

/**
 * Vignettes des photos jointes à un avis, ouvrant le visionneuse plein écran.
 * Utilisé par la fiche produit, l'accueil, la page /avis et le panel admin.
 *
 * @param {{ photos: unknown, auteur?: string, taille?: "sm" | "md" }} props
 */
export default function ReviewPhotos({ photos, auteur = "", taille = "md" }) {
  const [index, setIndex] = useState(null);

  // `photos` vient d'une colonne JSON : elle peut être null, un objet, ou un
  // tableau contenant autre chose que des chaînes selon l'historique des données.
  const liste = Array.isArray(photos)
    ? photos.filter((p) => typeof p === "string" && p)
    : [];
  if (liste.length === 0) return null;

  const items = liste.map((url) => ({
    type: "image",
    url,
    caption: auteur ? `Photo partagée par ${auteur}` : "",
  }));

  const dimension = taille === "sm" ? "w-14 h-14" : "w-20 h-20";
  const sizes = taille === "sm" ? "56px" : "80px";

  return (
    <>
      <div className="flex flex-wrap gap-2 mt-2.5">
        {liste.map((url, i) => (
          <button
            key={url}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Agrandir la photo ${i + 1} sur ${liste.length}`}
            className={`relative ${dimension} rounded-xl overflow-hidden bg-black/[0.04] group`}
          >
            <Image
              src={url}
              alt=""
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes={sizes}
            />
          </button>
        ))}
      </div>

      {index !== null && (
        <MediaLightbox
          items={items}
          index={index}
          onClose={() => setIndex(null)}
          onNavigate={setIndex}
        />
      )}
    </>
  );
}
