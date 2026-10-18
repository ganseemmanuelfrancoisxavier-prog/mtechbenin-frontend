"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import {
  Upload,
  Link2,
  X,
  Check,
  Video,
  Image as ImageIcon,
} from "lucide-react";
import { uploadApi } from "@/lib/api";
import { urlVideoJouable } from "@/lib/media";

// Doit rester coherent avec UPLOAD_BODY_LIMIT du backend (35 Mo de corps de
// requete, soit environ 25 Mo de fichier une fois encode en base64).
const MAX_FILE_MB = 25;

export default function MediaUploader({
  value, // URL actuelle
  onChange, // (url, type) => void  — type: "image" | "video"
  folder = "mtechbenin/products",
  accept = "image/*,video/*",
  label = "Média",
  // Masque l'onglet de saisie d'URL : le composant image de Next.js n'est
  // autorisé que sur les hôtes listés dans next.config.mjs (Cloudinary et
  // quelques partenaires). Une adresse tierce collée là produirait une image
  // cassée sur la page d'accueil — mieux vaut ne pas proposer le champ.
  hideUrlTab = false,
}) {
  const [mode, setMode] = useState(hideUrlTab ? "upload" : "url"); // "url" | "upload"
  const [urlInput, setUrlInput] = useState(value || "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const isVideo = (src) =>
    /\.(mp4|mov|avi|webm)/i.test(src) || (src || "").startsWith("data:video");

  // ── Upload fichier ──────────────────────────────────────────────────────
  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Le fichier part encodé en base64, ce qui gonfle la charge d'environ 37 %.
    // Le serveur accepte 35 Mo de corps de requête sur la route d'upload, soit
    // environ 25 Mo de fichier réel. Annoncer davantage exposerait à un échec
    // en fin de transfert, après une longue attente.
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setError(
        `Fichier trop lourd (${Math.round(file.size / 1024 / 1024)} Mo) — maximum ${MAX_FILE_MB} Mo. ` +
          `Pour une vidéo, réduisez sa durée ou sa qualité avant de l'envoyer.`,
      );
      return;
    }

    setUploading(true);
    setError("");
    try {
      const base64 = await toBase64(file);
      const res = await uploadApi.upload(base64, folder);
      onChange(
        res.url,
        res.resourceType || (isVideo(res.url) ? "video" : "image"),
      );
      setUrlInput(res.url);
    } catch (err) {
      setError("Erreur upload — " + (err.message || "réessayez"));
    }
    setUploading(false);
  };

  // ── URL externe ─────────────────────────────────────────────────────────
  const handleApplyUrl = () => {
    if (!urlInput.trim()) return;
    onChange(urlInput.trim(), isVideo(urlInput.trim()) ? "video" : "image");
  };

  // ── Clear ───────────────────────────────────────────────────────────────
  const handleClear = () => {
    onChange("", "image");
    setUrlInput("");
    setError("");
  };

  return (
    <div className="space-y-3">
      <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest block">
        {label}
      </label>

      {/* Onglets mode */}
      <div className="flex gap-1 bg-black/[0.04] p-1 rounded-xl w-fit">
        {[
          ...(hideUrlTab ? [] : [{ key: "url", label: "URL", Icon: Link2 }]),
          { key: "upload", label: "Upload", Icon: Upload },
        ].map(({ key, label: l, Icon }) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${mode === key ? "bg-white text-apple-black shadow-sm" : "text-apple-mid hover:text-apple-black"}`}
          >
            <Icon className="w-3.5 h-3.5" /> {l}
          </button>
        ))}
      </div>

      {/* Mode URL */}
      {mode === "url" && (
        <div className="flex gap-2">
          <input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleApplyUrl()}
            placeholder="https://res.cloudinary.com/... ou URL externe"
            className="flex-1 bg-black/[0.03] rounded-xl px-4 py-3 text-[13px] font-mono border border-black/[0.07] focus:outline-none focus:border-black/20 transition"
          />
          <button
            onClick={handleApplyUrl}
            disabled={!urlInput.trim()}
            className="px-4 py-3 bg-apple-black text-white rounded-xl text-[12px] font-semibold hover:bg-neutral-800 transition disabled:opacity-40"
          >
            <Check className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Mode Upload */}
      {mode === "upload" && (
        <div>
          <input
            ref={fileRef}
            type="file"
            accept={accept}
            onChange={handleFile}
            className="hidden"
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed border-black/[0.10] hover:border-black/[0.20] hover:bg-black/[0.02] transition-all text-[13px] font-medium text-apple-mid disabled:opacity-50"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-black/20 border-t-black/60 rounded-full animate-spin" />{" "}
                Upload en cours...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" /> Cliquer pour choisir un fichier
              </>
            )}
          </button>
          <p className="text-[11px] text-apple-mid mt-1.5">
            Images et vidéos acceptées — max {MAX_FILE_MB} Mo
          </p>
        </div>
      )}

      {/* Erreur */}
      {error && (
        <p className="text-red-500 text-[12px] flex items-center gap-1">
          <X className="w-3.5 h-3.5" /> {error}
        </p>
      )}

      {/* Prévisualisation */}
      {value && (
        <div className="relative rounded-2xl overflow-hidden bg-black/[0.04]">
          {isVideo(value) ? (
            <div className="relative">
              <video
                src={urlVideoJouable(value)}
                controls
                className="w-full max-h-40 rounded-2xl object-cover"
              />
              <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/60 text-white text-[10px] font-semibold px-2 py-1 rounded-full">
                <Video className="w-3 h-3" /> Vidéo
              </div>
            </div>
          ) : (
            <div className="relative w-full h-32">
              <Image
                src={value}
                alt="Aperçu"
                fill
                className="object-cover rounded-2xl"
                sizes="400px"
                onError={() => setError("URL invalide ou inaccessible")}
              />
              <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/60 text-white text-[10px] font-semibold px-2 py-1 rounded-full">
                <ImageIcon className="w-3 h-3" /> Image
              </div>
            </div>
          )}
          <button
            onClick={handleClear}
            className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Helper base64 ─────────────────────────────────────────────────────────────
function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
