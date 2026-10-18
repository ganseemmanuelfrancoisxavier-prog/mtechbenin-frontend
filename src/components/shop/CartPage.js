"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Minus,
  Plus,
  Trash2,
  ArrowRight,
  ShoppingBag,
  ArrowLeft,
  Tag,
  X,
} from "lucide-react";
import useCartStore from "@/store/cartStore";
import { formatPrice } from "@/lib/format";

export default function CartPage() {
  const {
    items,
    removeItem,
    updateQuantity,
    getTotalPrice,
    clearCart,
    applyCoupon,
    removeCoupon,
    appliedCoupon,
    getDiscountAmount,
    getFinalPrice,
  } = useCartStore();

  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  // ── applyCoupon est async (valide via l'API) ──────────────────────────────
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError("");
    try {
      const result = await applyCoupon(couponCode);
      if (!result.valid) {
        setCouponError(result.error || "Code promo invalide");
      } else {
        setCouponCode("");
      }
    } catch {
      setCouponError("Erreur lors de la validation du code");
    }
    setCouponLoading(false);
  };

  const discount = getDiscountAmount();
  const finalPrice = getFinalPrice();

  // ── Panier vide ───────────────────────────────────────────────────────────
  if (items.length === 0)
    return (
      <div className="max-w-7xl mx-auto px-5 py-20 text-center">
        <div className="w-24 h-24 bg-apple-gray rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="w-12 h-12 text-apple-mid" />
        </div>
        <h1 className="font-display font-black text-2xl text-apple-black mb-3">
          Votre panier est vide
        </h1>
        <p className="text-apple-mid mb-8">
          Ajoutez des produits pour commencer vos achats
        </p>
        <Link
          href="/catalogue"
          className="inline-flex items-center gap-2 bg-cta text-white font-semibold px-8 py-4 rounded-2xl hover:bg-cta/90 transition"
        >
          Découvrir nos produits <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );

  // ── Panier rempli ─────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-5 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-black text-3xl text-apple-black">
            Mon Panier
          </h1>
          <p className="text-apple-mid mt-1">
            {items.length} article{items.length > 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-sm text-apple-mid hover:text-red-500 transition-colors"
        >
          Vider le panier
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Articles */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="glass-card rounded-3xl p-5 flex gap-5"
            >
              <div className="relative w-24 h-24 bg-apple-gray rounded-2xl overflow-hidden flex-shrink-0">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-apple-black text-sm leading-snug mb-1">
                  {item.name}
                </p>
                {item.selectedVariants?.filter((v) => v.value !== "Non choisi").length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-0.5 mb-1">
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
                <p className="text-primary font-bold">
                  {formatPrice(item.price)}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <div className="inline-flex items-center gap-3 bg-apple-gray rounded-xl p-1">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 rounded-lg bg-white shadow flex items-center justify-center hover:bg-gray-50 transition"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-bold text-apple-black text-sm w-5 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 rounded-lg bg-white shadow flex items-center justify-center hover:bg-gray-50 transition"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-apple-black">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-2 text-apple-mid hover:text-red-500 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          <Link
            href="/catalogue"
            className="flex items-center gap-2 text-primary font-medium text-sm hover:gap-3 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Continuer mes achats
          </Link>
        </div>

        {/* Récapitulatif */}
        <div className="lg:col-span-1">
          <div className="glass-card rounded-3xl p-6 sticky top-24 space-y-5">
            <h2 className="font-display font-bold text-lg text-apple-black">
              Récapitulatif
            </h2>

            {/* Bloc coupon */}
            {appliedCoupon ? (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="font-mono font-bold text-green-700 text-sm">
                      {appliedCoupon.code}
                    </p>
                    <p className="text-green-600 text-xs">
                      {appliedCoupon.type?.toLowerCase() === "percentage"
                        ? `-${appliedCoupon.value}%`
                        : `-${formatPrice(appliedCoupon.value)}`}{" "}
                      appliqué
                    </p>
                  </div>
                </div>
                <button
                  onClick={removeCoupon}
                  className="p-1.5 rounded-lg hover:bg-green-100 transition text-green-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value.toUpperCase());
                      setCouponError("");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                    placeholder="Code promo"
                    className="flex-1 bg-apple-gray rounded-xl px-4 py-2.5 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={!couponCode.trim() || couponLoading}
                    className="px-4 py-2.5 bg-apple-black hover:bg-apple-black/80 text-white text-sm font-semibold rounded-xl transition disabled:opacity-40"
                  >
                    {couponLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      "Appliquer"
                    )}
                  </button>
                </div>
                {couponError && (
                  <p className="text-red-500 text-xs flex items-center gap-1">
                    <X className="w-3 h-3" /> {couponError}
                  </p>
                )}
              </div>
            )}

            {/* Totaux */}
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-apple-mid">
                <span>Sous-total</span>
                <span className="font-medium text-apple-black">
                  {formatPrice(getTotalPrice())}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Réduction ({appliedCoupon.code})</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-apple-mid">
                <span>Livraison</span>
                <span className="text-green-600 font-medium">
                  Calculée au checkout
                </span>
              </div>
              <div className="border-t border-black/5 pt-3 flex justify-between">
                <span className="font-bold text-apple-black">Total</span>
                <span className="font-display font-black text-xl text-apple-black">
                  {formatPrice(finalPrice)}
                </span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="w-full flex items-center justify-center gap-2 bg-cta hover:bg-cta/90 text-white font-semibold py-4 rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-cta/25"
            >
              Commander <ArrowRight className="w-4 h-4" />
            </Link>

            <div className="text-center">
              <p className="text-xs text-apple-mid">
                Paiement sécurisé via MTN MoMo & Moov Money
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
