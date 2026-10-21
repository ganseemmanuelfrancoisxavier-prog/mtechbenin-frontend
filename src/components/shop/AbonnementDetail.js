"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Minus,
  Plus,
  Volume2,
  VolumeX,
  Wrench,
  Clock,
} from "lucide-react";
import { getService } from "@/lib/abonnements";
import { formatPrice, getDiscount, libelleDuree } from "@/lib/format";
import useCartStore from "@/store/cartStore";
import useAbonnementStore from "@/store/abonnementStore";
import { urlVideoJouable, afficheVideo } from "@/lib/media";
import useVisibleVideo from "@/hooks/useVisibleVideo";

// La description d'une formule arrive sous deux formes : une liste depuis la
// base (l'admin la saisit ligne à ligne dans le panel), ou une chaîne unique
// dans les données statiques de `lib/abonnements.js`, qui servent de repli
// tant que l'API n'a pas répondu. On ramène les deux au même format pour que
// le rendu n'ait qu'un seul cas à traiter.
function lignesDescription(description) {
  if (Array.isArray(description)) {
    return description.map((l) => String(l).trim()).filter(Boolean);
  }
  if (typeof description === "string" && description.trim()) {
    return [description.trim()];
  }
  return [];
}

const serviceBg = {
  netflix: "from-[#831010] via-[#E50914] to-[#1a0000]",
  spotify: "from-[#0d3d1a] via-[#1DB954] to-[#001a08]",
  "apple-music": "from-[#2d0a1a] via-[#FC3C44] to-[#0d0005]",
  "disney-plus": "from-[#0a1a4a] via-[#113CCF] to-[#00041a]",
  "youtube-premium": "from-[#3d0000] via-[#FF0000] to-[#1a0000]",
  crunchyroll: "from-[#2d1500] via-[#FF6600] to-[#1a0800]",
  canva: "from-[#001a2d] via-[#00C4CC] to-[#000d1a]",
  chatgpt: "from-[#001a14] via-[#10A37F] to-[#00080a]",
};
const defaultBg = "from-[#1a1a2e] via-[#16213E] to-[#0f0f0f]";

export default function AbonnementDetail({ slug }) {
  const staticService = getService(slug);
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const buyNow = useCartStore((state) => state.buyNow);

  const { getServiceBySlug, toggleServiceMute, fetchServices } =
    useAbonnementStore();

  const [mounted, setMounted] = useState(false);
  const [selectedFormule, setSelectedFormule] = useState(null);
  const [durationMultiplier, setDurationMultiplier] = useState(1);
  const [openFaq, setOpenFaq] = useState(null);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchServices();
  }, []);

  const storeService = mounted ? getServiceBySlug(slug) : null;

  // Certains visiteurs demandent au systeme de limiter les animations — un
  // reglage d'accessibilite, pas une preference esthetique. On l'honore en
  // ramenant les durees a zero : la bande s'ouvre toujours, instantanement.
  const reduireMouvement = useReducedMotion();

  const service = storeService
    ? {
        ...staticService,
        ...storeService,
        formules:
          storeService.plans?.length > 0
            ? storeService.plans.map((p) => ({
                ...p,
                id: p.id,
                label: p.label,
                duration: p.duration,
                // Recopie explicite, comme les autres : l'etalement au-dessus
                // la porterait deja, mais cette liste est ce que le reste du
                // fichier considere comme le contrat d'une formule. Un champ
                // qui n'y figure pas se perd au premier remaniement.
                aVie: !!p.aVie,
                price: p.price,
                comparePrice: p.comparePrice || null,
              }))
            : storeService.formules?.length > 0
              ? storeService.formules
              : staticService?.formules || [],
      }
    : staticService;

  const mediaType = storeService?.mediaType || "gradient";
  const mediaUrl = storeService?.mediaUrl || "";
  const mediaMuted = storeService?.mediaMuted !== false;
  const isVideo = mediaType === "video" && mediaUrl;
  const isImage = mediaType === "image" && mediaUrl;
  const video = useVisibleVideo({ enabled: Boolean(isVideo), identity: mediaUrl });
  const bg = serviceBg[slug] || defaultBg;

  useEffect(() => {
    if (video.ref.current) video.ref.current.muted = mediaMuted;
  }, [mediaMuted, video.ref]);

  useEffect(() => {
    setDurationMultiplier(1);
  }, [selectedFormule]);

  // ── Service introuvable ───────────────────────────────────────────────────
  if (!service)
    return (
      <div className="max-w-7xl mx-auto px-5 py-20 text-center">
        <p className="text-apple-mid text-xl mb-6">Service introuvable</p>
        <Link
          href="/abonnements"
          className="bg-apple-black text-white px-6 py-3 rounded-2xl font-semibold"
        >
          Retour aux abonnements
        </Link>
      </div>
    );

  // ── Maintenance ───────────────────────────────────────────────────────────
  if (mounted && storeService?.serviceStatus === "maintenance")
    return (
      <div className="max-w-xl mx-auto px-5 py-24 text-center">
        <div
          className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${bg} flex items-center justify-center mx-auto mb-6`}
        >
          <Wrench className="w-9 h-9 text-white" />
        </div>
        <h2 className="font-display font-black text-2xl text-apple-black mb-3 tracking-tight">
          {service.name} — Maintenance
        </h2>
        <p className="text-apple-mid text-[14px] leading-relaxed mb-2">
          {storeService.maintenanceMessage}
        </p>
        <p className="text-apple-mid/50 text-[12px] mb-8">
          Les commandes en cours ne sont pas affectées.
        </p>
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[12px] font-semibold mb-8"
          style={{
            background: "rgba(251,146,60,0.10)",
            color: "#ea580c",
            border: "1px solid rgba(251,146,60,0.20)",
          }}
        >
          <Wrench className="w-3.5 h-3.5" /> Temporairement indisponible
        </div>
        <div>
          <Link
            href="/abonnements"
            className="inline-flex items-center gap-2 bg-apple-black text-white px-6 py-3 rounded-2xl font-semibold text-[13px] hover:bg-neutral-800 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Retour aux abonnements
          </Link>
        </div>
      </div>
    );

  // ── Bientôt disponible ────────────────────────────────────────────────────
  if (mounted && storeService?.serviceStatus === "coming_soon")
    return (
      <div className="max-w-xl mx-auto px-5 py-24 text-center">
        <div
          className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${bg} flex items-center justify-center mx-auto mb-6`}
        >
          <Clock className="w-9 h-9 text-white" />
        </div>
        <h2 className="font-display font-black text-2xl text-apple-black mb-3 tracking-tight">
          {service.name} — Bientôt disponible
        </h2>
        <p className="text-apple-mid text-[14px] leading-relaxed mb-2">
          {storeService.comingSoonMessage}
        </p>
        <p className="text-apple-mid/50 text-[12px] mb-8">
          Revenez bientôt pour découvrir ce service.
        </p>
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[12px] font-semibold mb-8"
          style={{
            background: "rgba(96,165,250,0.10)",
            color: "#2563eb",
            border: "1px solid rgba(96,165,250,0.20)",
          }}
        >
          <Clock className="w-3.5 h-3.5" /> Disponible prochainement
        </div>
        <div>
          <Link
            href="/abonnements"
            className="inline-flex items-center gap-2 bg-apple-black text-white px-6 py-3 rounded-2xl font-semibold text-[13px] hover:bg-neutral-800 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Retour aux abonnements
          </Link>
        </div>
      </div>
    );

  // ── Page normale ──────────────────────────────────────────────────────────
  const getFormule = () =>
    service.formules?.find((f) => f.id === selectedFormule);

  // « Deux fois a vie » ne veut rien dire : le multiplicateur est neutralise
  // pour ces formules, et le selecteur de duree n'est pas affiche. Le serveur
  // refuse de son cote un panier fabrique a la main qui en demanderait plus.
  const formuleAVie = !!getFormule()?.aVie;
  const multiplicateurEffectif = formuleAVie ? 1 : durationMultiplier;

  const getTotalMonths = () => {
    const formule = getFormule();
    if (!formule) return 0;
    return (formule.duration || 1) * multiplicateurEffectif;
  };

  const getTotalPrice = () => {
    const formule = getFormule();
    if (!formule) return 0;
    return formule.price * multiplicateurEffectif;
  };

  const buildCartItem = (formule) => {
    const multiplicateur = formule.aVie ? 1 : durationMultiplier;
    // Une formule a vie n'a pas de total en mois a annoncer : ecrire
    // « 1 mois » sur un acces definitif serait faux sur le devis, sur la
    // facture et dans le message WhatsApp qui les reprend.
    const duree = formule.aVie
      ? "À vie"
      : `${(formule.duration || 1) * multiplicateur} mois`;
    return {
      // Encode la durée choisie : une même formule à 1 mois et à 3 mois doit
      // rester deux lignes de panier distinctes, pas fusionner en une seule
      // (sinon la ligne existante garde son ancien prix et la commande est
      // sous-facturée).
      id: `${formule.id}-x${multiplicateur}`,
      name: `${service.name} — ${formule.label || formule.name} — ${duree}`,
      slug: `abonnement-${formule.id}`,
      image: isImage ? mediaUrl : "/placeholder.jpg",
      price: formule.price * multiplicateur,
      comparePrice: formule.comparePrice ? formule.comparePrice * multiplicateur : null,
      status: "En stock",
      category: "abonnements",
    };
  };

  const handleAddToCart = () => {
    const formule = getFormule();
    if (!formule) return;
    addItem(buildCartItem(formule));
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    const formule = getFormule();
    if (!formule) return;
    buyNow(buildCartItem(formule), 1);
    router.push("/checkout");
  };

  return (
    <div className="max-w-5xl mx-auto px-5 py-10">
      <Link
        href="/abonnements"
        className="inline-flex items-center gap-1.5 text-apple-mid hover:text-apple-black text-[13px] font-medium mb-8 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Tous les abonnements
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* ── Gauche ── */}
        <div className="space-y-4">
          <div
            className="rounded-3xl relative overflow-hidden"
            style={{ minHeight: "180px" }}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${bg}`} />
            {isImage && (
              <Image
                src={mediaUrl}
                alt={service.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            )}
            {isVideo && (
              <video
                ref={video.ref}
                src={video.selected ? urlVideoJouable(mediaUrl) : undefined}
                poster={afficheVideo(mediaUrl)}
                autoPlay={video.selected && !video.reducedMotion}
                loop
                playsInline
                muted={mediaMuted}
                preload="none"
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            {(isImage || isVideo) && (
              <div className="absolute inset-0 bg-black/40" />
            )}
            <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/[0.06] rounded-full" />
            <div className="absolute -bottom-10 -left-6 w-32 h-32 bg-white/[0.03] rounded-full" />
            {isVideo && mounted && (
              <button
                onClick={() => toggleServiceMute(slug)}
                className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full flex items-center justify-center transition-all"
                style={{
                  background: "rgba(0,0,0,0.35)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
              >
                {mediaMuted ? (
                  <VolumeX className="w-4 h-4 text-white/80" />
                ) : (
                  <Volume2 className="w-4 h-4 text-white" />
                )}
              </button>
            )}
            <div className="relative z-10 p-8">
              <h1 className="font-display font-black text-4xl text-white mb-2 tracking-tight">
                {service.name}
              </h1>
              <p className="text-white/60 text-[14px]">{service.tagline}</p>
            </div>
          </div>

          {/* Features */}
          {service.features?.length > 0 && (
            <div className="glass-card rounded-3xl p-6">
              <p className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-4">
                Ce qui est inclus
              </p>
              <ul className="space-y-3">
                {service.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-3 text-[13px] text-apple-mid"
                  >
                    <div
                      className={`w-5 h-5 rounded-full ${service.lightColor || "bg-gray-50"} flex items-center justify-center flex-shrink-0`}
                    >
                      <Check
                        className={`w-3 h-3 ${service.textColor || "text-gray-600"}`}
                        strokeWidth={2.5}
                      />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* FAQ */}
          {service.faq?.length > 0 && (
            <div className="glass-card rounded-3xl p-6">
              <p className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-4">
                Questions fréquentes
              </p>
              <div className="space-y-1.5">
                {service.faq.map((item, i) => (
                  <div
                    key={i}
                    className="rounded-2xl overflow-hidden"
                    style={{
                      background: "rgba(0,0,0,0.02)",
                      border: "1px solid rgba(0,0,0,0.05)",
                    }}
                  >
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="w-full flex items-center justify-between px-4 py-3.5 text-left text-[13px] font-medium text-apple-black hover:bg-black/[0.02] transition-colors"
                    >
                      {item.q}
                      {openFaq === i ? (
                        <ChevronUp className="w-4 h-4 text-apple-mid flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-apple-mid flex-shrink-0" />
                      )}
                    </button>
                    {openFaq === i && (
                      <div className="px-4 pb-4 text-[13px] text-apple-mid leading-relaxed border-t border-black/[0.04]">
                        <div className="pt-3">{item.a}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Droite — Formules ── */}
        <div className="space-y-4">
          <div>
            <p className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-2">
              Formules
            </p>
            <h2 className="font-display font-black text-2xl text-apple-black tracking-tight">
              Choisissez votre durée
            </h2>
          </div>

          {service.formules?.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-apple-mid text-[13px]">
                Aucune formule disponible pour ce service.
              </p>
            </div>
          ) : (
            service.formules?.map((formule) => {
              const discount = getDiscount(formule.price, formule.comparePrice);
              const isSelected = selectedFormule === formule.id;
              const lignes = lignesDescription(formule.description);
              const label = formule.label || formule.name;
              // Voir `libelleDuree` : les deux formes de `duration` (nombre
              // depuis l'API, chaîne déjà libellée depuis le catalogue de
              // repli) et le cas « à vie » y sont traités en un seul endroit.
              const dureeLisible = libelleDuree(formule);
              return (
                <button
                  key={formule.id}
                  onClick={() => setSelectedFormule(formule.id)}
                  className={`w-full text-left rounded-3xl p-5 transition-all duration-200 ${isSelected ? "glass-card shadow-premium" : "hover:bg-black/[0.02]"}`}
                  style={{
                    background: isSelected ? undefined : "rgba(0,0,0,0.02)",
                    border: isSelected
                      ? "2px solid rgba(29,29,31,0.15)"
                      : "2px solid transparent",
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 flex-shrink-0 transition-all ${isSelected ? "border-apple-black" : "border-apple-mid/40"}`}
                      >
                        {isSelected && (
                          <div className="w-2.5 h-2.5 rounded-full bg-apple-black" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="font-bold text-apple-black text-[13px]">
                            {label}
                          </span>
                          <span className="text-[11px] bg-black/[0.05] text-apple-mid px-2 py-0.5 rounded-full">
{dureeLisible}
                          </span>
                          {formule.popular && (
                            <span className="badge-promo">Populaire</span>
                          )}
                        </div>
                        {/* La description ne vit plus ici : elle s'ouvre dans
                            la bande, sous l'en-tete. Affichee sur chaque carte,
                            elle transformait la liste des formules en mur de
                            texte gris, et noyait justement l'argument de
                            vente. Un indice discret suffit a signaler qu'il y a
                            quelque chose a voir. */}
                        {lignes.length > 0 && !isSelected && (
                          <p className="mt-0.5 text-[11px] text-apple-mid/70">
                            {lignes.length} avantage{lignes.length > 1 ? "s" : ""}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <div className="font-display font-black text-[18px] text-apple-black tracking-tight">
                        {formatPrice(formule.price)}
                      </div>
                      {formule.comparePrice && (
                        <div className="flex items-center gap-1.5 justify-end mt-0.5">
                          <span className="text-[11px] text-apple-mid line-through">
                            {formatPrice(formule.comparePrice)}
                          </span>
                          {discount && (
                            <span className="badge-promo">{discount}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bande de detail — prolonge la carte vers le bas.
                      Meme grammaire d'ouverture que FaqAccordion (height 0 vers
                      auto, courbe [0.4, 0, 0.2, 1]) pour que le site n'ait qu'un
                      seul vocabulaire d'animation. Ce qui la distingue tient a
                      deux details : le filet se trace de gauche a droite au lieu
                      d'apparaitre, et les lignes entrent l'une apres l'autre. */}
                  <AnimatePresence initial={false}>
                    {isSelected && lignes.length > 0 && (
                      <motion.div
                        key="detail"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={
                          reduireMouvement
                            ? { duration: 0 }
                            : { duration: 0.28, ease: [0.4, 0, 0.2, 1] }
                        }
                        className="overflow-hidden"
                      >
                        {/* `pl-8` aligne la bande sur le libelle : le rond de
                            selection fait 20 px, l'ecart 12 px. */}
                        <div className="pt-4 pl-8">
                          <motion.div
                            aria-hidden="true"
                            className="h-px mb-3.5 origin-left"
                            style={{
                              background:
                                "linear-gradient(to right, rgba(29,29,31,0.16), rgba(29,29,31,0))",
                            }}
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={
                              reduireMouvement
                                ? { duration: 0 }
                                : { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
                            }
                          />
                          <motion.ul
                            className="space-y-2"
                            initial="repos"
                            animate="entre"
                            variants={{
                              entre: {
                                transition: {
                                  delayChildren: reduireMouvement ? 0 : 0.08,
                                  staggerChildren: reduireMouvement ? 0 : 0.05,
                                },
                              },
                            }}
                          >
                            {lignes.map((ligne, i) => (
                              <motion.li
                                key={i}
                                variants={{
                                  repos: { opacity: 0, y: 6 },
                                  entre: {
                                    opacity: 1,
                                    y: 0,
                                    transition: {
                                      duration: reduireMouvement ? 0 : 0.32,
                                      ease: [0.4, 0, 0.2, 1],
                                    },
                                  },
                                }}
                                className="flex items-start gap-2.5 text-[13px] leading-[1.65] text-apple-mid"
                              >
                                <Check
                                  aria-hidden="true"
                                  className="w-3.5 h-3.5 mt-[3px] flex-shrink-0 text-apple-black/45"
                                  strokeWidth={2.5}
                                />
                                <span>{ligne}</span>
                              </motion.li>
                            ))}
                          </motion.ul>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              );
            })
          )}

          {/* Sélecteur de durée — masqué sur une formule à vie, où il n'a
              rien à régler : le multiplicateur y est neutralisé de toute
              façon, et l'afficher inviterait à payer deux fois le même accès
              définitif. */}
          {selectedFormule && !formuleAVie && (
            <div
              className="rounded-3xl p-5"
              style={{
                background: "rgba(0,0,0,0.02)",
                border: "1px solid rgba(0,0,0,0.07)",
              }}
            >
              <p className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-3">
                Nombre de mois
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-display font-black text-[28px] text-apple-black">
                    {getTotalMonths()}
                  </span>
                  <span className="text-[13px] text-apple-mid ml-1.5">
                    mois au total
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setDurationMultiplier((m) => Math.max(1, m - 1))}
                    disabled={durationMultiplier <= 1}
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{
                      background: "rgba(0,0,0,0.06)",
                      border: "1px solid rgba(0,0,0,0.08)",
                    }}
                  >
                    <Minus className="w-4 h-4 text-apple-black" />
                  </button>
                  <span className="font-display font-black text-[22px] text-apple-black w-7 text-center select-none">
                    {durationMultiplier}
                  </span>
                  <button
                    onClick={() => setDurationMultiplier((m) => Math.min(12, m + 1))}
                    disabled={durationMultiplier >= 12}
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{
                      background: "rgba(29,29,31,0.92)",
                      color: "#fff",
                    }}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {durationMultiplier > 1 && (
                <div className="mt-3 pt-3 border-t border-black/[0.05] flex items-center justify-between">
                  <span className="text-[12px] text-apple-mid">
                    {durationMultiplier} × {formatPrice(getFormule()?.price || 0)}
                  </span>
                  <span className="font-display font-black text-[18px] text-apple-black">
                    {formatPrice(getTotalPrice())}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Ce que le selecteur de duree affichait pour les autres formules :
              ce qui est achete, et pour combien. Le retirer sans rien mettre
              a la place laissait un blanc entre les formules et les boutons,
              et le total ne se lisait plus que sur la carte selectionnee. */}
          {selectedFormule && formuleAVie && (
            <div
              className="rounded-3xl p-5 flex items-center justify-between"
              style={{
                background: "rgba(0,0,0,0.02)",
                border: "1px solid rgba(0,0,0,0.07)",
              }}
            >
              <div>
                <p className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1">
                  Durée
                </p>
                <span className="font-display font-black text-[22px] text-apple-black">
                  À vie
                </span>
                <span className="text-[13px] text-apple-mid ml-2">
                  sans renouvellement
                </span>
              </div>
              <span className="font-display font-black text-[18px] text-apple-black">
                {formatPrice(getTotalPrice())}
              </span>
            </div>
          )}

          {/* CTAs */}
          <div className="flex gap-2.5 pt-2">
            <button
              onClick={handleBuyNow}
              disabled={!selectedFormule}
              className="flex-1 flex items-center justify-center py-4 rounded-2xl text-[13px] font-semibold transition-all duration-200 disabled:opacity-35 disabled:cursor-not-allowed"
              style={{
                background: selectedFormule
                  ? "rgba(29,29,31,0.92)"
                  : "rgba(0,0,0,0.06)",
                backdropFilter: "blur(16px)",
                color: selectedFormule ? "#FFFFFF" : "#6E6E73",
                border: "1px solid rgba(255,255,255,0.07)",
                boxShadow: selectedFormule
                  ? "0 2px 14px rgba(0,0,0,0.22)"
                  : "none",
              }}
            >
              Commander
            </button>
            <button
              onClick={handleAddToCart}
              disabled={!selectedFormule}
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-[13px] font-semibold transition-all duration-200 disabled:opacity-35 disabled:cursor-not-allowed"
              style={
                added
                  ? {
                      background: "rgba(52,199,89,0.12)",
                      color: "#1A7F37",
                      border: "1px solid rgba(52,199,89,0.22)",
                    }
                  : selectedFormule
                    ? {
                        background: "rgba(255,255,255,0.22)",
                        backdropFilter: "blur(24px) saturate(200%)",
                        WebkitBackdropFilter: "blur(24px) saturate(200%)",
                        border: "1px solid rgba(255,255,255,0.50)",
                        color: "#1D1D1F",
                        boxShadow:
                          "0 2px 16px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.65)",
                      }
                    : { background: "rgba(0,0,0,0.04)", color: "#6E6E73" }
              }
            >
              {added ? (
                <>
                  <Check className="w-4 h-4" /> Ajouté
                </>
              ) : !selectedFormule ? (
                "Sélectionner"
              ) : (
                <>
                  <ArrowRight className="w-4 h-4" /> Panier
                </>
              )}
            </button>
          </div>

          {/* Accès au code de vérification.
              La page /mon-code n'était atteignable que par l'adresse écrite
              dans le message et l'e-mail de livraison — envoyés une seule
              fois, à l'activation. Un client ayant acheté avant l'existence de
              cette page, ou ayant perdu le message, n'avait aucun moyen de la
              retrouver. C'est ici qu'il vient chercher de l'aide sur son
              abonnement : c'est donc ici que le lien doit vivre. */}
          <Link
            href="/mon-code"
            className="block rounded-3xl p-4 transition hover:opacity-70"
            style={{
              background: "rgba(0,0,0,0.02)",
              border: "1px solid rgba(0,0,0,0.05)",
            }}
          >
            <p className="text-[13px] font-semibold text-apple-black mb-0.5">
              Besoin de votre code de vérification ?
            </p>
            <p className="text-[12px] text-apple-mid">
              {service?.name || "Ce service"} vous demande un code à la
              connexion ? Indiquez votre numéro et nous vous l&apos;envoyons.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
