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
  if (Array.isArray(raw)) return raw;
  try {
    return JSON.parse(raw) || [];
  } catch {
    return [];
  }
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
        specs: parseSpec������k�w��`   backdropFilter: "blur(16px)",
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
