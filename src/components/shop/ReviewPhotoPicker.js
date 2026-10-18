"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Camera, X, Loader2 } from "lucide-react";
import { reviewsApi } from "@/lib/api";

// Doit rester cohérent avec les règles du serveur (reviewPhotos.js) : c'est lui
// qui fait autorité, ce contrôle-ci n'est qu'un confort pour éviter au client
// d'attendre un envoi voué à l'échec.
const MAX_PHOTOS = 3;
const MAX_MO = 5;
const FORMATS = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic", "image/heif"];

function versBase64(fichier) {
  return new Promise((resolve, reject) => {
    const lecteur = new FileReader();
    lecteur.onload = () => resolve(lecteur.result);
    lecteur.onerror = reject;
    lecteur.readAsDataURL(fichier);
  });
}

/**
 * Sélecteur de photos pour le formulaire d'avis.
 * @param {{ photos: string[], onChange: (photos: string[]) => void, onBusyChange?: (busy: boolean) => void }} props
 */
export default function ReviewPhotoPicker({ photos, onChange, onBusyChange }) {
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [erreur, setErreur] = useState("");
  const champRef = useRef(null);

  const setBusy = (v) => {
    setEnvoiEnCours(v);
    onBusyChange?.(v);
  };

  const handleFichier = async (e) => {
    const fichiers = [...(e.target.files || [])];
    // Permet de resélectionner le même fichier après un retrait.
    e.target.value = "";
    if (!fichiers.length) return;

    const place = MAX_PHOTOS - photos.length;
    if (place <= 0) return;

    setErreur("");
    setBusy(true);

    const ajoutees = [];
    for (const fichier of fichiers.slice(0, place)) {
      if (!FORMATS.includes(fichier.type)) {
        setErreur("Format non accepté — choisissez une image JPG, PNG ou WEBP.");
        continue;
      }
      if (fichier.size > MAX_MO * 1024 * 1024) {
        setErreur(
          `« ${fichier.name} » est trop lourde (${Math.round(fichier.size / 1024 / 1024)} Mo) — maximum ${MAX_MO} Mo.`,
        );
        continue;
      }
      try {
        const base64 = await versBase64(fichier);
        const { url } = await reviewsApi.uploadPhoto(base64);
        if (url) ajoutees.push(url);
      } catch (err) {
        setErreur(err.message || "Envoi impossible — réessayez.");
      }
    }

    if (ajoutees.length) onChange([...photos, ...ajoutees].slice(0, MAX_PHOTOS));
    setBusy(false);
  };

  const retirer = (url) => {
    setErreur("");
    onChange(photos.filter((p) => p !== url));
  };

  const complet = photos.length >= MAX_PHOTOS;

  return (
    <div>
      <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1.5 block">
        Photos (optionnel)
      </label>

      <div className="flex flex-wrap gap-2">
        {photos.map((url) => (
          <div
            key={url}
            className="relative w-20 h-20 rounded-2xl overflow-hidden bg-black/[0.04]"
          >
            <Image src={url} alt="" fill className="object-cover" sizes="80px" />
            {/* Verrouillé pendant un envoi : l'envoi en cours réécrit la liste
                à partir de celle qu'il a vue au départ, un retrait simultané
                serait donc annulé sous les yeux du client. */}
            <button
              type="button"
              onClick={() => retirer(url)}
              disabled={envoiEnCours}
              aria-label="Retirer cette photo"
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          </div>
        ))}

        {!complet && (
          <>
            <input
              ref={champRef}
              type="file"
              accept={FORMATS.join(",")}
              multiple
              onChange={handleFichier}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => champRef.current?.click()}
              disabled={envoiEnCours}
              className="w-20 h-20 rounded-2xl border-2 border-dashed border-black/[0.12] hover:border-black/[0.25] hover:bg-black/[0.02] flex flex-col items-center justify-center gap-1 transition disabled:opacity-50"
            >
              {envoiEnCours ? (
                <Loader2 className="w-5 h-5 text-apple-mid animate-spin" />
              ) : (
                <>
                  <Camera className="w-5 h-5 text-apple-mid" strokeWidth={1.6} />
                  <span className="text-[10px] text-apple-mid font-medium">Ajouter</span>
                </>
              )}
            </button>
          </>
        )}
      </div>

      <p className="text-[11px] text-apple-mid mt-1.5">
        {photos.length}/{MAX_PHOTOS} — JPG, PNG ou WEBP, {MAX_MO} Mo maximum par photo.
      </p>

      {erreur && (
        <p className="text-red-500 text-[12px] mt-1.5 flex items-start gap-1">
          <X className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> {erreur}
        </p>
      )}
    </div>
  );
}
