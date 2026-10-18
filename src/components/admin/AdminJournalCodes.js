"use client";

// Journal des codes (refonte OTP du 13/10/2026).
//
// Chaque mail de service traité par le bot : de quelle boîte il vient, à quelle
// adresse le service l'a écrit, de quel type il est, et ce qui en a été fait.
// Sans cette page, l'audit du 13/10 a dû reconstituer les envois à partir des
// journaux du serveur, qui ne couvraient que deux jours et demi.

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, AlertCircle } from "lucide-react";
import { comptesApi } from "@/lib/api";

// Ce que chaque décision veut dire, en clair.
const DECISIONS = {
  envoye: { libelle: "Envoyé au client", classe: "bg-green-100 text-green-800" },
  admin: { libelle: "Transmis à l'admin", classe: "bg-amber-100 text-amber-800" },
  ignore: { libelle: "Ignoré", classe: "bg-black/[0.05] text-apple-mid" },
  refuse: { libelle: "Refusé", classe: "bg-red-100 text-red-700" },
  echec: { libelle: "Échec d'envoi", classe: "bg-red-100 text-red-700" },
  "en-cours": { libelle: "Interrompu", classe: "bg-red-100 text-red-700" },
};

const TYPES = {
  connexion: "Connexion",
  foyer: "Foyer",
  gestion: "Gestion du compte",
  lien: "Demande par lien",
  information: "Information",
  inconnu: "Type inconnu",
  "non-verifie": "Expéditeur non vérifié",
};

function dateCourte(valeur) {
  if (!valeur) return "—";
  return new Date(valeur).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminJournalCodes() {
  const [lignes, setLignes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [filtre, setFiltre] = useState("tout");

  const charger = useCallback(async () => {
    setChargement(true);
    setErreur("");
    try {
      const { lignes: l } = await comptesApi.journalCodes(200);
      setLignes(l || []);
    } catch (err) {
      setErreur(err.message || "Chargement du journal impossible");
    }
    setChargement(false);
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  const visibles =
    filtre === "tout" ? lignes : lignes.filter((l) => l.decision === filtre);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display font-black text-2xl text-apple-black">Journal des codes</h1>
          <p className="text-apple-mid text-[13px] mt-1">
            Chaque mail traité par le bot OTP, et ce qui en a été fait.
          </p>
        </div>
        <button
          onClick={charger}
          disabled={chargement}
          className="inline-flex items-center gap-1.5 text-[12px] font-medium bg-black/[0.04] hover:bg-black/[0.07] rounded-xl px-3 py-2 disabled:opacity-40"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${chargement ? "animate-spin" : ""}`} /> Actualiser
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {[["tout", "Tout"], ...Object.entries(DECISIONS).map(([k, v]) => [k, v.libelle])].map(
          ([cle, libelle]) => (
            <button
              key={cle}
              onClick={() => setFiltre(cle)}
              className={`text-[11px] rounded-full px-3 py-1 transition ${
                filtre === cle ? "bg-apple-black text-white" : "bg-black/[0.04] text-apple-mid"
              }`}
            >
              {libelle}
            </button>
          ),
        )}
      </div>

      {erreur && (
        <div className="flex items-start gap-2 rounded-2xl px-4 py-3 bg-red-50 text-red-700 text-[12px]">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {erreur}
        </div>
      )}

      {!chargement && !erreur && visibles.length === 0 && (
        <p className="text-apple-mid text-[13px]">Aucun mail traité pour le moment.</p>
      )}

      <div className="space-y-2">
        {visibles.map((l) => {
          const d = DECISIONS[l.decision] || DECISIONS.ignore;
          return (
            <div key={l.id} className="glass-card rounded-2xl p-3 text-[12px]">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-apple-mid tabular-nums">{dateCourte(l.recuLe || l.createdAt)}</span>
                <span className="font-semibold text-apple-black">{l.service || "—"}</span>
                <span className="text-apple-mid">{TYPES[l.type] || l.type}</span>
                {l.code && <span className="font-mono bg-black/[0.05] rounded px-1.5">{l.code}</span>}
                <span className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-medium ${d.classe}`}>
                  {d.libelle}
                </span>
              </div>
              <div className="mt-1.5 text-apple-mid leading-snug break-words">
                {l.destinataire && (
                  <span className="text-apple-black font-medium">→ {l.destinataire} · </span>
                )}
                {l.raison || "—"}
              </div>
              <div className="mt-1 text-[11px] text-apple-mid/80 break-all">
                Boîte {l.boite}
                {l.adresseEcrite && l.adresseEcrite !== l.boite ? ` · écrit à ${l.adresseEcrite}` : ""}
                {l.sujet ? ` · « ${l.sujet} »` : ""}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
