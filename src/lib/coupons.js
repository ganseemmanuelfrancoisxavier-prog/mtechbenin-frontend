// lib/coupons.js — compatibilité cartStore
// La validation passe désormais par l'API via couponStore

export function calcDiscount(coupon, cartTotal) {
  if (!coupon) return 0;
  const type = coupon.type?.toLowerCase();
  if (type === "percentage")
    return Math.round((cartTotal * coupon.value) / 100);
  return Math.min(coupon.value, cartTotal);
}
