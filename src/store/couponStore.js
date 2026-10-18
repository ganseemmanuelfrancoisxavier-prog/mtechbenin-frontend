import { create } from "zustand";
import { persist } from "zustand/middleware";
import apiFetch from "@/lib/api";

const couponApiLocal = {
  validate: (code, cartTotal) =>
    apiFetch("/api/coupons/validate", {
      method: "POST",
      body: JSON.stringify({ code, cartTotal }),
    }),
};

const initialCoupons = [
  {
    id: 1,
    code: "BIENVENUE10",
    type: "percentage",
    value: 10,
    minOrder: 5000,
    maxUses: 100,
    usedCount: 34,
    expiresAt: "2026-12-31",
    active: true,
  },
  {
    id: 2,
    code: "MTECH2000",
    type: "fixed",
    value: 2000,
    minOrder: 10000,
    maxUses: 50,
    usedCount: 12,
    expiresAt: "2026-09-30",
    active: true,
  },
  {
    id: 3,
    code: "FLASH50",
    type: "percentage",
    value: 50,
    minOrder: 0,
    maxUses: 20,
    usedCount: 20,
    expiresAt: "2026-06-15",
    active: false,
  },
  {
    id: 4,
    code: "NOEL5000",
    type: "fixed",
    value: 5000,
    minOrder: 20000,
    maxUses: 30,
    usedCount: 8,
    expiresAt: "2026-12-25",
    active: true,
  },
];

const useCouponStore = create(
  persist(
    (set, get) => ({
      coupons: initialCoupons,

      // ── CRUD admin (local + API) ───────────────────────────────────────────
      addCoupon: (coupon) =>
        set((state) => ({
          coupons: [
            ...state.coupons,
            { ...coupon, id: Date.now(), usedCount: 0 },
          ],
        })),

      updateCoupon: (code, data) =>
        set((state) => ({
          coupons: state.coupons.map((c) =>
            c.code === code ? { ...c, ...data } : c,
          ),
        })),

      deleteCoupon: (code) =>
        set((state) => ({
          coupons: state.coupons.filter((c) => c.code !== code),
        })),

      toggleCoupon: (code) =>
        set((state) => ({
          coupons: state.coupons.map((c) =>
            c.code === code ? { ...c, active: !c.active } : c,
          ),
        })),

      incrementUsed: (code) =>
        set((state) => ({
          coupons: state.coupons.map((c) =>
            c.code === code ? { ...c, usedCount: (c.usedCount || 0) + 1 } : c,
          ),
        })),

      // ── Validation via API (priorité) avec fallback local ─────────────────
      validateCoupon: async (code, cartTotal) => {
        try {
          const data = await couponApiLocal.validate(code, cartTotal);
          return data; // { valid: true/false, coupon, error }
        } catch (err) {
          // Fallback validation locale
          const coupon = get().coupons.find(
            (c) => c.code === code.toUpperCase().trim(),
          );
          if (!coupon) return { valid: false, error: "Code promo invalide" };
          if (!coupon.active)
            return { valid: false, error: "Ce code promo est inactif" };
          if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date())
            return { valid: false, error: "Ce code promo a expiré" };
          if (coupon.maxUses && coupon.usedCount >= coupon.maxUses)
            return { valid: false, error: "Ce code promo est épuisé" };
          if (coupon.minOrder > 0 && cartTotal < coupon.minOrder)
            return {
              valid: false,
              error: `Commande minimum de ${coupon.minOrder.toLocaleString("fr-FR")} FCFA requise`,
            };
          return { valid: true, coupon };
        }
      },

      calcDiscount: (coupon, cartTotal) => {
        if (!coupon) return 0;
        const type = coupon.type?.toLowerCase();
        if (type === "percentage")
          return Math.round((cartTotal * coupon.value) / 100);
        return Math.min(coupon.value, cartTotal);
      },
    }),
    { name: "mtechbenin-coupons" },
  ),
);

export default useCouponStore;
