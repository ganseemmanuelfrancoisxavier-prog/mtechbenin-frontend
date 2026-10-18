"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { X, Minus, Plus, ShoppingBag, ArrowRight, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import useCartStore from "@/store/cartStore";
import { formatPrice } from "@/lib/format";

export default function CartDrawer({ isOpen, onClose }) {
  const { items, removeItem, updateQuantity, getTotalPrice, getTotalItems } =
    useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Bloque le scroll body sur tous les écrans quand ouvert
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!mounted) return null;

  return (
    <>
      {/* Overlay animé */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/*
        Mobile  : bottom sheet depuis le bas, max-h 90vh
        Desktop : side drawer depuis la droite, hauteur plein écran
      */}
      <div
        className={`
        fixed z-50 bg-white shadow-2xl flex flex-col transition-all duration-300 ease-in-out

        bottom-0 left-0 right-0 rounded-t-3xl max-h-[90vh]
        ${isOpen ? "translate-y-0" : "translate-y-full"}

        md:top-0 md:right-0 md:bottom-0 md:left-auto
        md:w-full md:max-w-md md:rounded-none md:max-h-screen
        ${isOpen ? "md:translate-x-0 md:translate-y-0" : "md:translate-x-full md:translate-y-0"}
      `}
      >
        {/* Drag handle mobile */}
        <div className="flex justify-center pt-3 pb-1 md:hidden flex-shrink-0">
          <div className="w-10 h-1 bg-black/[0.12] rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 md:py-5 border-b border-black/5 flex-shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-apple-black" />
            <h2 className="font-display font-bold text-lg text-apple-black">
              Mon Panier
            </h2>
            {getTotalItems() > 0 && (
              <span className="bg-cta text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {getTotalItems()}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-black/[0.05] transition"
          >
            <X className="w-5 h-5 text-apple-mid" />
          </button>
        </div>

        {/* Panier vide */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 py-10">
            <div className="w-20 h-20 bg-black/[0.04] rounded-full flex items-center justify-center">
              <ShoppingBag className="w-10 h-10 text-apple-mid" />
            </div>
            <p className="text-apple-mid font-medium">Votre panier est vide</p>
            <button
              onClick={onClose}
              className="bg-apple-black text-white px-6 py-3 rounded-2xl font-semibold text-sm hover:bg-neutral-800 transition"
            >
              Continuer mes achats
            </button>
          </div>
        ) : (
          <>
            {/* ── Liste articles scrollable ────────────────────────────── */}
            <div
              className="flex-1 overflow-y-auto overscroll-contain px-6 py-4 space-y-4"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-3 glass-card rounded-2xl"
                >
                  <div className="relative w-20 h-20 bg-black/[0.04] rounded-xl overflow-hidden flex-shrink-0">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-apple-black text-sm leading-snug mb-1 truncate">
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
                    <p className="font-bold text-[13px] text-apple-black">
                      {formatPrice(item.price)}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="inline-flex items-center gap-2 bg-black/[0.04] rounded-xl p-0.5">
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          className="w-7 h-7 rounded-lg bg-white shadow flex items-center justify-center hover:bg-gray-50 transition"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-bold text-apple-black text-sm w-5 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          className="w-7 h-7 rounded-lg bg-white shadow flex items-center justify-center hover:bg-gray-50 transition"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1.5 text-apple-mid hover:text-red-500 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Footer fixe ──────────────────────────────────────────── */}
            <div
              className="px-6 py-5 border-t border-black/5 space-y-3 flex-shrink-0
              pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
            >
              <div className="flex items-center justify-between">
                <span className="text-apple-mid font-medium">Total</span>
                <span className="font-display font-black text-xl text-apple-black">
                  {formatPrice(getTotalPrice())}
                </span>
              </div>
              <Link
                href="/checkout"
                onClick={onClose}
                className="w-full flex items-center justify-center gap-2 bg-apple-black hover:bg-neutral-800 text-white font-semibold py-4 rounded-2xl transition-all active:scale-95"
              >
                Passer la commande <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/panier"
                onClick={onClose}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-[13px] font-semibold text-apple-mid hover:text-apple-black transition-colors border border-black/[0.07] hover:border-black/[0.15]"
              >
                Voir le panier complet <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={onClose}
                className="w-full text-apple-mid text-sm hover:text-apple-black transition text-center"
              >
                Continuer mes achats
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
