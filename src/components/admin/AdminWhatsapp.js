"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, LoaderCircle, MessageCircle, QrCode, RefreshCw, Smartphone } from "lucide-react";
import { whatsappAdminApi } from "@/lib/api";
import useSondagePeriodique from "@/hooks/useSondagePeriodique";

export default function AdminWhatsapp() {
  const [etat, setEtat] = useState("loading");
  const [image, setImage] = useState(null);
  const [erreur, setErreur] = useState("");
  const [actualisation, setActualisation] = useState(false);

  const chargerQr = useCallback(async (silencieux = false) => {
    if (!silencieux) setActualisation(true);
    try {
      const resultat = await whatsappAdminApi.getQr();
      setEtat(resultat.status);
      setImage(resultat.image || null);
      setErreur("");
    } catch (err) {
      setErreur(err.message || "Le QR WhatsApp est inaccessible.");
      if (!silencieux) setEtat("error");
    } finally {
      setActualisation(false);
    }
  }, []);

  useEffect(() => {
    chargerQr();
  }, [chargerQr]);

  // Les QR Baileys expirent vite. Actualiser toutes les deux secondes permet
  // au panel d'afficher le QR le plus récent, comme la page de scan existante.
  const sonder = useCallback(() => {
    if (etat !== "connected") chargerQr(true);
  }, [chargerQr, etat]);
  useSondagePeriodique(sonder, 2_000);

  const connecte = etat === "connected";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-green-700">Bot de la boutique</p>
        <h1 className="mt-2 text-2xl md:text-3xl font-bold text-apple-black">Connexion WhatsApp</h1>
        <p className="mt-2 text-sm text-apple-mid">Liez le téléphone qui porte le compte WhatsApp du bot en scannant ce QR code.</p>
      </div>

      {erreur && (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {erreur}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_280px]">
        <section className="rounded-3xl border border-black/[0.06] bg-white p-6 md:p-8 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`grid h-11 w-11 place-items-center rounded-2xl ${connecte ? "bg-green-100 text-green-700" : "bg-black/[0.04] text-apple-black"}`}>
                {connecte ? <CheckCircle2 className="h-5 w-5" /> : <QrCode className="h-5 w-5" />}
              </div>
              <div>
                <h2 className="font-semibold text-apple-black">État du bot</h2>
                <p className={`text-sm ${connecte ? "text-green-700" : "text-apple-mid"}`}>
                  {connecte ? "WhatsApp est connecté" : etat === "error" ? "Connexion indisponible" : "En attente du scan"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => chargerQr()}
              disabled={actualisation}
              className="inline-flex items-center gap-2 rounded-xl border border-black/10 px-3 py-2 text-xs font-semibold text-apple-black transition hover:bg-black/[0.03] disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${actualisation ? "animate-spin" : ""}`} />
              Actualiser
            </button>
          </div>

          <div className="mt-7 flex min-h-[300px] items-center justify-center rounded-2xl bg-[#F7F7F5] p-5">
            {connecte ? (
              <div className="text-center">
                <CheckCircle2 className="mx-auto h-14 w-14 text-green-600" />
                <p className="mt-4 font-semibold text-apple-black">Appareil lié avec succès</p>
                <p className="mt-1 text-sm text-apple-mid">Le bot peut recevoir et envoyer des messages.</p>
              </div>
            ) : image ? (
              <div className="text-center">
                <img src={image} alt="QR code d’appairage WhatsApp" className="mx-auto h-64 w-64 rounded-xl bg-white p-2 shadow-sm" />
                <p className="mt-3 text-xs text-apple-mid">Le QR se renouvelle automatiquement.</p>
              </div>
            ) : etat === "error" ? (
              <div className="text-center text-sm text-apple-mid">Réessaie dans un instant.</div>
            ) : (
              <div className="text-center">
                <LoaderCircle className="mx-auto h-9 w-9 animate-spin text-green-700" />
                <p className="mt-3 text-sm font-medium text-apple-black">Génération du QR en cours…</p>
                <p className="mt-1 text-xs text-apple-mid">Cette zone se met à jour automatiquement.</p>
              </div>
            )}
          </div>
        </section>

        <aside className="rounded-3xl border border-black/[0.06] bg-white p-6 shadow-sm">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-green-50 text-green-700">
            <Smartphone className="h-5 w-5" />
          </div>
          <h2 className="mt-4 font-semibold text-apple-black">Pour scanner</h2>
          <ol className="mt-4 space-y-4 text-sm text-apple-mid">
            <li className="flex gap-3"><span className="font-bold text-green-700">1.</span><span>Ouvre WhatsApp sur le téléphone à lier.</span></li>
            <li className="flex gap-3"><span className="font-bold text-green-700">2.</span><span>Va dans <b className="text-apple-black">Appareils liés</b>.</span></li>
            <li className="flex gap-3"><span className="font-bold text-green-700">3.</span><span>Choisis <b className="text-apple-black">Lier un appareil</b>, puis scanne le QR affiché ici.</span></li>
          </ol>
          <div className="mt-6 rounded-2xl bg-green-50 p-4 text-xs leading-relaxed text-green-900">
            <MessageCircle className="mb-2 h-4 w-4" />
            Garde cette page ouverte jusqu’à ce que le statut passe à « WhatsApp est connecté ».
          </div>
        </aside>
      </div>
    </div>
  );
}
