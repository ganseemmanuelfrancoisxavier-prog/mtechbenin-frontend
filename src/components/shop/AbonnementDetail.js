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
// base (l'admin la saisit ligne Ã  ligne dans le panel), ou une chaÃ®ne unique
// dans les donnÃ©es statiques de `lib/abonnements.js`, qui servent de repli
// tant que l'API n'a pas rÃ©pondu. On ramÃ¨ne les deux au mÃªme format pour que
// le rendu n'ait qu'un seul cas Ã  traiter.
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

  // Certains visiteurs demandent au systeme de limiter les animations â€” un
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

  // â”€â”€ Service introuvable â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ Maintenance â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (mounted && storeService?.serviceStatus === "maintenance")
    return (
      <div className="max-w-xl mx-auto px-5 py-24 text-center">
        <div
          className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${bg} flex items-center justify-center mx-auto mb-6`}
        >
          <Wrench className="w-9 h-9 text-white" />
        </div>
        <h2 className="font-display font-black text-2xl text-apple-black mb-3 tracking-tight">
          {service.name} â€” Maintenance
        </h2>
        <p className="text-apple-mid text-[14px] leading-relaxed mb-2">
          {storeService.maintenanceMessage}
        </p>
        <p className="text-apple-mid/50 text-[12px] mb-8">
          Les commandes en cours ne sont pas affectÃ©es.
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

  // â”€â”€ BientÃ´t disponible â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (mounted && storeService?.serviceStatus === "coming_soon")
    return (
      <div className="max-w-xl mx-auto px-5 py-24 text-center">
        <div
          className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${bg} flex items-center justify-center mx-auto mb-6`}
        >
          <Clock className="w-9 h-9 text-white" />
        </div>
        <h2 className="font-display font-black text-2xl text-apple-black mb-3 tracking-tight">
          {service.name} â€” BientÃ´t disponible
        </h2>
        <p className="text-apple-mid text-[14px] leading-relaxed mb-2">
          {storeService.comingSoonMessage}
        </p>
        <p className="text-apple-mid/50 text-[12px] mb-8">
          Revenez bientÃ´t pour dÃ©couvrir ce service.
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

  // â”€â”€ Page normale â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const getFormule = () =>
    service.formules?.find((f) => f.id === selectedFormule);

  // Â« Deux fois a vie Â» ne veut rien dire : le multiplicateur est neutralise
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
    // Â« 1 mois Â» sur un acces definitif serait faux sur le devis, sur la
    // facture et dans le message WhatsApp qui les reprend.
    const duree = formule.aVie
      ? "Ã€ vie"
      : `${(formule.duration || 1) * multiplicateur} mois`;
    return {
      // Encode la durÃ©e choisie : une mÃªme formule Ã  1 mois et Ã  3 mois doit
      // rester deux lignes de panier distinctes, pas fusionner en une seule
      // (sinon la ligne existante garde son ancien prix et la commande est
      // sous-facturÃ©e).
      id: `${formule.id}-x${multiplicateur}`,
      name: `${service.name} â€” ${formule.label || formule.name} â€” ${duree}`,
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
        {/* â”€â”€ Gauche â”€â”€ */}
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
              ;ÓÎm¢G§²ÚîÆ­yÝ\Ëˆ‹ˆK—NÂ‚™[˜Ý[ÛˆÙ\šXÙPØ\™
ÈÙ\šXÙKÛ•ÙÙÛS]]KØ\™™YˆJHÂˆÛÛœÝ\ÕšY[ÈHÙ\šXÙK›YYXU\HOOHšY[Èˆ	‰ˆÙ\šXÙK›YYXU\›ÂˆÛÛœÝÈš^ˆZ[”šXÙKÝY™š^NˆÝY™š^Tš^HHš^\\
Ù\šXÙK™›Ü›][\ÊNÂ‚ˆÛÛœÝ\ÓXZ[[˜[˜ÙHHÙ\šXÙKœÙ\šXÙTÝ]\ÈOOH›XZ[[˜[˜ÙHŽÂˆÛÛœÝ\ÐÛÛZ[™ÔÛÛÛˆHÙ\šXÙKœÙ\šXÙTÝ]\ÈOOH˜ÛÛZ[™×ÜÛÛÛˆŽÂˆÛÛœÝ\Õ[˜]˜Z[X›HH\ÓXZ[[˜[˜ÙH\ÐÛÛZ[™ÔÛÛÛŽÂˆÛÛœÝšY[ÈH\ÙUš\ÚX›UšY[ÊÈ[˜X›Yˆ›ÛÛX[Š\ÕšY[È	‰ˆZ\Õ[˜]˜Z[X›JKY[]NˆÙ\šXÙK›YYXU\›JNÂ‚ˆ™]\›ˆ
ˆ[šÂˆ™Y^ØØ\™™YŸBˆ™Y^Ú\Õ[˜]˜Z[X›HÈˆÈˆˆØX›Û›™[Y[ËÉÜÙ\šXÙKœÛYßXBˆÛÛXÚÏ^Ú\Õ[˜]˜Z[X›HÈ
JHOˆKœ™]™[Y˜][

Hˆ[™Yš[™YBˆÛ\ÜÓ˜[YO^ØÜ›Ý\Û\ÜËXØ\™›Ý[™YLÞÝ™\™›ÝËZY[ˆ˜[œÚ][Û‹X[\˜][Û‹LÌ™[]]™H	Âˆ\Õ[˜]˜Z[X›HÈ˜Ý\œÛÜ‹[›ÝX[ÝÙYÜXÚ]KNˆˆšÝ™\Ž‹]˜[œÛ]K^KLH‚ˆXBˆ‚ˆ]ˆÛ\ÜÓ˜[YOHœ™[]]™HMÝ™\™›ÝËZY[ˆ‚ˆ]‚ˆÛ\ÜÓ˜[YO^ØXœÛÛ]H[œÙ]L™ËYÜ˜YY[]ËXœˆ	ÜÙ\šXÙP™ÖÜÙ\šXÙKœÛY×HÙ\šXÙK˜ÛÛÜˆY˜][™ßXBˆÏ‚ˆÜÙ\šXÙK›YYXU\HOOHš[XYÙHˆ	‰ˆÙ\šXÙK›YYXU\›	‰ˆ
ˆ[XYÙBˆÜ˜Ï^ÜÙ\šXÙK›YYXU\›Bˆ[^ÜÙ\šXÙK›˜[Y_Bˆš[ˆÛ\ÜÓ˜[YOH›Øš™XÝXÛÝ™\ˆ‚ˆÚ^™\ÏHŠX^]ÚYˆ
HLË
X^]ÚYˆL
HLË]È‚ˆÏ‚ˆ
_BˆÚ\ÕšY[È	‰ˆ
ˆšY[Âˆ™Y^ÝšY[Ëœ™YŸBˆÜ˜Ï^ÝšY[ËœÙ[XÝYÈ\›šY[Ò›ÝXX›JÙ\šXÙK›YYXU\›
Hˆ[™Yš[™YBˆÜÝ\^ØY™šXÚUšY[ÊÙ\šXÙK›YYXU\›
_Bˆ]]Ô^O^ÝšY[ËœÙ[XÝY	‰ˆ]šY[Ëœ™YXÙY[Ý[ÛŸBˆÛÜˆ^\Ò[›[™Bˆ]]Y^ÜÙ\šXÙK›YYXS]]YOOH˜[Ù_Bˆ™[ØYH››Û™H‚ˆÛ\ÜÓ˜[YOH˜XœÛÛ]H[œÙ]LËY[Y[Øš™XÝXÛÝ™\ˆ‚ˆÏ‚ˆ
_Bˆ]ˆÛ\ÜÓ˜[YOH˜XœÛÛ]H[œÙ]L™ËYÜ˜YY[]Ë]œ›ÛKX›XÚËÍLË]˜[œÜ\™[ˆÏ‚‚ˆÚ\ÓXZ[[˜[˜ÙH	‰ˆ
ˆ]ˆÛ\ÜÓ˜[YOH˜XœÛÛ]HÜLÈYLÈšYÚLL‹LŒ‚ˆ]ˆÛ\ÜÓ˜[YOH™›^][\ËXÙ[\ˆØ\LKHLÈKLKH›Ý[™Y^^VÌL\H›Û\Ù[ZX›Û^[Ü˜[™ÙKMŒ™Ë[Ü˜[™ÙKMLÎL˜XÚÙ›ÜX›\‹\ÛH[˜Ø]H‚ˆÜ™[˜ÚÛ\ÜÓ˜[YOHËLÈLÈ›^\Úš[šËLˆÏ‚ˆÜ[ˆÛ\ÜÓ˜[YOH[˜Ø]H‚ˆÜÙ\šXÙK›XZ[[˜[˜ÙSY\ÜØYÙH‘[ˆXZ[[˜[˜ÙHŸBˆÜÜ[‚ˆÙ]‚ˆÙ]‚ˆ
_BˆÚ\ÐÛÛZ[™ÔÛÛÛˆ	‰ˆ
ˆ]ˆÛ\ÜÓ˜[YOH˜XœÛÛ]HÜLÈYLÈšYÚLL‹LŒ‚ˆ]ˆÛ\ÜÓ˜[YOH™›^][\ËXÙ[\ˆØ\LKHLÈKLKH›Ý[™Y^^VÌL\H›Û\Ù[ZX›Û^X›YKMŒ™ËX›YKMLÎL˜XÚÙ›ÜX›\‹\ÛH[˜Ø]H‚ˆÛØÚÈÛ\ÜÓ˜[YOHËLÈLÈ›^\Úš[šËLˆÏ‚ˆÜ[ˆÛ\ÜÓ˜[YOH[˜Ø]H‚ˆÜÙ\šXÙK˜ÛÛZ[™ÔÛÛÛ“Y\ÜØYÙHšY[0í\ÜÛšX›HŸBˆÜÜ[‚ˆÙ]‚ˆÙ]‚ˆ
_B‚ˆ]ˆÛ\ÜÓ˜[YOH˜XœÛÛ]H›ÝÛKMYMHšYÚLL‹LL‚ˆÈÛ\ÜÓ˜[YOH™›ÛY\Ü^H›ÛX›XÚÈ^]Ú]H^^˜XÚÚ[™Ë]YÚ‚ˆÜÙ\šXÙK›˜[Y_BˆÚÏ‚ˆÛ\ÜÓ˜[YOH^]Ú]KÍMH^VÌLœH]LH[™KXÛ[\LH‚ˆÜÙ\šXÙKYÛ[™_BˆÜ‚ˆÙ]‚‚ˆÚ\ÕšY[È	‰ˆ
ˆ]Û‚ˆÛÛXÚÏ^ÊJHOˆÂˆKœ™]™[Y˜][

NÂˆKœÝÜ›ÜYØ][ÛŠ
NÂˆÛ•ÙÙÛS]]JÙ\šXÙKœÛYÊNÂˆ_BˆÛ\ÜÓ˜[YOH˜XœÛÛ]HÜLÈšYÚLÈ‹LŒËNN›Ý[™YY[›^][\ËXÙ[\ˆ\ÝYžKXÙ[\ˆ˜[œÚ][Û‹X[\˜][Û‹LŒ‚ˆÝ[O^ÞÂˆ˜XÚÙÜ›Ý[™ˆœ™Ø˜J
H‹ˆ˜XÚÙ›Üš[\Žˆ˜›\Š
H‹ˆ›Ü™\ŽˆŒ\ÛÛY™Ø˜JMKMKMKŒMJH‹ˆ_Bˆ‚ˆÜÙ\šXÙK›YYXS]]YOOH˜[ÙHÈ
ˆ›Û[YVÛ\ÜÓ˜[YOHËLËHLËH^]Ú]KÎˆÏ‚ˆ
Hˆ
ˆ›Û[YLˆÛ\ÜÓ˜[YOHËLËHLËH^]Ú]HˆÏ‚ˆ
_BˆØ]Û‚ˆ
_BˆÙ]‚‚ˆ]ˆÛ\ÜÓ˜[YOHœMH‚ˆ]ˆÛ\ÜÓ˜[YOH›X‹M‚ˆÚ\ÓXZ[[˜[˜ÙHÈ
ˆ]ˆÛ\ÜÓ˜[YOH™›^][\ËXÙ[\ˆØ\LˆKLH‚ˆÜ™[˜ÚÛ\ÜÓ˜[YOHËMM^[Ü˜[™ÙKMˆÏ‚ˆÛ\ÜÓ˜[YOH^[Ü˜[™ÙKML^VÌLÜH›Û\Ù[ZX›Û‚ˆ[\Ü˜Z\™[Y[[™\ÜÛšX›BˆÜ‚ˆÙ]‚ˆ
Hˆ\ÐÛÛZ[™ÔÛÛÛˆÈ
ˆ]ˆÛ\ÜÓ˜[YOH™›^][\ËXÙ[\ˆØ\LˆKLH‚ˆÛØÚÈÛ\ÜÓ˜[YOHËMM^X›YKMˆÏ‚ˆÛ\ÜÓ˜[YOH^X›YKML^VÌLÜH›Û\Ù[ZX›Û‚ˆ\ÜÛšX›H›ØÚZ[™[Y[ˆÜ‚ˆÙ]‚ˆ
Hˆ
ˆ‚ˆÛ\ÜÓ˜[YOH^VÌL\H^X\K[ZYX‹LH›Û[YY][H‚ˆ0à\\ˆBˆÜ‚ˆÛ\ÜÓ˜[YOH™›ÛY\Ü^H›ÛX›XÚÈ^VÌN\H^X\KX›XÚÈ˜XÚÚ[™Ë]YÚ‚ˆÛZ[”šXÙHOOH[È›Ü›X]šXÙJZ[”šXÙJHˆ¸ %ŸBˆÜ[ˆÛ\ÜÓ˜[YOH^X\K[ZY›Û[›Ü›X[^VÌLÜH‚ˆÜÝY™š^Tš^BˆÜÜ[‚ˆÜ‚ˆÏ‚ˆ
_BˆÙ]‚‚ˆ[Û\ÜÓ˜[YOHœÜXÙK^KLKHX‹MH‚ˆÜÙ\šXÙK™™X]\™\ÏËœÛXÙJÊK›X\

ŠHOˆ
ˆBˆÙ^O^ÙŸBˆÛ\ÜÓ˜[YOH™›^][\Ë\Ý\Ø\Lˆ^VÌLœH^X\K[ZY‚ˆ‚ˆÚXÚÂˆÛ\ÜÓ˜[YO^ØËLËHLËH	ÜÙ\šXÙK^ÛÛÜˆ^X\K[ZYŸH›^\Úš[šËL]LXBˆÝ›ÚÙUÚY^Ì‹_BˆÏ‚ˆÙŸBˆÛO‚ˆ
J_BˆÝ[‚‚ˆ]‚ˆÛ\ÜÓ˜[YO^Ø›^][\ËXÙ[\ˆ\ÝYžKX™]ÙY[ˆ^VÌLœH›Û\Ù[ZX›Û˜[œÚ][Û‹XÛÛÜœÈ	Âˆ\Õ[˜]˜Z[X›BˆÈ^X\K[ZYÍ‚ˆˆ^X\K[ZYÜ›Ý\ZÝ™\Ž^X\KX›XÚÈ‚ˆXBˆ‚ˆÚ\Õ[˜]˜Z[X›HÈšY[0í\ÜÛšX›Hˆˆ•›Ú\ˆ\È›Ü›][\ÈŸBˆÚ]œ›Û”šYÚÛ\ÜÓ˜[YOHËLËHLËHÜ›Ý\ZÝ™\Ž˜[œÛ]K^LH˜[œÚ][Û‹]˜[œÙ›Ü›HˆÏ‚ˆÙ]‚ˆÙ]‚ˆÓ[šÏ‚ˆ
NÂŸB‚™^ÜY˜][[˜Ý[ÛˆX›Û›™[Y[ÒXŠ
HÂˆÛÛœÝÛ[Ý[YÙ][Ý[YHH\ÙTÝ]J˜[ÙJNÂˆÛÛœÝØ\™™YœÈH\ÙT™YŠßJNÂ‚ˆÛÛœÝÈÙ]XÝ]™TÙ\šXÙ\Ë™]ÚÙ\šXÙ\ÈHH\ÙPX›Û›™[Y[ÝÜ™J
NÂ‚ˆ\ÙQY™™XÝ


HOˆÂˆÙ][Ý[Y
YJNÂˆ™]ÚÙ\šXÙ\Ê
NÂˆK×JNÂ‚ˆÛÛœÝÙ\šXÙ\ÈH[Ý[YÈÙ]XÝ]™TÙ\šXÙ\Ê
K›X\

ÜÊHOˆ
Âˆ‹‹œÜËˆÙ\šXÙTÝ]\ÎˆÜËœÙ\šXÙTÝ]\È˜XÝ]™H‹ˆXZ[[˜[˜ÙSY\ÜØYÙN‚ˆÜË›XZ[[˜[˜ÙSY\ÜØYÙHÙHÙ\šXÙH\Ý[ˆXZ[[˜[˜ÙKˆ‹ˆÛÛZ[™ÔÛÛÛ“Y\ÜØYÙN‚ˆÜË˜ÛÛZ[™ÔÛÛÛ“Y\ÜØYÙHÙHÙ\šXÙHÙ\˜HšY[0í\ÜÛšX›Kˆ‹ˆJJBˆˆÝ]XÔÙ\šXÙ\Âˆ™š[\Š
ÊHOˆË˜]˜Z[X›JBˆ›X\

ÊHOˆ
È‹‹œËÙ\šXÙTÝ]\Îˆ˜XÝ]™HˆJJNÂ‚ˆÛÛœÝÈ[™UÙÙÛS]]HHH\ÙS[Øš[P]Y[Ñ›ØÝ\ÊÈÙ\šXÙ\ËØ\™™YœË[Ý[YJNÂ‚ˆÛÛœÝXÝ]™PÛÝ[HÙ\šXÙ\Ë™š[\Šˆ
ÊHOˆËœÙ\šXÙTÝ]\ÈOOH˜XÝ]™H‹ˆ
K›[™ÝÂ‚ˆ™]\›ˆ
ˆ]ˆÛ\ÜÓ˜[YOH›Z[‹Z\ØÜ™Y[ˆ‚ˆËÊˆ\›È
‹ßBˆ]ˆÛ\ÜÓ˜[YOHœ™[]]™H™ËVÈÌLLWHKLMHÝ™\™›ÝËZY[ˆ‚ˆ]ˆÛ\ÜÓ˜[YOH˜XœÛÛ]H[œÙ]LÚ[\‹Y]™[Ë[›Û™H‚ˆ]ˆÛ\ÜÓ˜[YOH˜XœÛÛ]H]ÜMYLKÍËVÍLHVÍLH™Ë]Ú]KÖÌŒ—H›Ý[™YY[›\‹LÞˆÏ‚ˆ]ˆÛ\ÜÓ˜[YOH˜XœÛÛ]HX›ÝÛKMšYÚLKÍËVÍHVÍH™Ë]Ú]KÖÌŒMWH›Ý[™YY[›\‹LÞˆÏ‚ˆÙ]‚ˆ]ˆÛ\ÜÓ˜[YOH›X^]ËM^X]]È^XÙ[\ˆ™[]]™H‹LL‚ˆ]‚ˆÛ\ÜÓ˜[YOHš[›[™KY›^][\ËXÙ[\ˆØ\Lˆ›Ý[™YY[MKLKHX‹Mˆ‚ˆÝ[O^ÞÂˆ˜XÚÙÜ›Ý[™ˆœ™Ø˜JMKMKMKŒŠH‹ˆ›Ü™\ŽˆŒ\ÛÛY™Ø˜JMKMKMKŒ
H‹ˆ_Bˆ‚ˆÜ[ˆÛ\ÜÓ˜[YOHËLKHLKH™ËXÝH›Ý[™YY[[š[X]K\[ÙHˆÏ‚ˆÜ[ˆÛ\ÜÓ˜[YOH^]Ú]KÍL^VÌL\H›Û\Ù[ZX›Û˜XÚÚ[™Ë]ÚY\Ý\\˜Ø\ÙH‚ˆÙ\šXÙHYÚ][ˆÜÜ[‚ˆÙ]‚ˆHÛ\ÜÓ˜[YOH™›ÛY\Ü^H›ÛX›XÚÈ^MY^Mž^]Ú]HX‹MH˜XÚÚ[™Ë]YÚ‚ˆX›Û›™[Y[ÂˆœˆÏ‚ˆÜ[ˆÛ\ÜÓ˜[YOH^]Ú]KÍ‘YÚ]]^ÜÜ[‚ˆÚO‚ˆÛ\ÜÓ˜[YOH^]Ú]KÍ^VÌM\HY^[ÈX^]Ë^^X]]ÈX‹LLXY[™Ë\™[^Y‚ˆ™]›^ÜÝYžK\H]\ÚXÈ]\È[˜ÛÜ™H8 %]HYZ[]\ˆš^[‚ˆYœš\]YK‚ˆÜ‚ˆ]ˆÛ\ÜÓ˜[YOH™›^›^]Ü˜\\ÝYžKXÙ[\ˆØ\L‹H‚ˆÖÂˆXÝ]˜][Ûˆ[[pêYX]H‹ˆ”ZY[Y[[Øš[H[Û™^H‹ˆ”Ý\ÜÚ‹ÍÈ‹ˆ”š^[X˜]X›\È‹ˆK›X\

ŠHOˆ
ˆ]‚ˆÙ^O^ÙŸBˆÛ\ÜÓ˜[YOH™›^][\ËXÙ[\ˆØ\LˆMKLˆ›Ý[™YY[^VÌLÜH‚ˆÝ[O^ÞÂˆ˜XÚÙÜ›Ý[™ˆœ™Ø˜JMKMKMKŒJH‹ˆ›Ü™\ŽˆŒ\ÛÛY™Ø˜JMKMKMKŒÊH‹ˆ_Bˆ‚ˆÚXÚÂˆÛ\ÜÓ˜[YOHËLËHLËH^YÜ™Y[‹M‚ˆÝ›ÚÙUÚY^Ì‹_BˆÏ‚ˆÜ[ˆÛ\ÜÓ˜[YOH^]Ú]KÍŒ›Û[YY][HžÙŸOÜÜ[‚ˆÙ]‚ˆ
J_BˆÙ]‚ˆÙ]‚ˆÙ]‚‚ˆËÊˆÜš[HÙ\šXÙ\È
‹ßBˆ]ˆÛ\ÜÓ˜[YOH›X^]ËMÞ^X]]ÈMHKLŒ‚ˆ]ˆÛ\ÜÓ˜[YOH›X‹LLˆ‚ˆÛ\ÜÓ˜[YOH^VÌL\H›Û\Ù[ZX›Û^X\K[ZY\\˜Ø\ÙH˜XÚÚ[™Ë]ÚY\ÝX‹Lˆ‚ˆ›ÜÈÙ\šXÙ\ÂˆÜ‚ˆ]ˆÛ\ÜÓ˜[YOH™›^][\ËY[™\ÝYžKX™]ÙY[ˆ‚ˆˆÛ\ÜÓ˜[YOH™›ÛY\Ü^H›ÛX›XÚÈ^LÞY^M^X\KX›XÚÈ˜XÚÚ[™Ë]YÚ‚ˆÚÚ\Ú\ÜÙ^ˆ›Ý™HÙ\šXÙBˆÚ‚ˆÛ\ÜÓ˜[YOH^X\K[ZY^VÌLÜHY[ˆY˜›ØÚÈ‚ˆØXÝ]™PÛÝ[HÙ\šXÙ^ØXÝ]™PÛÝ[ˆHÈœÈˆˆˆŸH\ÜÛšX›BˆØXÝ]™PÛÝ[ˆHÈœÈˆˆˆŸBˆÜ‚ˆÙ]‚ˆÙ]‚‚ˆÜÙ\šXÙ\Ë›[™ÝOOHÈ
ˆ]ˆÛ\ÜÓ˜[YOH^XÙ[\ˆKLŒ‚ˆÛ\ÜÓ˜[YOH^X\K[ZY^[ÈÚ\™Ù[Y[\ÈÙ\šXÙ\Ë‹‹Ü‚ˆÙ]‚ˆ
Hˆ
ˆ]ˆÛ\ÜÓ˜[YOH™ÜšYÜšYXÛÛËLHÛN™ÜšYXÛÛËLˆÎ™ÜšYXÛÛËMØ\M‚ˆÜÙ\šXÙ\Ë›X\

Ù\šXÙJHOˆ
ˆÙ\šXÙPØ\™ˆÙ^O^ÜÙ\šXÙKœÛYßBˆØ\™™Y^Ê[
HOˆÈØ\™™YœË˜Ý\œ™[ÜÙ\šXÙKœÛY×HH[È_BˆÙ\šXÙO^ÜÙ\šXÙ_BˆÛ•ÙÙÛS]]O^Ú[™UÙÙÛS]]_BˆÏ‚ˆ
J_BˆÙ]‚ˆ
_B‚ˆËÊˆÛÛ[Y[0éØHX\˜ÚH
‹ßBˆ]ˆÛ\ÜÓ˜[YOH›]LŒÛ\ÜËXØ\™›Ý[™YLÞNYœLLˆ‚ˆ]ˆÛ\ÜÓ˜[YOH^XÙ[\ˆX‹LLˆ‚ˆÛ\ÜÓ˜[YOH^VÌL\H›Û\Ù[ZX›Û^X\K[ZY\\˜Ø\ÙH˜XÚÚ[™Ë]ÚY\ÝX‹Lˆ‚ˆ›ØÙ\ÜÝ\ÂˆÜ‚ˆˆÛ\ÜÓ˜[YOH™›ÛY\Ü^H›ÛX›XÚÈ^LÞ^X\KX›XÚÈ˜XÚÚ[™Ë]YÚ‚ˆÛÛ[Y[0éØHX\˜ÚHÂˆÚ‚ˆÙ]‚ˆ]ˆÛ\ÜÓ˜[YOH™ÜšYÜšYXÛÛËLHY™ÜšYXÛÛËLÈØ\LL‚ˆÜÝ\Ë›X\

][KJHOˆ
ˆ]ˆÙ^O^Ú][KœÝ\HÛ\ÜÓ˜[YOH™›^Ø\MH‚ˆ]ˆÛ\ÜÓ˜[YOH™›^›^XÛÛ][\ËXÙ[\ˆØ\Lˆ›^\Úš[šËL‚ˆ]ˆÛ\ÜÓ˜[YOHËNHNH›Ý[™YLž™ËX\KX›XÚÈ›^][\ËXÙ[\ˆ\ÝYžKXÙ[\ˆ‚ˆÜ[ˆÛ\ÜÓ˜[YOH™›ÛY\Ü^H›ÛX›XÚÈ^]Ú]H^VÌLÜH‚ˆÚ][KœÝ\BˆÜÜ[‚ˆÙ]‚ˆÚHÝ\Ë›[™ÝHH	‰ˆ
ˆ]ˆÛ\ÜÓ˜[YOH™›^LHË\™ËX›XÚËÖÌŒ—HY[ˆY˜›ØÚÈˆÏ‚ˆ
_BˆÙ]‚ˆ]ˆÛ\ÜÓ˜[YOHœ‹M‚ˆÈÛ\ÜÓ˜[YOH™›ÛY\Ü^H›ÛX›Û^VÌMÜH^X\KX›XÚÈX‹Lˆ˜XÚÚ[™Ë]YÚ‚ˆÚ][K]_BˆÚÏ‚ˆÛ\ÜÓ˜[YOH^X\K[ZY^VÌLÜHXY[™Ë\™[^Y‚ˆÚ][K™\ØßBˆÜ‚ˆÙ]‚ˆÙ]‚ˆ
J_BˆÙ]‚ˆÙ]‚‚ˆËÊˆØ\˜[Y\È
‹ßBˆ]ˆÛ\ÜÓ˜[YOH›]NÜšYÜšYXÛÛËLHY™ÜšYXÛÛËLÈØ\LÈ‚ˆÖÂˆÂˆ[[ÚšNˆ¸¦¨H‹ˆ]NˆXÝ]˜][Ûˆ˜\YH‹ˆ\ØÎˆ“[Ú[œÈHHZ[]\È\°êÈZY[Y[‹ˆKˆÂˆ[[ÚšNˆ¼'å$ˆ‹ˆ]Nˆ”ZY[Y[ðêXÝ\š\ðêH‹ˆ\ØÎˆ“Uˆ[Ó[Ë[ÛÝˆ[Û™^KØ]™H‹ˆKˆÂˆ[[ÚšNˆ¼'ä«‹ˆ]Nˆ”Ý\ÜÚ‹ÍÈ‹ˆ\ØÎˆ‘\ÜÛšX›HšXHÚ]Ð\‹ˆKˆK›X\

ÊHOˆ
ˆ]‚ˆÙ^O^ÙË]_BˆÛ\ÜÓ˜[YOH™›^][\Ë\Ý\Ø\MMH›Ý[™YLÞ‚ˆÝ[O^ÞÂˆ˜XÚÙÜ›Ý[™ˆœ™Ø˜JŒŠH‹ˆ›Ü™\ŽˆŒ\ÛÛY™Ø˜JŒJH‹ˆ_Bˆ‚ˆÜ[ˆÛ\ÜÓ˜[YOH^Lž›^\Úš[šËLžÙË™[[Úš_OÜÜ[‚ˆ]‚ˆÛ\ÜÓ˜[YOH™›Û\Ù[ZX›Û^X\KX›XÚÈ^VÌLÜHX‹LH‚ˆÙË]_BˆÜ‚ˆÛ\ÜÓ˜[YOH^X\K[ZY^VÌLœHžÙË™\ØßOÜ‚ˆÙ]‚ˆÙ]‚ˆ
J_BˆÙ]‚ˆÙ]‚ˆÙ]‚ˆ
NÂŸB