"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import {
  ArrowLeft,
  Check,
  Loader2,
  AlertTriangle,
  Stethoscope,
  Info,
} from "lucide-react";
import { reparationApi } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import useSettingsStore from "@/store/settingsStore";

// Le serveur refuse une description de moins de dix caractères : sans matière,
// aucune analyse n'est possible. On le dit ici plutôt que de laisser le client
// découvrir le refus après avoir rempli tout le formulaire.
const DESCRIPTION_MIN = 10;

function decouperNom(complet) {
  const parts = String(complet || "").trim().split(/\s+/);
  return {
    firstname: parts[0] || "Client",
    lastname: parts.slice(1).join(" ") || parts[0] || "MTECHBENIN",
  };
}

export default function ReparationDiagnostic({ modeleSlug }) {
  const router = useRouter();
  const { getActiveCities, fedapayPublicKey, fedapayEnv } = useSettingsStore();
  const activeCities = getActiveCities();

  const [modele, setModele] = useState(null);
  const [chargement, setChargement] = useState(!!modeleSlug);

  const [form, setForm] = useState({
    problemDescription: "",
    clientName: "",
    clientWhatsapp: "229",
    clientEmail: "",
    city: "",
    neighborhood: "",
    instructions: "",
    pickupSlot: "",
  });

  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [confirmee, setConfirmee] = useState(null);

  const widgetRef = useRef(null);
  const referenceRef = useRef("");
  const enCoursRef = useRef(false);
  const creeRef = useRef(false);

  useEffect(() => {
    if (!modeleSlug) return;
    let annule = false;
    (async () => {
      try {
        const d = await reparationApi.modele(modeleSlug);
        if (!annule) setModele(d.modele ? { ...d.modele, famille: d.famille } : null);
      } catch {
        // Un appareil introuvable n'empêche pas la demande : le diagnostic
        // reste possible, l'administrateur identifiera l'appareil à la
        // réception. On n'interrompt donc pas le parcours.
      } finally {
        if (!annule) setChargement(false);
      }
    })();
    return () => {
      annule = true;
    };
  }, [modeleSlug]);

  const maj = (champ, valeur) => setForm((f) => ({ ...f, [champ]: valeur }));

  const descriptionTropCourte =
    form.problemDescription.trim().length < DESCRIPTION_MIN;
  const complet =
    !descriptionTropCourte &&
    form.clientName.trim() &&
    form.clientWhatsapp.replace(/\D/g, "").length >= 8 &&
    form.city;

  const cleFedapay =
    fedapayPublicKey || process.env.NEXT_PUBLIC_FEDAPAY_PUBLIC_KEY || "";

  const apresPaiement = (reason) => {
    const FedaPay = window["FedaPay"];
    if (!FedaPay) return;
    if (reason === FedaPay.DIALOG_DISMISSED) {
      widgetRef.current = null;
      setEnvoi(false);
      enCoursRef.current = false;
      return;
    }
    if (reason === FedaPay.CHECKOUT_COMPLETED) {
      widgetRef.current = null;
      router.push(`/reparation/suivi/${referenceRef.current}`);
    }
  };

  const envoyer = async () => {
    if (enCoursRef.current || !complet) return;
    enCoursRef.current = true;
    setEnvoi(true);
    setErreur(null);

    let cree = null;
    if (!creeRef.current) {
      try {
        cree = await reparationApi.creerDiagnostic({
          modelId: modele?.id || null,
          problemDescription: form.problemDescription.trim(),
          clientName: form.clientName.trim(),
          clientWhatsapp: `+${form.clientWhatsapp.replace(/\D/g, "")}`,
          clientEmail: form.clientEmail.trim() || null,
          city: form.city,
          neighborhood: form.neighborhood.trim() || null,
          instructions: form.instructions.trim() || null,
          pickupSlot: form.pickupSlot || null,
        });
        if (!cree?.reference) {
          setErreur("La demande n'a pas pu être enregistrée. Veuillez réessayer.");
          enCoursRef.current = false;
          setEnvoi(false);
          return;
        }
        referenceRef.current = cree.reference;
        creeRef.current = true;
      } catch (err) {
        // Ville non desservie, description trop courte : le serveur renvoie
        // des messages actionnables, affichés tels quels.
        setErreur(err.message || "Envoi impossible");
        enCoursRef.current = false;
        setEnvoi(false);
        return;
      }
    }

    // Deux issues, et le parcours doit fonctionner dans les DEUX.
    //
    // Les frais d'enlèvement sont un réglage qui peut valoir zéro. À zéro, le
    // serveur place la demande directement en « à récupérer » : il n'y a rien
    // à payer, et ouvrir un widget de paiement à zéro franc serait absurde.
    const total = cree?.total ?? 0;
    if (!cree || cree.status === "A_RECUPERER" || total <= 0) {
      setConfirmee({ reference: referenceRef.current, total: 0 });
      setEnvoi(false);
      enCoursRef.current = false;
      return;
    }

    if (typeof window === "undefined" || !window.FedaPay) {
      setErreur(
        "Le système de paiement est en cours de chargement. Réessayez dans quelques secondes.",
      );
      enCoursRef.current = false;
      setEnvoi(false);
      return;
    }

    const { firstname, lastname } = decouperNom(form.clientName);
    if (!widgetRef.current) {
      widgetRef.current = window.FedaPay.init({
        public_key: cleFedapay,
        environment: fedapayEnv || "live",
        transaction: {
          amount: total,
          description: `Enlèvement diagnostic MTECHBENIN ${referenceRef.current}`,
          custom_metadata: { repairRef: referenceRef.current },
        },
        customer: {
          firstname,
          lastname,
          email: form.clientEmail.trim() || undefined,
          phone_number: {
            number: `+${form.clientWhatsapp.replace(/\D/g, "")}`,
            country: "bj",
          },
        },
        onComplete: apresPaiement,
      });
    }
    widgetRef.current.open();
  };

  if (chargement) {
    return (
      <div className="max-w-2xl mx-auto px-5 py-20 text-center">
        <Loader2 className="w-6 h-6 text-apple-mid animate-spin mx-auto" />
      </div>
    );
  }

  if (confirmee) {
    return (
      <div className="max-w-2xl mx-auto px-5 py-16 text-center">
        <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-7 h-7 text-green-600" />
        </div>
        <h1 className="font-display font-black text-2xl text-apple-black mb-2">
          Demande enregistrée
        </h1>
        <p className="text-apple-mid text-[13px] mb-1">
          Un livreur va passer récupérer votre appareil. Nous vous contactons
          sur WhatsApp après analyse.
        </p>
        <p className="font-mono text-[13px] text-apple-black mb-6">
          {confirmee.reference}
        </p>
        <Link
          href={`/reparation/suivi/${confirmee.reference}`}
          className="inline-flex items-center gap-2 bg-apple-black text-white px-6 py-3 rounded-2xl font-semibold text-[13px]"
        >
          Suivre ma demande
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-5 py-10">
      <Script src="https://cdn.fedapay.com/checkout.js?v=1.1.7" strategy="lazyOnload" />

      <Link
        href={modeleSlug ? `/reparation` : "/reparation"}
        className="inline-flex items-center gap-1.5 text-apple-mid hover:text-apple-black text-[13px] font-medium mb-8 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Réparation
      </Link>

      <div className="flex items-start gap-3 mb-6">
        <div className="w-11 h-11 rounded-2xl bg-black/[0.04] flex items-center justify-center flex-shrink-0">
          <Stethoscope className="w-5 h-5 text-apple-black" strokeWidth={1.8} />
        </div>
        <div>
          <h1 className="font-display font-black text-2xl text-apple-black tracking-tight leading-none">
            Demander un diagnostic
          </h1>
          <p className="text-apple-mid text-[13px] mt-1">
            {modele
              ? `${modele.famille?.name || ""} · ${modele.name}`
              : "Vous ne savez pas ce qui ne va pas ?"}
          </p>
        </div>
      </div>

      <div
        className="rounded-3xl p-4 mb-6 flex items-start gap-2.5"
        style={{ background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.07)" }}
      >
        <Info className="w-4 h-4 text-apple-mid flex-shrink-0 mt-0.5" />
        <p className="text-apple-mid text-[12px] leading-relaxed">
          Le diagnostic est <strong className="text-apple-black">gratuit</strong>.
          Seuls des frais d&apos;enlèvement peuvent s&apos;appliquer pour le
          déplacement du livreur — ils vous sont annoncés avant tout paiement.
          Après analyse, nous vous proposons la réparation et son prix : vous
          restez libre de l&apos;accepter.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1.5 block">
            Décrivez le problème *
          </label>
          <textarea
            value={form.problemDescription}
            onChange={(e) => maj("problemDescription", e.target.value)}
            rows={5}
            placeholder="Exemple : mon téléphone est tombé hier. Depuis, l'écran reste noir mais il vibre quand j'appuie sur le bouton d'allumage."
            className="w-full bg-black/[0.03] rounded-2xl px-4 py-3 text-[13px] border border-black/[0.07] focus:outline-none focus:border-black/20 transition resize-none"
          />
          <p className="text-[11px] text-apple-mid mt-1">
            {descriptionTropCourte
              ? `Encore ${DESCRIPTION_MIN - form.problemDescription.trim().length} caractère(s) — plus vous en dites, plus l'analyse est rapide.`
              : "Merci, c'est assez précis pour commencer."}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1.5 block">
              Nom complet *
            </label>
            <input
              value={form.clientName}
              onChange={(e) => maj("clientName", e.target.value)}
              className="w-full bg-black/[0.03] rounded-2xl px-4 py-3 text-[13px] border border-black/[0.07] focus:outline-none focus:border-black/20 transition"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1.5 block">
              WhatsApp *
            </label>
            <input
              value={form.clientWhatsapp}
              onChange={(e) => maj("clientWhatsapp", e.target.value)}
              inputMode="numeric"
              className="w-full bg-black/[0.03] rounded-2xl px-4 py-3 text-[13px] border border-black/[0.07] focus:outline-none focus:border-black/20 transition"
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1.5 block">
            E-mail (facultatif)
          </label>
          <input
            value={form.clientEmail}
            onChange={(e) => maj("clientEmail", e.target.value)}
            type="email"
            className="w-full bg-black/[0.03] rounded-2xl px-4 py-3 text-[13px] border border-black/[0.07] focus:outline-none focus:border-black/20 transition"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1.5 block">
              Ville *
            </label>
            {/* La ville doit correspondre à une zone desservie : le serveur
                refuse sinon. Une liste fermée évite au client de découvrir le
                refus après avoir tout rempli. */}
            <select
              value={form.city}
              onChange={(e) => maj("city", e.target.value)}
              className="w-full bg-black/[0.03] rounded-2xl px-4 py-3 text-[13px] border border-black/[0.07] focus:outline-none focus:border-black/20 transition"
            >
              <option value="">Choisir…</option>
              {activeCities.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1.5 block">
              Quartier
            </label>
            <input
              value={form.neighborhood}
              onChange={(e) => maj("neighborhood", e.target.value)}
              className="w-full bg-black/[0.03] rounded-2xl px-4 py-3 text-[13px] border border-black/[0.07] focus:outline-none focus:border-black/20 transition"
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1.5 block">
            Indications pour le livreur
          </label>
          <input
            value={form.instructions}
            onChange={(e) => maj("instructions", e.target.value)}
            placeholder="Repère, étage, heure préférée…"
            className="w-full bg-black/[0.03] rounded-2xl px-4 py-3 text-[13px] border border-black/[0.07] focus:outline-none focus:border-black/20 transition"
          />
        </div>

        {erreur && (
          <div
            className="rounded-2xl p-3.5 flex items-start gap-2.5"
            style={{
              background: "rgba(227,6,19,0.05)",
              border: "1px solid rgba(227,6,19,0.15)",
            }}
          >
            <AlertTriangle className="w-4 h-4 text-cta flex-shrink-0 mt-0.5" />
            <p className="text-[12px] text-cta font-medium">{erreur}</p>
          </div>
        )}

        <button
          onClick={envoyer}
          disabled={!complet || envoi}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-apple-black hover:bg-neutral-800 text-white font-semibold text-[13px] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {envoi ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Envoi…
            </>
          ) : (
            "Envoyer ma demande"
          )}
        </button>
      </div>
    </div>
  );
}
