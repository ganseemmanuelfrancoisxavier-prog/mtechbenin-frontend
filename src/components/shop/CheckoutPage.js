"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Check,
  ShoppingBag,
  Tag,
  ChevronDown,
  Lock,
  Gift,
  Truck,
  Info,
} from "lucide-react";
import useCartStore from "@/store/cartStore";
import useSettingsStore from "@/store/settingsStore";
import useOrderStore from "@/store/orderStore";
import { ordersApi } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import dynamic from "next/dynamic";

const MapPicker = dynamic(() => import("./MapPicker"), { ssr: false });

const countryCodes = [
  { code: "+229", flag: "🇧🇯", name: "Bénin", country: "BJ" },
  { code: "+225", flag: "🇨🇮", name: "Côte d'Ivoire", country: "CI" },
  { code: "+228", flag: "🇹🇬", name: "Togo", country: "TG" },
  { code: "+221", flag: "🇸🇳", name: "Sénégal", country: "SN" },
  { code: "+227", flag: "🇳🇪", name: "Niger", country: "NE" },
  { code: "+226", flag: "🇧🇫", name: "Burkina Faso", country: "BF" },
  { code: "+223", flag: "🇲🇱", name: "Mali", country: "ML" },
  { code: "+224", flag: "🇬🇳", name: "Guinée", country: "GN" },
  { code: "+212", flag: "🇲🇦", name: "Maroc", country: "MA" },
  { code: "+213", flag: "🇩🇿", name: "Algérie", country: "DZ" },
  { code: "+216", flag: "🇹🇳", name: "Tunisie", country: "TN" },
  { code: "+33", flag: "🇫🇷", name: "France", country: "FR" },
  { code: "+1", flag: "🇺🇸", name: "USA / Canada", country: "US" },
];

const steps = [
  { id: 1, label: "Livraison" },
  { id: 2, label: "Paiement" },
  { id: 3, label: "Confirmation" },
];

const slots = [
  "Matin (8h - 12h)",
  "Après-midi (12h - 17h)",
  "Soir (17h - 20h)",
];

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

const inputClass =
  "w-full bg-black/[0.03] text-apple-black text-[14px] placeholder-apple-mid/50 rounded-2xl px-4 py-3 border border-black/[0.07] focus:outline-none focus:border-black/20 focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,0,0,0.05)] transition-all duration-200";

// ── Parse "Jean Kouassi" → { firstname: "Jean", lastname: "Kouassi" } ─────────
function parseName(fullName) {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstname: parts[0], lastname: parts[0] };
  return { firstname: parts[0], lastname: parts.slice(1).join(" ") };
}

// ── Récupère le code pays ISO depuis l'indicatif ──────────────────────────────
function getCountryCode(dialCode) {
  return countryCodes.find((c) => c.code === dialCode)?.country || "BJ";
}

export default function CheckoutPage() {
  const {
    items,
    getTotalPrice,
    getFinalPrice,
    getDiscountAmount,
    appliedCoupon,
    clearCart,
  } = useCartStore();

  const {
    getZoneByCity,
    getActiveCities,
    fedapayPublicKey,
    fedapayEnv,
    paymentFeePercent,
  } = useSettingsStore();

  const { addOrder } = useOrderStore();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [coords, setCoords] = useState({ lat: 6.3654, lng: 2.4183 });
  const [fedapayReady, setFedapayReady] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const widgetRef = useRef(null);
  const orderSentRef = useRef(false);
  // Verrou synchrone (ref, pas un state — un double-clic déclenche deux appels
  // avant qu'un setState n'ait eu le temps de re-render) contre la double
  // soumission de commande.
  const submittingRef = useRef(false);
  const activeCities = getActiveCities();

  const [form, setForm] = useState({
    firstName: "",
    whatsapp: "",
    dialCode: "+229",
    city: activeCities[0] || "",
    email: "",
    slot: slots[0],
    showAddress: false,
    neighborhood: "",
    instructions: "",
    showMap: false,
    isGift: false,
    giftName: "",
    giftWhatsapp: "",
    giftDialCode: "+229",
  });

  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  // La référence n'est plus tirée ici : elle vient du serveur, qui la génère
  // d'une source cryptographique à la création de la commande. Le tirage local
  // (`Math.random()` sur 5 chiffres) était devinable et entrait en collision.
  // `refCommandeRef` porte la valeur qui fait foi — l'état ne sert qu'à
  // l'affichage, et un setState n'est pas lisible dans le même tour de boucle.
  const [orderRef, setOrderRef] = useState("");
  const refCommandeRef = useRef("");

  const updateForm = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const fullWhatsapp = `${form.dialCode}${form.whatsapp}`;
  const fullGiftWhatsapp = `${form.giftDialCode}${form.giftWhatsapp}`;

  // ── Calculs prix ──────────────────────────────────────────────────────────
  const subtotal = getTotalPrice();
  const discount = getDiscountAmount();
  const afterCoupon = getFinalPrice();

  const hasPhysicalProduct = items.some((item) => item.category !== "abonnements");
  const deliveryZone = hasPhysicalProduct ? getZoneByCity(form.city) : null;
  const deliveryFee = deliveryZone ? deliveryZone.fee : 0;
  const deliveryDelay = deliveryZone ? deliveryZone.delay : null;

  const baseTotal = afterCoupon + deliveryFee;
  const feeRate = (paymentFeePercent || 0) / 100;
  const feeAmount = Math.ceil(baseTotal * feeRate);
  const grandTotal = baseTotal + feeAmount; // affiché au client
  // FedaPay reçoit toujours baseTotal (sans frais) — les frais restent chez MTECHBENIN
  const fedapayAmount = baseTotal;

  const step1Valid =
    form.firstName.trim() &&
    form.whatsapp.replace(/\D/g, "").length >= 8 &&
    form.email.trim().includes("@") &&
    (hasPhysicalProduct ? !!form.city : true);

  const publicKey =
    fedapayPublicKey || process.env.NEXT_PUBLIC_FEDAPAY_PUBLIC_KEY || "";
  const environment =
    process.env.NEXT_PUBLIC_FEDAPAY_ENV || fedapayEnv || "sandbox";

  const DialCodeSelect = ({ value, onChange }) => (
    <div className="relative flex-shrink-0">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-black/[0.03] text-apple-black text-[13px] rounded-2xl pl-3 pr-7 py-3 border border-black/[0.07] focus:outline-none focus:border-black/20 transition-all duration-200 cursor-pointer h-full"
      >
        {countryCodes.map((c) => (
          <option key={c.code} value={c.code}>
            {c.flag} {c.code}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-apple-mid pointer-events-none" />
    </div>
  );

  // ── Callback après paiement FedaPay ──────────────────────────────────────
  // onComplete reçoit un seul objet { reason, transaction }
  const handlePaymentComplete = async (result) => {
    const FedaPay = window["FedaPay"];
    const reason = result?.reason;

    if (reason === FedaPay.DIALOG_DISMISSED) {
      widgetRef.current = null;
      return;
    }

    if (reason === FedaPay.CHECKOUT_COMPLETED) {
      // L'ordre existe déjà en base (créé avant l'ouverture du widget).
      // Le webhook FedaPay se charge de passer le statut à CONFIRMED
      // et d'envoyer les notifications au client et à l'admin.
      addOrder({
        // `refCommandeRef` plutôt que l'état : ce callback est capturé par le
        // widget au moment de l'init, alors que le setState n'a pas encore été
        // appliqué — l'état y vaudrait encore la chaîne vide.
        id: refCommandeRef.current,
        client: { name: form.firstName, phone: fullWhatsapp },
        items: items.map((item) => ({
          name: item.name,
          qty: item.quantity,
          price: item.price,
        })),
        total: grandTotal,
        status: "confirmed",
        paymentMethod: "Mobile Money",
        paymentStatus: "paid",
        address: [form.neighborhood, form.city].filter(Boolean).join(", "),
        note: form.instructions || "",
        date: new Date().toISOString(),
        email: form.email || "",
        slot: form.slot,
        isGift: form.isGift,
        giftName: form.giftName || "",
        giftWhatsapp: form.isGift ? fullGiftWhatsapp : "",
        coords: form.showMap ? coords : null,
        couponCode: appliedCoupon?.code || null,
        discount,
        deliveryFee,
        feeAmount,
      });

      widgetRef.current = null;
      clearCart();
      setStep(3);
    }
  };

  // ── Ouvre le widget FedaPay (crée l'ordre en base avant d'ouvrir) ─────────
  const handlePayment = async () => {
    if (typeof window === "undefined" || !window.FedaPay) {
      alert(
        "Le système de paiement est en cours de chargement. Réessayez dans quelques secondes.",
      );
      return;
    }

    if (submittingRef.current) return; // double-clic ignoré
    submittingRef.current = true;
    setIsSubmittingOrder(true);

    // Crée l'ordre en statut PENDING avant le paiement pour que le webhook
    // FedaPay puisse le trouver et le passer automatiquement à CONFIRMED
    if (!orderSentRef.current) {
      const orderData = {
        guestName: form.firstName,
        guestWhatsapp: fullWhatsapp,
        guestEmail: form.email || null,
        city: hasPhysicalProduct ? form.city : null,
        neighborhood: hasPhysicalProduct ? form.neighborhood || null : null,
        instructions: hasPhysicalProduct ? form.instructions || null : null,
        deliverySlot: hasPhysicalProduct ? form.slot : null,
        deliveryLat: hasPhysicalProduct && form.showMap ? coords.lat : null,
        deliveryLng: hasPhysicalProduct && form.showMap ? coords.lng : null,
        isGift: form.isGift,
        giftName: form.giftName || null,
        giftWhatsapp: form.isGift ? fullGiftWhatsapp : null,
        subtotal,
        discount,
        deliveryFee,
        feeAmount,
        total: grandTotal,
        couponCode: appliedCoupon?.code || null,
        items: items.map((item) => ({
          productSlug: item.slug || String(item.id),
          productName: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice: item.price * item.quantity,
          variants: item.selectedVariants || [],
        })),
      };
      try {
        const cree = await ordersApi.create(orderData);
        const reference = cree?.order?.reference;
        // Sans référence, le webhook ne saurait pas quelle commande confirmer :
        // mieux vaut ne pas ouvrir le widget de paiement du tout.
        if (!reference) {
          alert("La commande n'a pas pu être enregistrée. Veuillez réessayer.");
          submittingRef.current = false;
          setIsSubmittingOrder(false);
          return;
        }
        refCommandeRef.current = reference;
        setOrderRef(reference);
        orderSentRef.current = true;
      } catch (err) {
        console.error("❌ Erreur création commande", err.message);
        // Le serveur renvoie des messages actionnables (« Choix requis :
        // Couleur », « Le prix de X a changé, veuillez rafraîchir la page »,
        // « Stock insuffisant pour X ») — les afficher tels quels plutôt que
        // de suggérer de réessayer, un conseil qui ne résoudra jamais ces cas.
        const serverMessage = err?.data?.error;
        alert(
          serverMessage ||
            "Erreur lors de la création de la commande. Veuillez réessayer.",
        );
        submittingRef.current = false;
        setIsSubmittingOrder(false);
        return;
      }
    }

    // ── Parse le nom complet en prénom + nom ──────────────────────────────
    const { firstname, lastname } = parseName(form.firstName);

    // ── Construit le customer — email omis si absent ou invalide ──────────
    const customer = {
      firstname,
      lastname,
      phone_number: {
        number: form.whatsapp.replace(/\D/g, ""), // chiffres uniquement sans indicatif
        country: getCountryCode(form.dialCode),
      },
    };

    // N'ajoute l'email que s'il est renseigné et contient un @
    if (form.email && form.email.includes("@")) {
      customer.email = form.email;
    }

    if (!widgetRef.current) {
      widgetRef.current = window.FedaPay.init({
        public_key: publicKey,
        environment,
        transaction: {
          amount: fedapayAmount,
          description: `Commande MTECHBENIN ${refCommandeRef.current}`,
          custom_metadata: { orderRef: refCommandeRef.current },
        },
        customer,
        currency: { iso: "XOF" },
        onComplete: handlePaymentComplete,
      });
    }

    widgetRef.current.open();
    submittingRef.current = false;
    setIsSubmittingOrder(false);
  };

  if (items.length === 0 && step !== 3) {
    return (
      <div className="max-w-7xl mx-auto px-5 py-24 text-center">
        <div className="w-16 h-16 rounded-3xl bg-black/[0.04] flex items-center justify-center mx-auto mb-5">
          <ShoppingBag className="w-7 h-7 text-apple-mid" strokeWidth={1.5} />
        </div>
        <h1 className="font-display font-black text-2xl text-apple-black mb-2 tracking-tight">
          Votre panier est vide
        </h1>
        <p className="text-apple-mid text-[14px] mb-8">
          Ajoutez des produits avant de passer commande
        </p>
        <Link
          href="/catalogue"
          className="inline-flex items-center gap-2 btn-dark text-sm px-7 py-3.5"
        >
          Découvrir les produits <ArrowRight className="w-4 h-4" />
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
        {/* Indicateur étapes */}
        <div className="flex items-center justify-center gap-0 mb-12">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold transition-all duration-300 ${
                    step > s.id
                      ? "bg-green-500 text-white"
                      : step === s.id
                        ? "bg-apple-black text-white shadow-premium"
                        : "bg-black/[0.06] text-apple-mid"
                  }`}
                >
                  {step > s.id ? <Check className="w-4 h-4" /> : s.id}
                </div>
                <span
                  className={`text-[11px] mt-1.5 font-medium tracking-tight ${step === s.id ? "text-apple-black" : "text-apple-mid"}`}
                >
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`w-16 md:w-24 h-px mx-3 mb-5 transition-all duration-500 ${step > s.id ? "bg-green-500" : "bg-black/[0.08]"}`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-5">
            {/* ═══════ ÉTAPE 1 ═══════ */}
            {step === 1 && (
              <>
                <div>
                  <p className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1">
                    Étape 1
                  </p>
                  <h2 className="font-display font-black text-2xl text-apple-black tracking-tight">
                    Vos informations
                  </h2>
                </div>

                <div className="glass-card rounded-3xl p-5 space-y-4">
                  <p className="text-[12px] font-semibold text-apple-mid uppercase tracking-widest">
                    Contact
                  </p>
                  <Field label="Nom complet" required>
                    <input
                      value={form.firstName}
                      onChange={(e) => updateForm("firstName", e.target.value)}
                      placeholder="Jean Kouassi"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Téléphone WhatsApp" required>
                    <div className="flex gap-2">
                      <DialCodeSelect
                        value={form.dialCode}
                        onChange={(v) => updateForm("dialCode", v)}
                      />
                      <input
                        value={form.whatsapp}
                        onChange={(e) =>
                          updateForm(
                            "whatsapp",
                            e.target.value.replace(/\D/g, ""),
                          )
                        }
                        placeholder="97 00 00 00"
                        type="tel"
                        className={`${inputClass} flex-1`}
                      />
                    </div>
                    {form.whatsapp && (
                      <p className="text-[11px] text-apple-mid mt-1.5 px-1">
                        📱 Numéro complet :{" "}
                        <span className="font-mono font-medium text-apple-black">
                          {fullWhatsapp}
                        </span>
                      </p>
                    )}
                  </Field>
                  <Field
                    label="Email"
                    required
                    hint="— pour recevoir votre reçu"
                  >
                    <input
                      value={form.email}
                      onChange={(e) => updateForm("email", e.target.value)}
                      placeholder="jean@email.com"
                      type="email"
                      required
                      className={inputClass}
                    />
                  </Field>
                </div>

                {hasPhysicalProduct && (
                <div className="glass-card rounded-3xl p-5 space-y-4">
                  <p className="text-[12px] font-semibold text-apple-mid uppercase tracking-widest">
                    Livraison
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
                        <Check
                          className="w-3.5 h-3.5 text-green-500 flex-shrink-0"
                          strokeWidth={2.5}
                        />
                        <span className="text-green-600 text-[12px] font-medium">
                          Livraison disponible — {formatPrice(deliveryFee)}
                          {deliveryDelay ? ` · ${deliveryDelay}` : ""}
                        </span>
                      </div>
                    )}
                    {form.city && !deliveryZone && (
                      <p className="text-cta text-[12px] mt-2 px-1">
                        ⚠ Livraison non disponible dans cette ville
                      </p>
                    )}
                  </Field>

                  <Field label="Créneau de livraison">
                    <div className="grid grid-cols-3 gap-2">
                      {slots.map((slot) => (
                        <button
                          key={slot}
                          onClick={() => updateForm("slot", slot)}
                          className={`py-2.5 px-3 rounded-2xl text-[12px] font-medium text-center transition-all duration-200 ${
                            form.slot === slot
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

                  <button
                    onClick={() => updateForm("showAddress", !form.showAddress)}
                    className="w-full flex items-center justify-between py-3 px-4 rounded-2xl bg-black/[0.03] hover:bg-black/[0.05] transition-all duration-200"
                  >
                    <div className="flex items-center gap-2.5">
                      <Truck
                        className="w-4 h-4 text-apple-mid"
                        strokeWidth={1.6}
                      />
                      <span className="text-[13px] font-medium text-apple-black">
                        Préciser une adresse de livraison
                      </span>
                    </div>
                    <div
                      className={`w-9 h-5 rounded-full transition-colors duration-200 relative flex-shrink-0 ${form.showAddress ? "bg-apple-black" : "bg-black/[0.15]"}`}
                    >
                      <div
                        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${form.showAddress ? "translate-x-4" : "translate-x-0.5"}`}
                      />
                    </div>
                  </button>

                  {form.showAddress && (
                    <div className="space-y-3 animate-slide-down">
                      <Field label="Quartier">
                        <input
                          value={form.neighborhood}
                          onChange={(e) =>
                            updateForm("neighborhood", e.target.value)
                          }
                          placeholder="Akpakpa, Cadjehoun..."
                          className={inputClass}
                        />
                      </Field>
                      <Field label="Instructions" hint="— optionnel">
                        <input
                          value={form.instructions}
                          onChange={(e) =>
                            updateForm("instructions", e.target.value)
                          }
                          placeholder="Maison bleue, portail rouge..."
                          className={inputClass}
                        />
                      </Field>
                      <button
                        onClick={() => updateForm("showMap", !form.showMap)}
                        className="w-full flex items-center justify-between py-3 px-4 rounded-2xl bg-black/[0.03] hover:bg-black/[0.05] transition-all duration-200"
                      >
                        <div className="flex items-center gap-2.5">
                          <MapPin
                            className="w-4 h-4 text-apple-mid"
                            strokeWidth={1.6}
                          />
                          <span className="text-[13px] font-medium text-apple-black">
                            Épingler ma position GPS
                          </span>
                        </div>
                        <div
                          className={`w-9 h-5 rounded-full transition-colors duration-200 relative flex-shrink-0 ${form.showMap ? "bg-apple-black" : "bg-black/[0.15]"}`}
                        >
                          <div
                            className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${form.showMap ? "translate-x-4" : "translate-x-0.5"}`}
                          />
                        </div>
                      </button>
                      {form.showMap && (
                        <div className="animate-slide-down">
                          <div className="rounded-2xl overflow-hidden h-56 border border-black/[0.07]">
                            <MapPicker
                              coords={coords}
                              onCoordsChange={setCoords}
                            />
                          </div>
                          <p className="text-[11px] text-apple-mid mt-1.5">
                            📍 {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                )}

                <button
                  onClick={() => updateForm("isGift", !form.isGift)}
                  className="w-full glass-card rounded-3xl p-4 flex items-center justify-between hover:shadow-premium-sm transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-2xl bg-black/[0.04] flex items-center justify-center">
                      <Gift
                        className="w-4 h-4 text-apple-mid"
                        strokeWidth={1.6}
                      />
                    </div>
                    <div className="text-left">
                      <p className="text-[13px] font-semibold text-apple-black">
                        C&apos;est un cadeau
                      </p>
                      <p className="text-[11px] text-apple-mid">
                        Livrer à une autre personne
                      </p>
                    </div>
                  </div>
                  <div
                    className={`w-9 h-5 rounded-full transition-colors duration-200 relative flex-shrink-0 ${form.isGift ? "bg-apple-black" : "bg-black/[0.15]"}`}
                  >
                    <div
                      className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${form.isGift ? "translate-x-4" : "translate-x-0.5"}`}
                    />
                  </div>
                </button>

                {form.isGift && (
                  <div className="glass-card rounded-3xl p-5 space-y-4 animate-slide-down border border-black/[0.06]">
                    <p className="text-[12px] font-semibold text-apple-mid uppercase tracking-widest">
                      Destinataire
                    </p>
                    <Field label="Nom du destinataire">
                      <input
                        value={form.giftName}
                        onChange={(e) => updateForm("giftName", e.target.value)}
                        placeholder="Marie Adjovi"
                        className={inputClass}
                      />
                    </Field>
                    <Field label="WhatsApp du destinataire">
                      <div className="flex gap-2">
                        <DialCodeSelect
                          value={form.giftDialCode}
                          onChange={(v) => updateForm("giftDialCode", v)}
                        />
                        <input
                          value={form.giftWhatsapp}
                          onChange={(e) =>
                            updateForm(
                              "giftWhatsapp",
                              e.target.value.replace(/\D/g, ""),
                            )
                          }
                          placeholder="95 00 00 00"
                          type="tel"
                          className={`${inputClass} flex-1`}
                        />
                      </div>
                      {form.giftWhatsapp && (
                        <p className="text-[11px] text-apple-mid mt-1.5 px-1">
                          Numéro complet :{" "}
                          <span className="font-mono font-medium text-apple-black">
                            {fullGiftWhatsapp}
                          </span>
                        </p>
                      )}
                    </Field>
                  </div>
                )}

                <button
                  onClick={() => setStep(2)}
                  disabled={!step1Valid}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-[14px] font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: step1Valid
                      ? "rgba(29,29,31,0.92)"
                      : "rgba(0,0,0,0.06)",
                    color: step1Valid ? "#FFFFFF" : "#6E6E73",
                    backdropFilter: "blur(16px)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    boxShadow: step1Valid
                      ? "0 2px 14px rgba(0,0,0,0.22)"
                      : "none",
                  }}
                >
                  Continuer vers le paiement <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}

            {/* ═══════ ÉTAPE 2 ═══════ */}
            {step === 2 && (
              <>
                <div>
                  <p className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1">
                    Étape 2
                  </p>
                  <h2 className="font-display font-black text-2xl text-apple-black tracking-tight">
                    Paiement
                  </h2>
                </div>

                <div className="glass-card rounded-3xl p-5 space-y-4">
                  <p className="text-[12px] font-semibold text-apple-mid uppercase tracking-widest">
                    Récapitulatif
                  </p>
                  <div className="space-y-2.5">
                    {[
                      { label: "Client", value: form.firstName },
                      { label: "WhatsApp", value: fullWhatsapp },
                      ...(hasPhysicalProduct
                        ? [{ label: "Ville", value: form.city }]
                        : []),
                      ...(hasPhysicalProduct && form.neighborhood
                        ? [{ label: "Quartier", value: form.neighborhood }]
                        : []),
                      ...(hasPhysicalProduct
                        ? [{ label: "Créneau", value: form.slot }]
                        : []),
                    ].map((row) => (
                      <div
                        key={row.label}
                        className="flex justify-between text-[13px]"
                      >
                        <span className="text-apple-mid">{row.label}</span>
                        <span className="font-medium text-apple-black">
                          {row.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-black/[0.06] pt-3 space-y-2">
                    <div className="flex justify-between text-[13px]">
                      <span className="text-apple-mid">Articles</span>
                      <span className="font-medium text-apple-black">
                        {formatPrice(subtotal)}
                      </span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-[13px] text-green-600 font-medium">
                        <span>Réduction ({appliedCoupon?.code})</span>
                        <span>-{formatPrice(discount)}</span>
                      </div>
                    )}
                    {hasPhysicalProduct && (
                    <div className="flex justify-between text-[13px]">
                      <span className="text-apple-mid">
                        Livraison — {form.city}
                      </span>
                      <span
                        className={`font-medium ${deliveryFee > 0 ? "text-apple-black" : "text-green-600"}`}
                      >
                        {deliveryFee > 0
                          ? formatPrice(deliveryFee)
                          : "Gratuite"}
                      </span>
                    </div>
                    )}
                    {hasPhysicalProduct && deliveryDelay && (
                      <div className="flex justify-between text-[11px]">
                        <span className="text-apple-mid/60">Délai estimé</span>
                        <span className="text-apple-mid">{deliveryDelay}</span>
                      </div>
                    )}
                    {feeAmount > 0 && (
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="text-apple-mid flex items-center gap-1.5">
                          Frais de paiement
                          <span className="text-[10px] bg-black/[0.05] px-1.5 py-0.5 rounded-full font-medium">
                            {paymentFeePercent}%
                          </span>
                        </span>
                        <span className="font-medium text-apple-mid">
                          {formatPrice(feeAmount)}
                        </span>
                      </div>
                    )}
                    {feeAmount > 0 && (
                      <div className="flex items-start gap-2 p-2.5 rounded-xl bg-blue-50/60 border border-blue-100/80">
                        <Info
                          className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5"
                          strokeWidth={1.8}
                        />
                        <p className="text-[11px] text-blue-600 leading-relaxed">
                          Les frais de paiement sont ajoutés par notre
                          intégrateur. Vous ne paierez pas plus que le montant
                          total affiché.
                        </p>
                      </div>
                    )}
                    <div className="border-t border-black/[0.06] pt-2 flex justify-between">
                      <span className="font-bold text-apple-black text-[14px]">
                        Total à payer
                        {feeAmount > 0 && (
                          <span className="text-[11px] text-apple-mid font-normal ml-1">
                            (frais inclus)
                          </span>
                        )}
                      </span>
                      <span className="font-display font-black text-lg text-apple-black">
                        {formatPrice(grandTotal)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="glass-card rounded-3xl overflow-hidden">
                  <button
                    onClick={() => setShowPaymentMethods((v) => !v)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-black/[0.02] transition-colors duration-150"
                  >
                    <div className="flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-apple-mid" strokeWidth={1.6} />
                      <span className="text-[12px] font-semibold text-apple-mid uppercase tracking-widest">
                        Méthodes de paiement acceptées
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-apple-mid transition-transform duration-200 ${showPaymentMethods ? "rotate-180" : ""}`}
                    />
                  </button>

                  {showPaymentMethods && (
                    <div className="px-5 pb-5 border-t border-black/[0.05]">
                      <div className="pt-4 space-y-3">
                        {[
                          {
                            flag: "🇧🇯",
                            pays: "Bénin",
                            methods: ["MTN MoMo", "Moov Money", "Celtiis", "BMO", "Coris Money"],
                          },
                          { flag: "🇹🇬", pays: "Togo", methods: ["Mixx By Yas", "Moov"] },
                          { flag: "🇨🇮", pays: "Côte d'Ivoire", methods: ["MTN"] },
                          { flag: "🇳🇪", pays: "Niger", methods: ["Airtel"] },
                          { flag: "🇸🇳", pays: "Sénégal", methods: ["Free Sénégal"] },
                          { flag: "🌍", pays: "International", methods: ["Visa", "MasterCard"] },
                        ].map(({ flag, pays, methods }) => (
                          <div key={pays}>
                            <p className="text-[10px] font-semibold text-apple-mid/60 uppercase tracking-widest mb-2">
                              {flag} {pays}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {methods.map((m) => (
                                <span
                                  key={m}
                                  className="text-[12px] bg-black/[0.04] text-apple-mid px-3 py-1.5 rounded-xl font-medium border border-black/[0.06]"
                                >
                                  {m}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-[11px] text-apple-mid mt-4 pt-3 border-t border-black/[0.05]">
                        Paiement 100% sécurisé via FedaPay — Bénin · Côte d&apos;Ivoire · Togo · Niger · Sénégal
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="flex items-center gap-2 px-5 py-3.5 rounded-2xl text-[13px] font-medium text-apple-mid hover:text-apple-black transition-all duration-200"
                    style={{
                      background: "rgba(0,0,0,0.04)",
                      border: "1px solid rgba(0,0,0,0.07)",
                    }}
                  >
                    <ArrowLeft className="w-4 h-4" /> Retour
                  </button>
                  <button
                    onClick={handlePayment}
                    disabled={!fedapayReady || isSubmittingOrder}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[14px] font-semibold transition-all duration-200 active:scale-98 disabled:opacity-60"
                    style={{
                      background: "rgba(29,29,31,0.92)",
                      backdropFilter: "blur(16px)",
                      color: "#FFFFFF",
                      border: "1px solid rgba(255,255,255,0.07)",
                      boxShadow: "0 2px 14px rgba(0,0,0,0.22)",
                    }}
                  >
                    {isSubmittingOrder ? (
                      "Création de la commande..."
                    ) : fedapayReady ? (
                      <>
                        <ArrowRight className="w-4 h-4" /> Payer{" "}
                        {formatPrice(grandTotal)}
                      </>
                    ) : (
                      "Chargement..."
                    )}
                  </button>
                </div>
              </>
            )}

            {/* ═══════ ÉTAPE 3 ═══════ */}
            {step === 3 && (
              <div className="text-center py-10 space-y-6">
                <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                  <Check
                    className="w-10 h-10 text-green-500"
                    strokeWidth={2.5}
                  />
                </div>
                <div>
                  <h2 className="font-display font-black text-3xl text-apple-black mb-2 tracking-tight">
                    Commande confirmée !
                  </h2>
                  <p className="text-apple-mid text-[14px]">
                    Merci {form.firstName} — vous recevrez une confirmation sur
                    WhatsApp.
                  </p>
                </div>
                <div className="glass-card rounded-3xl p-6 text-left space-y-2 max-w-sm mx-auto">
                  <p className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest">
                    Référence de commande
                  </p>
                  <p className="font-display font-black text-xl text-apple-black tracking-tight">
                    {orderRef}
                  </p>
                  <p className="text-[12px] text-apple-mid">
                    Notification envoyée au {fullWhatsapp}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    href={`/suivi/${orderRef}`}
                    className="inline-flex items-center justify-center gap-2 btn-dark text-[13px] px-7 py-3.5"
                  >
                    Suivre ma commande <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/"
                    className="inline-flex items-center justify-center gap-2 btn-ghost text-[13px] px-7 py-3.5"
                  >
                    Retour à l&apos;accueil
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* ── Récapitulatif sticky ─────────────────────────────────────── */}
          {step !== 3 && (
            <div className="lg:col-span-2">
              <div className="glass-card rounded-3xl p-5 sticky top-24 space-y-4">
                <p className="text-[12px] font-semibold text-apple-mid uppercase tracking-widest">
                  Commande
                </p>
                <div className="space-y-3 max-h-52 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between gap-3 items-start">
                      <div className="flex-1 min-w-0">
                        <span className="text-apple-mid text-[13px] block truncate">
                          {item.name}
                        </span>
                        {item.selectedVariants?.filter((v) => v.value !== "Non choisi").length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {item.selectedVariants.filter((v) => v.value !== "Non choisi").map((v) => (
                              <span
                                key={v.typeName}
                                className="text-[10px] bg-black/[0.05] text-apple-mid px-1.5 py-0.5 rounded-full"
                              >
                                {v.typeName}: {v.value}
                              </span>
                            ))}
                          </div>
                        )}
                        <span className="text-apple-mid/60 text-[13px]">
                          {" "}
                          × {item.quantity}
                        </span>
                      </div>
                      <span className="font-semibold text-apple-black text-[13px] flex-shrink-0">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {!appliedCoupon ? (
                  <Link
                    href="/panier"
                    className="flex items-center gap-2 py-2.5 px-3.5 rounded-2xl text-[12px] text-apple-mid hover:text-apple-black transition-colors duration-200"
                    style={{
                      background: "rgba(0,0,0,0.03)",
                      border: "1px solid rgba(0,0,0,0.05)",
                    }}
                  >
                    <Tag
                      className="w-3.5 h-3.5 flex-shrink-0"
                      strokeWidth={1.6}
                    />
                    Code promo ? Appliquer dans le panier
                  </Link>
                ) : (
                  <div
                    className="flex items-center gap-2 py-2.5 px-3.5 rounded-2xl"
                    style={{
                      background: "rgba(52,199,89,0.08)",
                      border: "1px solid rgba(52,199,89,0.18)",
                    }}
                  >
                    <Tag className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                    <p className="text-green-700 text-[12px] font-semibold">
                      {appliedCoupon.code} appliqué
                    </p>
                  </div>
                )}

                <div className="border-t border-black/[0.06] pt-4 space-y-2">
                  <div className="flex justify-between text-[13px] text-apple-mid">
                    <span>Articles</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-[13px] text-green-600 font-medium">
                      <span>Réduction</span>
                      <span>-{formatPrice(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[13px] text-apple-mid">
                    <span>Livraison</span>
                    <span
                      className={`font-medium ${!form.city ? "text-apple-mid" : deliveryFee > 0 ? "text-apple-black" : "text-green-600"}`}
                    >
                      {!form.city
                        ? "—"
                        : deliveryFee > 0
                          ? formatPrice(deliveryFee)
                          : "Gratuite"}
                    </span>
                  </div>
                  {feeAmount > 0 && (
                    <div className="flex justify-between text-[13px] text-apple-mid">
                      <span className="flex items-center gap-1">
                        Frais paiement
                        <span className="text-[10px] bg-black/[0.05] px-1.5 py-0.5 rounded-full">
                          {paymentFeePercent}%
                        </span>
                      </span>
                      <span>{formatPrice(feeAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-display font-black text-[17px] text-apple-black pt-1 border-t border-black/[0.06]">
                    <span>Total</span>
                    <span>{formatPrice(grandTotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
