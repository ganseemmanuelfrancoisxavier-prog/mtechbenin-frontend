"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";
import { formatPrice, getDiscount } from "@/lib/format";
import { useEffect, useRef, useState } from "react";

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
  const [liked, setLiked] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return undefined;
    if (!("IntersectionObserver" in window)) {
      card.classList.add("is-visible");
      return undefined;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          card.classList.add("is-visible");
          observer.unobserve(card);
        }
      },
      { rootMargin: "0px 0px -40px 0px", threshold: 0.08 },
    );
    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  const image = getProductImage(product);
  const status = getProductStatus(product);
  const discount = getDiscount(product.price, product.comparePrice);
  const isRupture = status === "Rupture";
  // Certaines fiches nécessitent un choix de variante.
  const hasOptions = product.hasRequiredVariants === true;

  return (
    <Link
      ref={cardRef}
      href={`/produit/${product.slug}`}
      className="product-card-reveal catalogue-card-float group relative glass-card rounded-3xl overflow-hidden transition-all duration-300 flex flex-col"
    >
      {/* Image */}
      <div className="relative bg-neutral-100 aspect-square overflow-hidden">
        <Image
          src={image}
          alt={product.name}
          fill
          className="catalogue-card-depth catalogue-card-image object-cover transition-transform duration-500"
          sizes="(max-width: 768px) 50vw, 25vw"
        />

        {/* Badge réduction */}
        {discount && (
          <span className="absolute top-3 left-3 badge-promo">{discount}</span>
        )}

        {/* Favori */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setLiked((previous) => !previous);
          }}
          aria-label={liked ? "Retirer des favoris" : "Ajouter aux favoris"}
          aria-pressed={liked}
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

      </div>

      {/* Infos */}
      <div className="catalogue-card-depth p-4 flex flex-col flex-1">
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

        <h3 className="min-h-[2.5rem] text-left font-bold text-apple-black text-[13px] leading-snug mb-2.5 flex-1 line-clamp-2">
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

        <span className="mt-auto border-t border-black/[0.06] pt-3 text-[12px] font-medium text-neutral-500">
          {isRupture ? "Indisponible" : hasOptions ? "Voir les options" : "Voir le produit"}
        </span>
      </div>
    </Link>
  );
}
