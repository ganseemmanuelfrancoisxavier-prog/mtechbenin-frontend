"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  ChevronDown,
  Loader2,
  AlertTriangle,
  Wrench,
  Tag,
  Info,
} from "lucide-react";
import { reparationApi } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import useSettingsStore from "@/store/settingsStore";

// Créneaux identiques à ceux du panier produit (`CheckoutPage.js`) — même
// vocabulaire pour le client sur les deux parcours de livraison/enlèvement.
const slots = ["Matin (8h - 12h)", "Après-midi (12h - 17h)", "Soir (17h - 20h)"];

const inputClass =
  "w-full bg-black/[0.03] text-apple-black text-[14px] placeholder-apple-mid/50 rounded-2xl px-4 py-3 border border-black/[0.07] focus:outline-none focus:border-black/20 focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,0,0,0.05)] transition-all duration-200";

function Field({ label, required, children, hint }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1 text-[12px] font-medium text-apple-mid">
        {label}
        {required && <span className="text-cta">*</span>}
        {hint && <span className="text-apple-mid/50 font-normal">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

// Découpe "Jean Kouassi" en prénom/nom pour le client FedaPay — même règle que
// `CheckoutPage.js` (`parseName`), dupliquée ici car non exportée par ce
// fichier qu'il est interdit de toucher.
function parseName(fullName) {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstname: parts[0], lastname: parts[0] };
  return { firstname: parts[0], lastname: parts.slice(1).join(" ") };
}

export default function ReparationCommande({ modeleSlug, optionsParam }) {
  const router = useRouter();
  const { getZoneByCity, getActiveCities, fedapayPublicKey, fedapayEnv } =
    useSettingsStore();
  const activeCities = getActiveCities();

  // ── Chargement du catalogue et résolution des options choisies ───────────
  const [loadingCatalogue, setLoadingCatalogue] = useState(true);
  // Message affiché à la place de l'écran quand le parcours ne peut pas
  // continuer (paramètre manquant, appareil ou option introuvable) — jamais
  // de page cassée, toujours un chemin de retour vers /reparation.
  const [erreurParcours, setErreurParcours] = useState(null);
  const [modele, setModele] = useState(null);
  const [famille, setFamille] = useState(null);
  const [lignes, setLignes] = useState([]); // [{ jobId, jobName, delay, optionId, optionLabel, price }]

  const [form, setForm] = useState({
    clientName: "",
    clientWhatsapp: "+229 ",
    clientEmail: "",
    city: "",
    neighborhood: "",
    instructions: "",
    pickupSlot: slots[0],
    couponCode: "",
  });

  const [fedapayReady, setFedapayReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [erreurSoumission, setErreurSoumission] = useState(null);

  const widgetRef = useRef(null);
  const referenceRef = useRef("");
  const totalsRef = useRef({ total: 0, feeAmount: 0 });
  // Verrou synchrone contre le double-clic (même raison que CheckoutPage.js :
  // un setState n'a pas le temps de re-render entre deux clics rapides).
  const submittingRef = useRef(false);
  const orderCreatedRef = useRef(false);

  useEffect(() => {
    let annule = false;

    async function charger() {
      if (!modeleSlug) {
        setErreurParcours(
          "Aucun appareil sélectionné. Reprenez votre choix depuis le début.",
        );
        setLoadingCatalogue(false);
        return;
      }
      const idsChoisis = String(optionsParam || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (idsChoisis.length === 0) {
        setErreurParcours(
          "Aucune réparation sélectionnée. Reprenez votre choix depuis le début.",
        );
        setLoadingCatalogue(false);
        return;
      }

      try {
        const data = await reparationApi.modele(modeleSlug);
        if (annule) return;
        const toutesOptions = (data.reparations || []).flatMap((job) =>
          job.options.map((opt) => ({
            jobId: job.id,
            jobName: job.name,
            delay: job.delay,
            optionId: opt.id,
            optionLabel: opt.label,
            price: opt.price,
          })),
        );
        const retenues = toutesOptions.filter((o) =>
          idsChoisis.includes(o.optionId),
        );
        if (retenues.length === 0) {
          setErreurParcours(
            "Ces réparations ne sont plus disponibles. Reprenez votre choix depuis le début.",
          );
          setLoadingCatalogue(false);
          return;
        }
        setModele(data.modele);
        setFamille(data.famille);
        setLignes(retenues);
        setLoadingCatalogue(false);
      } catch (err) {
        if (annule) return;
        setErreurParcours(
          err?.data?.error ||
            "Cet appareil est introuvable. Reprenez votre choix depuis le début.",
        );
        setLoadingCatalogue(false);
      }
    }

    charger();
    return () => {
      annule = true;
    };
  }, [modeleSlug, optionsParam]);

  // La ville par défaut est choisie une fois les zones connues, sans écraser
  // une saisie déjà en cours.
  useEffect(() => {
    if (!form.city && activeCities.length > 0) {
      setForm((f) => ({ ...f, city: f.city || activeCities[0] }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCities.length]);

  const updateForm = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const totalCatalogue = lignes.reduce((s, l) => s + l.price, 0);
  const deliveryZone = form.city ? getZoneByCity(form.city) : null;

  const formValid =
    form.clientName.trim().length > 1 &&
    form.clientWhatsapp.replace(/\D/g, "").length >= 10 &&
    !!form.city &&
    !!deliveryZone;

  const publicKey =
    fedapayPublicKey || process.env.NEXT_PUBLIC_FEDAPAY_PUBLIC_KEY || "";
  const environment =
    process.env.NEXT_PUBLIC_FEDAPAY_ENV || fedapayEnv || "sandbox";

  // ── Callback après paiement FedaPay ──────────────────────────────────────
  const handlePaymentComplete = (result) => {
    const FedaPay = window["FedaPay"];
    const reason = result?.reason;

    if (reason === FedaPay.DIALOG_DISMISSED) {
      widgetRef.current = null;
      return;
    }
    if (reason === FedaPay.CHECKOUT_COMPLETED) {
      // La commande existe déjà en base au statut EN_ATTENTE. Le webhook
      // FedaPay la fait passer à PAYEE puis A_RECUPERER et prévient le
      // client — ici on se contente d'envoyer vers le suivi.
      widgetRef.current = null;
      router.push(`/reparation/suivi/${referenceRef.current}`);
    }
  };

  // ── Crée la commande (EN_ATTENTE) puis ouvre le widget FedaPay ───────────
  const handlePayer = async () => {
    if (typeof window === "undefined" || !window.FedaPay) {
      setErreurSoumission(
        "Le système de paiement est en cours de chargement. Réessayez dans quelques secondes.",
      );
      return;
    }
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    setErreurSoumission(null);

    if (!orderCreatedRef.current) {
      try {
        const cree = await reparationApi.creerCommande({
          modelId: modele.id,
          optionIds: lignes.map((l) => l.optionId),
          clientName: form.clientName.trim(),
          clientWhatsapp: `+${form.clientWhatsapp.replace(/\D/g, "")}`,
          clientEmail: form.clientEmail.trim() || null,
          city: form.city,
          neighborhood: form.neighborhood.trim() || null,
          instructions: form.instructions.trim() || null,
          pickupSlot: form.pickupSlot || null,
          couponCode: form.couponCode.trim() || null,
        });
        // Sans référence, impossible de retrouver la commande au paiement —
        // mieux vaut ne pas ouvrir le widget du tout.
        if (!cree?.reference) {
          setErreurSoumission("La commande n'a pas pu être enregistrée. Veuillez réessayer.");
          submittingRef.current = false;
          setIsSubmitting(false);
          return;
        }
        referenceRef.current = cree.reference;
        totalsRef.current = { total: cree.total, feeAmount: cree.feeAmount };
        orderCreatedRef.current = true;
      } catch (err) {
        // Le serveur renvoie des messages actionnables (ville non desservie,
        // coupon invalide, réparation devenue indisponible) : affichés tels
        // quels, jamais avalés dans un console.error.
        setErreurSoumission(
          err?.data?.error ||
            err?.message ||
            "Erreur lors de la création de la commande. Veuillez réessayer.",
        );
        submittingRef.current = false;
        setIsSubmitting(false);
        return;
      }
    }

    const { firstname, lastname } = parseName(form.clientName);
    const digits = form.clientWhatsapp.replace(/\D/g, "");
    const localNumber = digits.startsWith("229") ? digits.slice(3) : digits;
    const customer = {
      firstname,
      lastname,
      phone_number: { number: localNumber, country: "BJ" },
    };
    if (form.clientEmail && form.clientEmail.includes("@")) {
      customer.email = form.clientEmail.trim();
    }

    if (!widgetRef.current) {
      widgetRef.current = window.FedaPay.init({
        public_key: publicKey,
        environment,
        transaction: {
          // Montant HORS frais de service : `total` renvoyé par le serveur
          // exclut déjà les frais (voir le commentaire de
          // `creerCommandeReparation` côté backend). Envoyer `total + feeAmount`
          // ici les facturerait une seconde fois.
          amount: totalsRef.current.total,
          description: `Réparation MTECHBENIN ${referenceRef.current}`,
          custom_metadata: { repairRef: referenceRef.current },
        },
        customer,
        currency: { iso: "XOF" },
        onComplete: handlePaymentComplete,
      });
    }
    widgetRef.current.open();
    submittingRef.current = false;
    setIsSubmitting(false);
  };

  // ── États de sortie anticipée ─────────────────────────────────────────────
  if (loadingCatalogue) {
    return (
      <div className="max-w-3xl mx-auto px-5 py-24 flex flex-col items-center justify-center text-center">
        <Loader2 className="w-6 h-6 text-apple-mid animate-spin mb-3" />
        <p className="text-apple-mid text-[14px]">Chargement de votre récapitulatif...</p>
      </div>
    );
  }

  if (erreurParcours) {
    return (
      <div className="max-w-xl mx-auto px-5 py-24 text-center">
        <div className="w-16 h-16 rounded-3xl bg-black/[0.04] flex items-center justify-center mx-auto mb-5">
          <AlertTriangle className="w-7 h-7 text-apple-mid" strokeWidth={1.5} />
        </div>
        <h1 className="font-display font-black text-2xl text-apple-black mb-2 tracking-tight">
          Impossible de continuer
        </h1>
        <p className="text-apple-mid text-[14px] mb-8">{erreurParcours}</p>
        <Link
          href="/reparation"
          className="inline-flex items-center gap-2 btn-dark text-sm px-7 py-3.5"
        >
          Choisir un appareil <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <>
      <Script
        src="https://cdn.fedapay.com/checkout.js?v=1.1.7"
        strategy="lazyOnload"
        onLoad={() => setFedapayReady(true)}
      />

      <div className="max-w-5xl mx-auto px-5 py-10">
        <div className="mb-8">
          <p className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1">
            Réparation
          </p>
          <h1 className="font-display font-black text-2xl md:text-3xl text-apple-black tracking-tight">
            Confirmez votre commande
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-5">
            {/* ── Contact ─────────────────────────────────────────────────── */}
            <div className="glass-card rounded-3xl p-5 space-y-4">
              <p className="text-[12px] font-semibold text-apple-mid uppercase tracking-widest">
                Contact
              </p>
              <Field label="Nom complet" required>
                <input
                  value={form.clientName}
                  onChange={(e) => updateForm("clientName", e.target.value)}
                  placeholder="Jean Kouassi"
                  className={inputClass}
                />
              </Field>
              <Field label="WhatsApp" required>
                <input
                  value={form.clientWhatsapp}
                  onChange={(e) => updateForm("clientWhatsapp", e.target.value)}
                  placeholder="+229 97 00 00 00"
                  type="tel"
                  className={inputClass}
                />
              </Field>
              <Field label="Email" hint="— facultatif">
                <input
                  value={form.clientEmail}
                  onChange={(e) => updateForm("clientEmail", e.target.value)}
                  placeholder="jean@email.com"
                  type="email"
                  className={inputClass}
                />
              </Field>
            </div>

            {/* ── Enlèvement ──────────────────────────────────────────────── */}
            <div className="glass-card rounded-3xl p-5 space-y-4">
              <p className="text-[12px] font-semibold text-apple-mid uppercase tracking-widest">
                Enlèvement de l&apos;appareil
              </p>
              <Field label="Ville" required>
                <div className="relative">
                  <select
                    value={form.city}
                    onChange={(e) => updateForm("city", e.target.value)}
                    className={`${inputClass} appearance-none pr-10`}
                  >
                    <option value="">Choisir une ville</option>
                    {activeCities.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-apple-mid pointer-events-none" />
                </div>
                {form.city && deliveryZone && (
                  <div className="flex items-center gap-2 mt-2 px-1">
                    <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" strokeWidth={2.5} />
                    <span className="text-green-600 text-[12px] font-medium">
                      Zone desservie{deliveryZone.delay ? ` · ${deliveryZone.delay}` : ""}
                    </span>
                  </div>
                )}
                {form.city && !deliveryZone && (
                  <p className="text-cta text-[12px] mt-2 px-1">
                    ⚠ Cette ville n&apos;est pas desservie par notre service de réparation
                  </p>
                )}
              </Field>

              <Field label="Quartier" hint="— facultatif">
                <input
                  value={form.neighborhood}
                  onChange={(e) => updateForm("neighborhood", e.target.value)}
                  placeholder="Akpakpa, Cadjehoun..."
                  className={inputClass}
                />
              </Field>

              <Field label="Instructions" hint="— facultatif">
                <input
                  value={form.instructions}
                  onChange={(e) => updateForm("instructions", e.target.value)}
                  placeholder="Maison bleue, portail rouge..."
                  className={inputClass}
                />
              </Field>

              <Field label="Créneau souhaité">
                <div className="grid grid-cols-3 gap-2">
                  {slots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => updateForm("pickupSlot", slot)}
                      className={`py-2.5 px-3 rounded-2xl text-[12px] font-medium text-center transition-all duration-200 ${
                        form.pickupSlot === slot
                          ? "bg-apple-black text-white"
                          : "bg-black/[0.04] text-apple-mid hover:bg-black/[0.07]"
                      }`}
                    >
                      {slot.split(" ")[0]}
                      <br />
                      <span className="text-[10px] opacity-70">
                        {slot.match(/\(([^)]+)\)/)?.[1]}
                      </span>
                    </button>
                  ))}
                </div>
              </Field>
            </div>

            {/* ── Code promo ──────────────────────────────────────────────── */}
            <div className="glass-card rounded-3xl p-5 space-y-3">
              <p className="text-[12px] font-semibold text-apple-mid uppercase tracking-widest flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" strokeWidth={1.8} /> Code promo — facultatif
              </p>
              <input
                value={form.couponCode}
                onChange={(e) => updateForm("couponCode", e.target.value.toUpperCase())}
                placeholder="CODEPROMO"
                className={inputClass}
              />
            </div>

            {erreurSoumission && (
              <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-red-50 border border-red-100">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" strokeWidth={1.8} />
                <p className="text-red-600 text-[13px]">{erreurSoumission}</p>
              </div>
            )}

            <button
              onClick={handlePayer}
              disabled={!formValid || !fedapayReady || isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-[14px] font-semibold transition-all duration-200 active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: formValid ? "rgba(29,29,31,0.92)" : "rgba(0,0,0,0.06)",
                color: formValid ? "#FFFFFF" : "#6E6E73",
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(255,255,255,0.07)",
                boxShadow: formValid ? "0 2px 14px rgba(0,0,0,0.22)" : "none",
              }}
            >
              {isSubmitting ? (
                "Création de la commande..."
              ) : !fedapayReady ? (
                "Chargement du paiement..."
              ) : (
                <>
                  <ArrowRight className="w-4 h-4" /> Procéder au paiement
                </>
              )}
            </button>
          </div>

          {/* ── Récapitulatif ─────────────────────────────────────────────── */}
          <div className="lg:col-span-2">
            <div className="glass-card rounded-3xl p-5 sticky top-24 space-y-4">
              <p className="text-[12px] font-semibold text-apple-mid uppercase tracking-widest flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5" strokeWidth={1.8} /> Récapitulatif
              </p>

              <div>
                <p className="text-apple-mid text-[11px]">Appareil</p>
                <p className="font-semibold text-apple-black text-[14px]">
                  {famille?.name} · {modele?.name}
                </p>
              </div>

              <div className="border-t border-black/[0.06] pt-3 space-y-3">
                {lignes.map((l) => (
                  <div key={l.optionId} className="flex justify-between gap-3 items-start">
                    <div className="flex-1 min-w-0">
                      <span className="text-apple-black text-[13px] font-medium block truncate">
                        {l.jobName}
                      </span>
                      <span className="text-apple-mid text-[11px]">{l.optionLabel}</span>
                    </div>
                    <span className="font-semibold text-apple-black text-[13px] flex-shrink-0">
                      {formatPrice(l.price)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-black/[0.06] pt-3 flex justify-between items-baseline">
                <span className="font-bold text-apple-black text-[14px]">Total</span>
                <span className="font-display font-black text-lg text-apple-black">
                  {formatPrice(totalCatalogue)}
                </span>
              </div>

              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-blue-50/60 border border-blue-100/80">
                <Info className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" strokeWidth={1.8} />
                <p className="text-[11px] text-blue-600 leading-relaxed">
                  Le montant exact — frais de paiement inclus, code promo appliqué —
                  vous sera confirmé sur l&apos;écran de paiement sécurisé.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
