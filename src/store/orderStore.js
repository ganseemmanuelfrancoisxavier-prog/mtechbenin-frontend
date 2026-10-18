import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ordersApi } from "@/lib/api";

const useOrderStore = create(
  persist(
    (set, get) => ({
      orders: [],
      _lastFetch: null,

      // ── Charge les commandes depuis l'API (admin) ─────────────────────────
      fetchOrders: async () => {
        try {
          const now = Date.now();
          if (get()._lastFetch && now - get()._lastFetch < 60 * 1000) return;

          const data = await ordersApi.getAll({ limit: 250 });
          if (data.orders) {
            const normalized = data.orders.map((o) => ({
              id: o.reference,
              client: {
                name: o.guestName,
                phone: o.guestWhatsapp,
              },
              items: (o.items || []).map((item) => ({
                name: item.productName,
                qty: item.quantity,
                price: item.unitPrice,
              })),
              total: o.total,
              status: o.status?.toLowerCase() || "confirmed",
              paymentMethod: o.payment?.method || "Mobile Money",
              paymentStatus:
                o.payment?.status === "CONFIRMED" ? "paid" : "pending",
              address: [o.neighborhood, o.city].filter(Boolean).join(", "),
              note: o.instructions || "",
              date: o.createdAt,
              email: o.guestEmail || "",
              isGift: o.isGift,
              giftName: o.giftName || "",
              giftWhatsapp: o.giftWhatsapp || "",
              deliverySlot: o.deliverySlot || "",
              deliveryFee: o.deliveryFee || 0,
              feeAmount: o.feeAmount || 0,
              discount: o.discount || 0,
            }));
            set({ orders: normalized, _lastFetch: now });
          }
        } catch (err) {
          console.error("Erreur chargement commandes API", err.message);
        }
      },

      // ── Ajouter une commande locale (après paiement checkout) ─────────────
      addOrder: (order) =>
        set((state) => ({
          orders: [
            {
              ...order,
              id:
                order.id ||
                `MTECH-2026-${Math.floor(10000 + Math.random() * 90000)}`,
              status: "confirmed",
              paymentStatus: "paid",
              date: new Date().toISOString(),
            },
            ...state.orders,
          ],
          _lastFetch: null, // force refetch au prochain fetchOrders
        })),

      // ── Changer le statut (admin) ─────────────────────────────────────────
      updateOrderStatus: async (id, status) => {
        try {
          await ordersApi.updateStatus(id, status.toUpperCase());
        } catch (err) {
          console.error("Erreur updateOrderStatus", err.message);
        }
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === id
              ? { ...o, status, updatedAt: new Date().toISOString() }
              : o,
          ),
        }));
      },

      // ── Modifier une note interne ─────────────────────────────────────────
      updateOrderNote: (id, note) =>
        set((state) => ({
          orders: state.orders.map((o) => (o.id === id ? { ...o, note } : o)),
        })),

      // ── Supprimer une commande locale ─────────────────────────────────────
      deleteOrder: (id) =>
        set((state) => ({
          orders: state.orders.filter((o) => o.id !== id),
        })),

      // ── Getters ───────────────────────────────────────────────────────────
      getOrderById: (id) => get().orders.find((o) => o.id === id) || null,
      getOrdersByStatus: (status) =>
        get().orders.filter((o) => o.status === status),
    }),
    { name: "mtechbenin-orders" },
  ),
);

export default useOrderStore;
