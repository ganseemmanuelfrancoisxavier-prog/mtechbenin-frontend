import { create } from "zustand";
import { persist } from "zustand/middleware";
import useCouponStore from "./couponStore";

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      appliedCoupon: null,

      addItem: (product) => {
        const items = get().items;
        const existing = items.find((item) => item.id === product.id);
        if (existing) {
          set({
            items: items.map((item) =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item,
            ),
          });
        } else {
          set({ items: [...items, { ...product, quantity: 1 }] });
        }
      },

      removeItem: (productId) =>
        set({ items: get().items.filter((item) => item.id !== productId) }),

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set({
          items: get().items.map((item) =>
            item.id === productId ? { ...item, quantity } : item,
          ),
        });
      },

      clearCart: () => set({ items: [], appliedCoupon: null }),

      buyNow: (product, quantity = 1) =>
        set({ items: [{ ...product, quantity }], appliedCoupon: null }),

      getTotalItems: () =>
        get().items.reduce((total, item) => total + item.quantity, 0),

      getTotalPrice: () =>
        get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0,
        ),

      // ── Coupon — validation via API ────────────────────────────────────────
      applyCoupon: async (code) => {
        const cartTotal = get().getTotalPrice();
        const result = await useCouponStore
          .getState()
          .validateCoupon(code, cartTotal);
        if (result.valid) set({ appliedCoupon: result.coupon });
        return result;
      },

      removeCoupon: () => set({ appliedCoupon: null }),

      getDiscountAmount: () => {
        const coupon = get().appliedCoupon;
        if (!coupon) return 0;
        return useCouponStore
          .getState()
          .calcDiscount(coupon, get().getTotalPrice());
      },

      getFinalPrice: () => get().getTotalPrice() - get().getDiscountAmount(),
    }),
    { name: "mtechbenin-cart" },
  ),
);

export default useCartStore;
