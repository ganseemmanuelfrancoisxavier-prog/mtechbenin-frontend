"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Heart, ShoppingCart, Check } from "lucide-react";
import { formatPrice, getDiscount } from "@/lib/format";
import useCartStore from "@/store/cartStore";
import { useState } from "react";

// ── Normalise l'image depuis l'API (images JSON array) ou local (image string)
function getProductImage(product) {
  if (product.image) return product.image;
  if (product.images) {
    try {
      const parsed =
        typeof product.images === "string"
          ? JSON.parse(product.images)
          : product.images;
      if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
    } catch {}
  }
  return "/placeholder.jpg";
}

// ── Normalise le statut depuis l'API (status string) ou local
function getProductStatus(product) {
  if (product.status) return product.status;
  if (product.stock === 0) return "Rupture";
  if (product.stock <= 3) return "Stock limité";
  return "En stock";
}

export default function ProductCard({ product }) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const buyNow = useCartStore((state) => state.buyNow);

  const [liked, setLiked] = useState(false);
  const [added, setAdded] = useState(false);

  const image = getProductImage(product);
  const status = getProductStatus(product);
  const discount = getDiscount(product.price, product.comparePrice);
  const isRupture = status === "Rupture";
  // La vignette n'a jamais les caractéristiques (valeurs, suppléments) — seul
  // `GET /api/products` sait dire si le produit en a au moins une obligatoire.
  // Sans ce garde-fou, un ajout/achat direct depuis la vignette part sans
  // caractéristique et le serveur le refuse désormais au paiement (« Choix
  // requis : … »), pour un produit qui achetait auparavant sans problème.
  const hasOptions = product.hasRequiredVariants === true;

  // Normalise le produit pour le panier (assure que image est une string)
  const cartProduct = { ...product, image };

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (isRupture) return;
    addItem(cartProduct);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleBuyNow = (e) => {
    e.preventDefault();
    if (isRupture) return;
    buyNow(cartProduct, 1);
    router.push("/checkout");
  };

  return (
    <Link
      href={`/produit/${product.slug}`}
      className="group relative glass-card rounded-3xl overflow-hidden hover:-translate-y-1 transition-all duration-300 flex flex-col"
    >
      {/* Image */}
      <div className="relative bg-neutral-100 aspect-square overflow-hidden">
        <Image
          src={image}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 768px) 50vw, 25vw"
        />

        {/* Badge réduction */}
        {discount && (
          <span className="absolute top-3 left-3 badge-promo">{discount}</span>
        )}

        {/* Favori */}
        <button
          onClick={(e) => {
            e.preventDefault();
            setLiked(!liked);
          }}
          className="absolute top-3 right-3 w-8 h-8 rounded-xl flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-200"
          style={{
            background: "rgba(255,255,255,0.75)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.5)",
          }}
        >
          <Heart
            className={`w-3.5 h-3.5 transition-all ${liked ? "fill-cta text-cta scale-110" : "text-apple-mid"}`}
          />
        </button>

        {!isRupture && !hasOptions && (
          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <button
              onClick={handleAddToCart}
              className={`w-full flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-[12px] font-semibold transition-all duration-200 active:scale-95 ${added ? "scale-95" : ""}`}
              style={
                added
                  ? {
                      background: "rgba(52,199,89,0.15)",
                      color: "#1A7F37",
                      border: "1px solid rgba(52,199,89,0.25)",
                    }
                  : {
                      background: "rgba(255,255,255,0.22)",
                      backdropFilter: "blur(24px) saturate(200%)",
                      WebkitBackdropFilter: "blur(24px) saturate(200%)",
                      border: "1px solid rgba(255,255,255,0.50)",
                      color: "#1D1D1F",
                      boxShadow:
                        "0 2px 16px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.65)",
                    }
              }
            >
              {added ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Ajouté
                </>
              ) : (
                <>
                  <ShoppingCart className="w-3.5 h-3.5" /> Ajouter au panier
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Infos */}
      <div className="p-4 flex flex-col flex-1">
        <span
          className={`self-start text-[11px] font-medium mb-2 ${
            status === "En stock"
              ? "badge-stock-ok"
              : status === "Stock limité"
                ? "badge-stock-limited"
                : "badge-stock-out"
          }`}
        >
          {status}
        </span>

        <h3 className="font-medium text-apple-black text-[13px] leading-snug mb-2.5 flex-1">
          {product.name}
        </h3>

        <div className="flex items-baseline gap-2 mb-3.5">
          <span className="font-display font-black text-apple-black text-[17px] tracking-tight">
            {formatPrice(product.price)}
          </span>
          {product.comparePrice && (
            <span className="text-apple-mid text-[13px] line-through">
              {formatPrice(product.comparePrice)}
            </span>
          )}
        </div>

        {isRupture ? (
          <span
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-[12px] font-semibold opacity-40 cursor-not-allowed"
            style={{ background: "rgba(0,0,0,0.05)", color: "#6E6E73" }}
          >
            Indisponible
          </span>
        ) : hasOptions ? (
          // Pas de <Link> imbriqué : la carte entière est déjà un lien vers
          // la fiche produit — cet élément n'est qu'un repère visuel, le clic
          // est porté par le <Link> parent.
          <span
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-[12px] font-semibold transition-all duration-200"
            style={{
              background: "rgba(29,29,31,0.92)",
              color: "#FFFFFF",
              border: "1px solid rgba(255,255,255,0.07)",
              boxShadow: "0 2px 14px rgba(0,0,0,0.22)",
            }}
          >
            Choisir les options
          </span>
        ) : (
          <button
            onClick={handleBuyNow}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-[12px] font-semibold transition-all duration-200 active:scale-95"
            style={{
              background: "rgba(29,29,31,0.92)",
              color: "#FFFFFF",
              border: "1px solid rgba(255,255,255,0.07)",
              boxShadow: "0 2px 14px rgba(0,0,0,0.22)",
            }}
          >
            Commander
          </button>
        )}
      </div>
    </Link>
  );
}
