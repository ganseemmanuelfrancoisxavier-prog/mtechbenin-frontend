"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  Heart,
  ChevronRight,
  Minus,
  Plus,
  Star,
  Check,
  ArrowLeft,
  Zap,
  Video,
  Volume2,
  VolumeX,
  RotateCw,
} from "lucide-react";
import { formatPrice, getDiscount } from "@/lib/format";
import { computeUnitPrice } from "@/lib/pricing";
import { buildCartKey, buildOrderVariantsArray } from "@/lib/variants";
import { productsApi } from "@/lib/api";
import useCartStore from "@/store/cartStore";
import useProductStore from "@/store/productStore";
import useReviewStore from "@/store/reviewStore";
import ReviewPhotoPicker from "./ReviewPhotoPicker";
import ReviewPhotos from "./ReviewPhotos";
import { urlVideoJouable, afficheVideo } from "@/lib/media";
import useVisibleVideo from "@/hooks/useVisibleVideo";

// ── Normalise images depuis l'API (JSON string ou array) ─────────────────────
function parseImages(raw) {
  if (!raw) return ["/placeholder.jpg"];
  if (Array.isArray(raw)) return raw.length > 0 ? raw : ["/placeholder.jpg"];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : ["/placeholder.jpg"];
  } catch {
    return ["/placeholder.jpg"];
  }
}

// ── Normalise specs depuis l'API (JSON string ou array) ──────────────────────
function parseSpecs(raw) {
  if (!raw) return [];
  const hideInternal = (specs) => specs.filter((spec) => spec.label !== "__mtech_iphone_color_images");
  if (Array.isArray(raw)) return hideInternal(raw);
  try {
    const parsed = JSON.parse(raw) || [];
    return Array.isArray(parsed) ? hideInternal(parsed) : [];
  } catch {
    return [];
  }
}

function parseColorImages(raw) {
  let specs = raw;
  if (typeof specs === "string") {
    try { specs = JSON.parse(specs); } catch { return []; }
  }
  if (!Array.isArray(specs)) return [];
  const metadata = specs.find((spec) => spec.label === "__mtech_iphone_color_images");
  if (!metadata?.value) return [];
  try {
    const images = JSON.parse(metadata.value);
    return Array.isArray(images) ? images : [];
  } catch { return []; }
}

// ── Normalise le statut ───────────────────────────────────────────────────────
function getStatus(product) {
  if (product.status) return product.status;
  if (product.stock === 0) return "Rupture";
  if (product.stock <= 3) return "Stock limité";
  return "En stock";
}

// ── Helpers variantes ─────────────────────────────────────────────────────────
function getVariantTypes(product) {
  if (!product?.variantTypes) return [];
  return product.variantTypes;
}

function isVariantComplete(variantTypes, selected) {
  return variantTypes
    .filter((t) => t.required)
    .every((t) => !!selected[t.name]);
}

function buildSelectedVariantsArray(variantTypes, selected) {
  return variantTypes
    .filter((t) => selected[t.name])
    .map((t) => ({ typeName: t.name, value: selected[t.name] }));
}

export default function ProductPage({ slug }) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const buyNow = useCartStore((state) => state.buyNow);

  const { products } = useProductStore();
  const {
    reviews,
    fetchReviewsBySlug,
    getReviewsByProduct,
    getAverageRating,
    addReview,
  } = useReviewStore();

  const [mounted, setMounted] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  // Démarre coupée : les navigateurs bloquent l'autoplay avec le son.
  const [videoMuted, setVideoMuted] = useState(true);
  const swipeStart = useRef(null);
  const lastTouchAt = useRef(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("reviews");
  const [liked, setLiked] = useState(false);
  const [added, setAdded] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    name: "",
    city: "",
    rating: 5,
    text: "",
  });
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [reviewPhotos, setReviewPhotos] = useState([]);
  const [reviewErreur, setReviewErreur] = useState("");
  // Empêche d'envoyer l'avis pendant qu'une photo est encore en cours de
  // transfert : elle serait perdue sans que le client comprenne pourquoi.
  const [photoEnCours, setPhotoEnCours] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState({});
  // Shape: { [typeName]: value }  e.g. { "Couleur": "Noir", "Taille": "L" }
  const [productDetail, setProductDetail] = useState(null);
  // productDetail holds the full product from GET /api/products/:slug, including variantTypes
  // Distingue « pas encore arrivé » de « a échoué » : sans ça, un backend
  // indisponible ou un délai dépassé laisserait productDetail à null pour
  // toujours, et bloquerait l'achat en permanence (voir detailEnCours plus
  // bas) au lieu de simplement retomber sur le prix de base sans sélecteur.
  const [detailErreur, setDetailErreur] = useState(false);

  const fetchDetail = useCallback(() => {
    setProductDetail(null);
    setDetailErreur(false);
    // Fetch the full product detail (includes variantTypes) from the detail endpoint
    productsApi.getBySlug(slug).then((data) => {
      setProductDetail(data.product ?? null);
    }).catch(() => {
      // Le sélecteur de variantes n'apparaîtra pas et le produit reste
      // achetable au prix de base — acceptable pour un produit sans
      // caractéristique, et de toute façon la seule option raisonnable ici :
      // bloquer indéfiniment serait pire qu'un achat au prix de base pour un
      // produit qui, lui, en aurait eu (le serveur refuserait alors la
      // commande au paiement, sans perte financière).
      setDetailErreur(true);
    });
  }, [slug]);

  useEffect(() => {
    setMounted(true);
    fetchReviewsBySlug(slug); // charge les avis de ce produit depuis l'API
  }, [slug]);

  useEffect(() => {
    setSelectedVariants({});
    fetchDetail();
  }, [slug, fetchDetail]);

  const storeProduct = products.find((p) => p.slug === slug);
  const baseProduct = storeProduct || productDetail;

  // Normalise le produit
  const product = baseProduct
    ? {
        ...baseProduct,
        images: parseImages(baseProduct.images),
        specs: parseSpecs(baseProduct.specs),
        colorImages: parseColorImages(baseProduct.specs),
        status: getStatus(baseProduct),
        videoUrl: baseProduct.videoUrl || null,
      }
    : null;

  const productReviews = mounted ? getReviewsByProduct(slug) : [];
  const avgRating = mounted ? getAverageRating(slug) : 0;
  const videoUrl = productDetail?.videoUrl ?? product?.videoUrl;
  const productVideo = useVisibleVideo({
    enabled: Boolean(product && videoUrl && activeImage === product.images.length),
    identity: videoUrl,
  });

  const handleSubmitReview = async () => {
    if (!reviewForm.name || !reviewForm.text || photoEnCours) return;
    setSubmitting(true);
    setReviewErreur("");
    try {
      await addReview({
        productSlug: slug,
        productName: product?.name || "",
        ...reviewForm,
        photos: reviewPhotos,
      });
    } catch (err) {
      // Ne jamais annoncer un succès sur un envoi raté : le formulaire garde
      // sa saisie et ses photos pour que le client puisse réessayer.
      setReviewErreur(err.message || "Envoi impossible — réessayez.");
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
    setReviewSubmitted(true);
    setReviewForm({ name: "", city: "", rating: 5, text: "" });
    setReviewPhotos([]);
    setTimeout(() => setReviewSubmitted(false), 3000);
  };

  if (!product)
    return (
      <div className="max-w-7xl mx-auto px-5 py-20 text-center">
        <p className="text-apple-mid text-xl mb-6">
          {!detailErreur ? "Chargement..." : "Produit introuvable"}
        </p>
        <Link href="/catalogue" className="btn-glass text-sm px-6 py-3">
          Retour au catalogue
        </Link>
      </div>
    );

  const isRupture = product.status === "Rupture";

  // productDetail is always fresh (fetched on every page load).
  // Use its videoUrl in priority over the store cache which can be up to 5 min stale.
  // Galerie unifiée : les photos, puis la vidéo à la fin s'il y en a une —
  // activeImage indexe ce tableau, balayable comme les photos.
  const selectedColorImage = product.colorImages.find((item) => item.color === selectedVariants.Couleur)?.imageUrl;
  const media = [
    ...product.images.map((url, index) => ({
      type: "image",
      url: index === 0 ? selectedColorImage || url : url,
    })),
    ...(videoUrl ? [{ type: "video", url: videoUrl }] : []),
  ];
  // Filet de sécurité : si les données du produit se rafraîchissent avec
  // moins de médias pendant qu'un index plus élevé était actif, on ne plante
  // pas sur un accès hors limites.
  const safeActiveImage = Math.min(activeImage, media.length - 1);

  // variantTypes come from the detail endpoint (productDetail), not the list endpoint
  // The list endpoint omits variantTypes for performance reasons
  const variantTypes = getVariantTypes(productDetail);
  const variantsComplete = isVariantComplete(variantTypes, selectedVariants);
  // selectedVariantsArray: only actually selected — used for cart key deduplication
  const selectedVariantsArray = buildSelectedVariantsArray(variantTypes, selectedVariants);
  // orderVariantsArray: all types, optional unselected → "Non choisi" — used in order payload
  const orderVariantsArray = buildOrderVariantsArray(variantTypes, selectedVariants);

  // Prix en direct : recalculé à chaque sélection avec la même fonction que le
  // serveur (src/lib/pricing.js, copie fidèle du backend). Tant qu'une
  // caractéristique obligatoire n'est pas choisie, calcul.ok est faux et on
  // affiche le prix de base — le minimum atteignable — le bouton d'ajout au
  // panier restant de toute façon bloqué par isVariantComplete.
  const calcul = computeUnitPrice({
    basePrice: product.price,
    variantTypes,
    selected: orderVariantsArray,
  });
  const prixAffiche = calcul.ok ? calcul.unitPrice : product.price;
  // La remise et le prix barré doivent porter sur le prix réellement affiché
  // (base + supplément de caractéristique), pas sur le prix de base : sinon
  // une option payante peut afficher un badge de réduction sur un prix final
  // supérieur à l'ancien prix. getDiscount masque déjà le badge quand
  // comparePrice ne dépasse plus le prix affiché.
  const discount = getDiscount(prixAffiche, product.comparePrice);

  const cartProduct = {
    ...product,
    price: prixAffiche,
    image: product.images[0],
    id: buildCartKey(product.id, selectedVariantsArray),
    selectedVariants: orderVariantsArray,
  };

  // `productDetail` démarre à `null` et n'arrive qu'après l'appel réseau vers
  // l'endpoint détail (le seul à renvoyer variantTypes — la liste, déjà en
  // cache Zustand quand on vient du catalogue, ne les inclut pas). Pendant
  // cette fenêtre, `variantTypes` vaut `[]` : la garde
  // `variantTypes.length > 0 && !variantsComplete` ne bloque alors rien, et
  // `computeUnitPrice` renvoie `ok:true` au prix de base faute de type à
  // vérifier. Un clic sur « Ajouter »/« Commander » dans cette fenêtre ajoute
  // donc une ligne sans caractéristique, que le serveur refusera au paiement
  // (« Choix requis : … ») sans que le client comprenne pourquoi ni comment
  // corriger — d'où ce blocage explicite tant que le détail n'est pas là.
  //
  // `detailErreur` sort explicitement de ce blocage : si l'appel a échoué
  // (backend indisponible, délai dépassé, 404, 500), `productDetail` reste à
  // `null` pour toujours — sans cette exclusion, les boutons resteraient
  // grisés en permanence, un défaut bien pire que la fenêtre de quelques
  // centaines de millisecondes d'origine. On retombe alors sur le
  // comportement antérieur au blocage : achat possible au prix de base, sans
  // sélecteur de caractéristiques.
  const detailEnCours = productDetail === null && !detailErreur;

  const handleAddToCart = () => {
    if (isRupture || detailEnCours) return;
    if (variantTypes.length > 0 && !variantsComplete) return;
    for (let i = 0; i < quantity; i++) addItem(cartProduct);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    if (isRupture || detailEnCours) return;
    if (variantTypes.length > 0 && !variantsComplete) return;
    buyNow(cartProduct, quantity);
    router.push("/checkout");
  };

  // ── Balayage gauche/droite sur l'image principale pour changer de photo ────
  const SWIPE_THRESHOLD = 40; // px minimum pour compter comme un balayage volontaire

  const getSwipePoint = (e) => {
    const t = e.touches?.[0] || e.changedTouches?.[0];
    return t ? { x: t.clientX, y: t.clientY } : { x: e.clientX, y: e.clientY };
  };

  const handleSwipeStart = (e) => {
    if (e.type === "touchstart") lastTouchAt.current = Date.now();
    // Certains navigateurs mobiles émettent un mousedown/mouseup "fantôme"
    // juste après un geste tactile (compatibilité clic) — on l'ignore pour
    // ne pas traiter le même balayage deux fois.
    if (e.type === "mousedown" && Date.now() - lastTouchAt.current < 800) return;
    swipeStart.current = getSwipePoint(e);
  };

  const handleSwipeEnd = (e) => {
    if (e.type === "touchend") lastTouchAt.current = Date.now();
    if (!swipeStart.current) return;
    const end = getSwipePoint(e);
    const deltaX = end.x - swipeStart.current.x;
    const deltaY = end.y - swipeStart.current.y;
    swipeStart.current = null;
    // Ignore si le geste est trop court, ou plus vertical qu'horizontal
    // (l'utilisateur scrolle la page, il ne balaie pas la galerie).
    if (Math.abs(deltaX) < SWIPE_THRESHOLD || Math.abs(deltaX) < Math.abs(deltaY)) return;
    if (deltaX < 0) {
      setActiveImage((i) => Math.min(i + 1, media.length - 1));
    } else {
      setActiveImage((i) => Math.max(i - 1, 0));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-5 py-8">
      {/* Breadcrumb */}
      <nav className="hidden md:flex items-center gap-2 text-[13px] text-apple-mid mb-8">
        <Link href="/" className="hover:text-apple-black transition-colors">
          Accueil
        </Link>
        <ChevronRight className="w-3 h-3" />
        <Link
          href="/catalogue"
          className="hover:text-apple-black transition-colors"
        >
          Catalogue
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-apple-black font-medium truncate max-w-xs">
          {product.name}
        </span>
      </nav>

      <Link
        href="/catalogue"
        className="flex items-center gap-1.5 text-[13px] text-apple-mid hover:text-apple-black mb-6 md:hidden transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Retour
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Galerie */}
        <div className="space-y-3">
          <div
            className="relative aspect-square bg-neutral-100 rounded-3xl overflow-hidden select-none"
            style={{ touchAction: "pan-y" }}
            onTouchStart={handleSwipeStart}
            onTouchEnd={handleSwipeEnd}
            onMouseDown={handleSwipeStart}
            onMouseUp={handleSwipeEnd}
          >
            {media[safeActiveImage].type === "video" ? (
              <video
                key={media[safeActiveImage].url}
                ref={productVideo.ref}
                src={productVideo.selected ? urlVideoJouable(media[safeActiveImage].url) : undefined}
                poster={afficheVideo(media[safeActiveImage].url)}
                autoPlay={productVideo.selected && !productVideo.reducedMotion}
                loop
                playsInline
                muted={videoMuted}
                preload="none"
                className="pointer-events-none absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <Image
                src={media[safeActiveImage].url}
                alt={product.name}
                fill
                className="object-cover pointer-events-none"
                sizes="(max-width: 1024px) 100vw, 50vw"
                draggable={false}
              />
            )}
            {discount && media[safeActiveImage].type === "image" && (
              <span className="absolute top-4 left-4 badge-promo">
                {discount}
              </span>
            )}
            {media[safeActiveImage].type === "video" && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setVideoMuted((m) => !m);
                }}
                className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200"
                style={{
                  background: "rgba(0,0,0,0.40)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
              >
                {videoMuted ? (
                  <VolumeX className="w-4 h-4 text-white/80" />
                ) : (
                  <Volume2 className="w-4 h-4 text-white" />
                )}
              </button>
            )}
            {media.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {media.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      safeActiveImage === i ? "w-5 bg-white" : "w-1.5 bg-white/50"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
          {media.length > 1 && (
            <div className="flex gap-2">
              {media.map((m, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`relative w-16 h-16 rounded-2xl overflow-hidden border-2 transition-all ${safeActiveImage === i ? "border-apple-black" : "border-transparent"}`}
                >
                  {m.type === "video" ? (
                    <>
                      <video
                        poster={afficheVideo(m.url)}
                        muted
                        playsInline
                        preload="none"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                        <Video className="w-5 h-5 text-white" />
                      </span>
                    </>
                  ) : (
                    <Image
                      src={m.url}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Infos */}
        <div className="space-y-5">
          <span
            className={`inline-block ${
              product.status === "En stock"
                ? "badge-stock-ok"
                : product.status === "Stock limité"
                  ? "badge-stock-limited"
                  : "badge-stock-out"
            }`}
          >
            {product.status}
          </span>

          <h1 className="font-display font-black text-2xl md:text-3xl text-apple-black leading-tight tracking-tight">
            {product.name}
          </h1>

          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${i <= Math.round(mounted ? avgRating : 4) ? "fill-cta text-cta" : "text-neutral-200"}`}
                />
              ))}
            </div>
            <span className="text-apple-mid text-[13px]">
              {mounted && avgRating > 0 ? avgRating.toFixed(1) : "—"} ·{" "}
              {productReviews.length} avis
            </span>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="font-display font-black text-3xl text-apple-black tracking-tight">
              {formatPrice(prixAffiche)}
            </span>
            {product.comparePrice > prixAffiche && (
              <span className="text-apple-mid text-lg line-through">
                {formatPrice(product.comparePrice)}
              </span>
            )}
          </div>

          {/* ── Variantes ── */}
          {variantTypes.length > 0 && (
            <div className="space-y-4">
              {variantTypes.map((vType) => (
                <div key={vType.id}>
                  <p className="text-[12px] font-semibold text-apple-mid uppercase tracking-widest mb-2.5">
                    {vType.name}
                    {vType.required ? (
                      <span className="text-cta ml-1">*</span>
                    ) : (
                      <span className="normal-case font-normal text-apple-mid/60 ml-1.5">(optionnel)</span>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {vType.options.map((opt) => {
                      const isSelected = selectedVariants[vType.name] === opt.value;
                      // Le supplément n'est délibérément pas affiché à côté de
                      // l'option : le client lit le prix total au-dessus, qui
                      // se recalcule à chaque choix. Le montant du supplément
                      // reste visible côté panel, là où il se règle.
                      return (
                        <button
                          key={opt.id}
                          onClick={() => {
                            setSelectedVariants((prev) => ({
                              ...prev,
                              [vType.name]: isSelected ? undefined : opt.value,
                            }));
                            if (vType.name.toLowerCase() === "couleur") setActiveImage(0);
                          }}
                          className="px-4 py-2 rounded-2xl text-[13px] font-semibold transition-all duration-150"
                          style={
                            isSelected
                              ? {
                                  background: "rgba(29,29,31,0.92)",
                                  color: "#fff",
                                  border: "2px solid rgba(29,29,31,0.92)",
                                }
                              : {
                                  background: "rgba(0,0,0,0.03)",
                                  color: "#1D1D1F",
                                  border: "2px solid rgba(0,0,0,0.10)",
                                }
                          }
                        >
                          {opt.value}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {variantTypes.some((t) => t.required) && !variantsComplete && (
                <p className="text-[12px] text-apple-mid/70">
                  * Sélectionnez toutes les options requises pour commander.
                </p>
              )}
            </div>
          )}

          <div>
            <p className="text-[12px] font-semibold text-apple-mid uppercase tracking-widest mb-2.5">
              Quantité
            </p>
            <div className="inline-flex items-center gap-3 bg-black/[0.04] rounded-2xl p-1">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center hover:bg-neutral-50 transition"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="font-bold text-apple-black w-6 text-center text-[15px]">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center hover:bg-neutral-50 transition"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {detailEnCours && (
            <p className="text-[12px] text-apple-mid/70 flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 border-2 border-apple-mid/30 border-t-apple-mid rounded-full animate-spin" />
              Chargement des caractéristiques du produit…
            </p>
          )}

          {detailErreur && (
            <p className="text-[12px] text-apple-mid/70 flex items-center gap-1.5 flex-wrap">
              <span>
                Options du produit indisponibles pour le moment — l&apos;achat
                se fait au prix de base.
              </span>
              <button
                onClick={fetchDetail}
                className="inline-flex items-center gap-1 font-semibold text-apple-black hover:underline"
              >
                <RotateCw className="w-3 h-3" /> Réessayer
              </button>
            </p>
          )}

          <div className="flex gap-2.5">
            <button
              onClick={handleBuyNow}
              disabled={
                isRupture ||
                detailEnCours ||
                (variantTypes.length > 0 && !variantsComplete)
              }
              className="flex-1 flex items-center justify-center py-3.5 rounded-2xl text-[13px] font-semibold transition-all duration-200 active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: isRupture
                  ? "rgba(0,0,0,0.05)"
                  : "rgba(29,29,31,0.92)",
                backdropFilter: "blur(16px)",
                color: isRupture ? "#6E6E73" : "#FFFFFF",
                border: "1px solid rgba(255,255,255,0.07)",
                boxShadow: isRupture ? "none" : "0 2px 14px rgba(0,0,0,0.22)",
              }}
            >
              Commander maintenant
            </button>

            <button
              onClick={handleAddToCart}
              disabled={
                isRupture ||
                detailEnCours ||
                (variantTypes.length > 0 && !variantsComplete)
              }
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[13px] font-semibold transition-all duration-200 active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed"
              style={
                added
                  ? {
                      background: "rgba(52,199,89,0.12)",
                      color: "#1A7F37",
                      border: "1px solid rgba(52,199,89,0.22)",
                    }
                  : {
                      background: "rgba(255,255,255,0.22)",
                      backdropFilter: "blur(24px) saturate(200%)",
                      border: "1px solid rgba(255,255,255,0.50)",
                      color: "#1D1D1F",
                      boxShadow:
                        "0 2px 16px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.65)",
                    }
              }
            >
              {added ? (
                <>
                  <Check className="w-4 h-4" /> Ajouté
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" /> Ajouter au panier
                </>
              )}
            </button>

            <button
              onClick={() => setLiked(!liked)}
              className="w-[52px] flex items-center justify-center rounded-2xl transition-all duration-200 active:scale-95"
              style={{
                background: "rgba(255,255,255,0.22)",
                backdropFilter: "blur(24px) saturate(200%)",
                border: "1px solid rgba(255,255,255,0.50)",
                boxShadow:
                  "0 2px 16px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.65)",
              }}
            >
              <Heart
                className={`w-4 h-4 transition-all ${liked ? "fill-cta text-cta scale-110" : "text-apple-mid"}`}
              />
            </button>
          </div>

        </div>
      </div>

      {/* Onglets */}
      <div className="mt-16">
        <div className="flex gap-1 bg-black/[0.04] p-1 rounded-2xl w-fit mb-8">
          {[
            { key: "reviews", label: `Avis (${productReviews.length})` },
            { key: "description", label: "Description" },
            { key: "specs", label: "Spécifications" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2 rounded-xl text-[13px] font-medium transition-all ${activeTab === tab.key ? "bg-white text-apple-black shadow-sm" : "text-apple-mid hover:text-apple-black"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "description" && (
          <p className="text-apple-mid text-[14px] leading-relaxed max-w-2xl">
            {product.description || "Aucune description disponible."}
          </p>
        )}

        {activeTab === "specs" && (
          <div className="max-w-lg">
            {product.specs.length > 0 ? (
              <div className="space-y-1">
                {product.specs.map((spec, i) => (
                  <div
                    key={spec.id || i}
                    className={`flex items-center justify-between py-3 px-4 rounded-2xl text-[13px] ${i % 2 === 0 ? "bg-black/[0.03]" : ""}`}
                  >
                    <span className="text-apple-mid font-medium">
                      {spec.label}
                    </span>
                    <span className="text-apple-black font-semibold">
                      {spec.value}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-apple-mid text-[13px]">
                  Aucune spécification renseignée
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="space-y-4 max-w-2xl">
            {productReviews.length > 0 && (
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-black/[0.02]">
                <div className="text-center">
                  <span className="font-display font-black text-4xl text-apple-black">
                    {avgRating.toFixed(1)}
                  </span>
                  <p className="text-apple-mid text-[11px] mt-0.5">/5</p>
                </div>
                <div>
                  <div className="flex items-center gap-0.5 mb-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${s <= Math.round(avgRating) ? "fill-cta text-cta" : "text-black/10"}`}
                      />
                    ))}
                  </div>
                  <p className="text-apple-mid text-[12px]">
                    {productReviews.length} avis vérifiés
                  </p>
                </div>
              </div>
            )}

            {productReviews.map((review) => (
              <div key={review.id} className="glass-card rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-apple-black flex items-center justify-center text-white font-bold text-[12px] flex-shrink-0">
                    {review.name?.charAt(0) || "?"}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <span className="font-semibold text-apple-black text-[13px]">
                          {review.name}
                        </span>
                        <span className="text-apple-mid text-[11px] ml-2">
                          {review.city} · {review.date}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 mb-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${s <= review.rating ? "fill-cta text-cta" : "text-black/10"}`}
                        />
                      ))}
                    </div>
                    <p className="text-apple-mid text-[13px] leading-relaxed">
                      {review.text}
                    </p>
                    <ReviewPhotos photos={review.photos} auteur={review.name} />
                  </div>
                </div>
              </div>
            ))}

            {productReviews.length === 0 && (
              <div className="text-center py-8 glass-card rounded-2xl">
                <p className="text-apple-mid text-[13px]">
                  Aucun avis pour ce produit — soyez le premier !
                </p>
              </div>
            )}

            {/* Formulaire avis */}
            <div className="glass-card rounded-3xl p-6 border border-black/[0.05]">
              <p className="font-display font-bold text-[15px] text-apple-black mb-4 tracking-tight">
                Laisser un avis
              </p>
              {reviewSubmitted ? (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-green-50 border border-green-100">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <div>
                    <p className="text-green-700 font-semibold text-[13px]">
                      Avis envoyé !
                    </p>
                    <p className="text-green-600 text-[12px] mt-0.5">
                      Il sera visible après modération.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1.5 block">
                        Nom *
                      </label>
                      <input
                        value={reviewForm.name}
                        onChange={(e) =>
                          setReviewForm((p) => ({ ...p, name: e.target.value }))
                        }
                        placeholder="Votre nom"
                        className="w-full bg-black/[0.03] rounded-2xl px-4 py-3 text-[13px] border border-black/[0.07] focus:outline-none focus:border-black/20 transition"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1.5 block">
                        Ville
                      </label>
                      <input
                        value={reviewForm.city}
                        onChange={(e) =>
                          setReviewForm((p) => ({ ...p, city: e.target.value }))
                        }
                        placeholder="Cotonou"
                        className="w-full bg-black/[0.03] rounded-2xl px-4 py-3 text-[13px] border border-black/[0.07] focus:outline-none focus:border-black/20 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-2 block">
                      Note *
                    </label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          onMouseEnter={() => setHoverRating(s)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() =>
                            setReviewForm((p) => ({ ...p, rating: s }))
                          }
                          className="transition-transform hover:scale-110"
                        >
                          <Star
                            className={`w-7 h-7 transition-colors ${s <= (hoverRating || reviewForm.rating) ? "fill-cta text-cta" : "text-black/10"}`}
                          />
                        </button>
                      ))}
                      <span className="text-apple-mid text-[12px] ml-2">
                        {hoverRating || reviewForm.rating}/5
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1.5 block">
                      Votre avis *
                    </label>
                    <textarea
                      value={reviewForm.text}
                      onChange={(e) =>
                        setReviewForm((p) => ({ ...p, text: e.target.value }))
                      }
                      placeholder="Partagez votre expérience..."
                      rows={3}
                      className="w-full bg-black/[0.03] rounded-2xl px-4 py-3 text-[13px] border border-black/[0.07] focus:outline-none focus:border-black/20 transition resize-none"
                    />
                  </div>

                  <ReviewPhotoPicker
                    photos={reviewPhotos}
                    onChange={setReviewPhotos}
                    onBusyChange={setPhotoEnCours}
                  />

                  <button
                    onClick={handleSubmitReview}
                    disabled={
                      !reviewForm.name ||
                      !reviewForm.text ||
                      submitting ||
                      photoEnCours
                    }
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[13px] font-semibold transition-all bg-apple-black hover:bg-neutral-800 text-white disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : photoEnCours ? (
                      "Envoi de la photo…"
                    ) : (
                      "Envoyer mon avis"
                    )}
                  </button>
                  {reviewErreur && (
                    <p className="text-red-500 text-[12px] text-center">
                      {reviewErreur}
                    </p>
                  )}
                  <p className="text-[11px] text-apple-mid text-center">
                    Votre avis sera visible après modération par notre équipe.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
