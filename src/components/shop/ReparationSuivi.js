"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Loader2,
  AlertTriangle,
  Wrench,
  CalendarClock,
  XCircle,
} from "lucide-react";
import { reparationApi } from "@/lib/api";
import { formatPrice } from "@/lib/format";

// Les étapes du parcours, dans l'ordre. `ANNULEE` n'y figure pas : elle sort du
// parcours au lieu de l'avancer, et se présente donc à part.
const ETAPES = [
  { cle: "EN_ATTENTE", libelle: "En attente de paiement" },
  { cle: "PAYEE", libelle: "Payée" },
  { cle: "A_RECUPERER", libelle: "À récupérer" },
  { cle: "RECUPEREE", libelle: "Récupérée" },
  { cle: "EN_ATELIER", libelle: "En atelier" },
  { cle: "REPAREE", libelle: "Réparée" },
  { cle: "A_RENDRE", libelle: "À rendre" },
  { cle: "RENDUE", libelle: "Rendue" },
];

function formaterDate(valeur) {
  if (!valeur) return null;
  const d = new Date(valeur);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function ReparationSuivi({ reference }) {
  const [reparation, setReparation] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    let annule = false;
    (async () => {
      try {
        const d = await reparationApi.suivi(reference);
        if (!annule) setReparation(d.reparation || null);
      } catch (err) {
        // Une référence inconnue rend 404 : on le dit, plutôt que d'afficher
        // une page vide qui laisserait croire à une panne du site.
        if (!annule) setErreur(err.message || "Référence introuvable");
      } finally {
        if (!annule) setChargement(false);
      }
    })();
    return () => {
      annule = true;
    };
  }, [reference]);

  if (chargement) {
    return (
      <div className="max-w-2xl mx-auto px-5 py-20 text-center">
        <Loader2 className="w-6 h-6 text-apple-mid animate-spin mx-auto" />
      </div>
    );
  }

  if (erreur || !reparation) {
    return (
      <div className="max-w-2xl mx-auto px-5 py-16 text-center">
        <div className="w-14 h-14 bg-black/[0.04] rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7 text-apple-mid" />
        </div>
        <h1 className="font-display font-black text-2xl text-apple-black mb-2">
          Référence introuvable
        </h1>
        <p className="text-apple-mid text-[13px] mb-6">
          Vérifiez la référence reçue par WhatsApp. Elle ressemble à
          <span className="font-mono"> REP-2026-XXXXXXXX</span>.
        </p>
        <Link
          href="/reparation"
          className="inline-flex items-center gap-2 bg-apple-black text-white px-6 py-3 rounded-2xl font-semibold text-[13px]"
        >
          <ArrowLeft className="w-4 h-4" /> Retour à la réparation
        </Link>
      </div>
    );
  }

  const annulee = reparation.status === "ANNULEE";
  const indiceActuel = ETAPES.findIndex((e) => e.cle === reparation.status);
  const dateRetour = formaterDate(reparation.returnDate);
  const estDiagnostic = reparation.kind === "DIAGNOSTIC";

  return (
    <div className="max-w-2xl mx-auto px-5 py-10">
      <Link
        href="/reparation"
        className="inline-flex items-center gap-1.5 text-apple-mid hover:text-apple-black text-[13px] font-medium mb-8 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Réparation
      </Link>

      <div className="flex items-start gap-3 mb-6">
        <div className="w-11 h-11 rounded-2xl bg-black/[0.04] flex items-center justify-center flex-shrink-0">
          <Wrench className="w-5 h-5 text-apple-black" strokeWidth={1.8} />
        </div>
        <div>
          <h1 className="font-display font-black text-2xl text-apple-black tracking-tight leading-none">
            {estDiagnostic ? "Diagnostic" : "Réparation"}
          </h1>
          <p className="text-apple-mid text-[13px] mt-1">
            {reparation.familyName} · {reparation.modelName}
          </p>
          <p className="font-mono text-[12px] text-apple-mid mt-0.5">
            {reparation.reference}
          </p>
        </div>
      </div>

      {annulee ? (
        <div
          className="rounded-3xl p-5 mb-6 flex items-start gap-3"
          style={{
            background: "rgba(227,6,19,0.05)",
            border: "1px solid rgba(227,6,19,0.15)",
          }}
        >
          <XCircle className="w-5 h-5 text-cta flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-apple-black text-[14px]">
              Demande annulée
            </p>
            <p className="text-apple-mid text-[12px] mt-0.5">
              Nous vous contactons par WhatsApp pour la suite.
            </p>
          </div>
        </div>
      ) : (
        <div
          className="rounded-3xl p-5 mb-6"
          style={{
            background: "rgba(0,0,0,0.02)",
            border: "1px solid rgba(0,0,0,0.07)",
          }}
        >
          <p className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-4">
            Avancement
          </p>
          <ol className="space-y-3">
            {ETAPES.map((etape, i) => {
              const faite = i <= indiceActuel;
              const courante = i === indiceActuel;
              return (
                <li key={etape.cle} className="flex items-center gap-3">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                      faite ? "bg-apple-black" : "bg-black/[0.08]"
                    }`}
                  >
                    {faite && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                  </span>
                  <span
                    className={`text-[13px] ${
                      courante
                        ? "text-apple-black font-semibold"
                        : faite
                          ? "text-apple-black"
                          : "text-apple-mid"
                    }`}
                  >
                    {etape.libelle}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {/* La date de retour n'apparaît que si l'administrateur l'a renseignée :
          une date vide affichée produirait « undefined » ou une promesse
          qu'on n'a pas faite. */}
      {dateRetour && !annulee && (
        <div className="flex items-center gap-2 text-[13px] text-apple-black mb-6">
          <CalendarClock className="w-4 h-4 text-apple-mid" />
          Retour prévu le <strong>{dateRetour}</strong>
        </div>
      )}

      {reparation.items?.length > 0 && (
        <div
          className="rounded-3xl p-5"
          style={{
            background: "rgba(0,0,0,0.02)",
            border: "1px solid rgba(0,0,0,0.07)",
          }}
        >
          <p className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-3">
            Réparations
          </p>
          <ul className="space-y-2">
            {reparation.items.map((it, i) => (
              <li key={i} className="flex items-baseline justify-between gap-3">
                <span className="text-[13px] text-apple-black">
                  {it.jobName}
                  <span className="text-apple-mid text-[11px] ml-1.5">
                    {it.optionLabel}
                  </span>
                </span>
                <span className="text-[13px] font-semibold text-apple-black whitespace-nowrap">
                  {formatPrice(it.unitPrice)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 pt-3 border-t border-black/[0.06] flex items-baseline justify-between">
            <span className="text-[13px] text-apple-mid">Total</span>
            <span className="font-display font-black text-[18px] text-apple-black">
              {formatPrice(reparation.total)}
            </span>
          </div>
        </div>
      )}

      {estDiagnostic && reparation.items?.length === 0 && (
        <p className="text-apple-mid text-[13px]">
          Nous analysons votre appareil et vous contactons par WhatsApp dès que
          la panne est identifiée.
        </p>
      )}
    </div>
  );
}
