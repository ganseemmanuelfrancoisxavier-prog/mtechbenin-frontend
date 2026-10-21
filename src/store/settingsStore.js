import { create } from "zustand";
import { persist } from "zustand/middleware";
import { settingsApi } from "@/lib/api";

const initialZones = [
  { id: 1, name: "Cotonou", fee: 1000, delay: "2-4h", active: true },
  { id: 2, name: "Abomey-Calavi", fee: 1500, delay: "3-6h", active: true },
  { id: 3, name: "Porto-Novo", fee: 2000, delay: "24h", active: true },
  { id: 4, name: "Parakou", fee: 5000, delay: "48h", active: false },
];

const useSettingsStore = create(
  persist(
    (set, get) => ({
      // ── Infos boutique ────────────────────────────────────────────────────
      shopName: "MTECHBENIN",
      shopSlogan:
        "Votre boutique tech de confiance au Bénin. Livraison express à Cotonou.",
      shopEmail: "contact@mtechbenin.com",
      shopWhatsapp: "+229 61 15 15 61",
      shopAddress: "Cotonou, Bénin",
      shopFacebook: "https://facebook.com/mtechbenin",
      shopInstagram: "https://instagram.com/mtechbenin",
      shopTiktok: "https://tiktok.com/@mtechbenin",

      // ── FedaPay ───────────────────────────────────────────────────────────
      fedapayPublicKey: "",
      fedapayEnv: "live",

      // ── Frais de paiement ─────────────────────────────────────────────────
      paymentFeePercent: 2.9,

      // ── Maintenance ───────────────────────────────────────────────────────
      maintenanceMode: false,
      maintenanceMessage: "Site en maintenance. Nous revenons très bientôt !",

      // ── Zones livraison ───────────────────────────────────────────────────
      zones: initialZones,

      // ── Charge les paramètres depuis l'API ────────────────────────────────
      fetchSettings: async () => {
        try {
          const data = await settingsApi.getPublic();
          const s = data.settings || {};
          const updates = {};

          if (s.shopName) updates.shopName = s.shopName;
          if (s.shopSlogan) updates.shopSlogan = s.shopSlogan;
          if (s.shopEmail) updates.shopEmail = s.shopEmail;
          if (s.shopWhatsapp) updates.shopWhatsapp = s.shopWhatsapp;
          if (s.shopAddress) updates.shopAddress = s.shopAddress;
          if (s.shopFacebook) updates.shopFacebook = s.shopFacebook;
          if (s.shopInstagram) updates.shopInstagram = s.shopInstagram;
          if (s.shopTiktok) updates.shopTiktok = s.shopTiktok;
          if (s.fedapayPublicKey) updates.fedapayPublicKey = s.fedapayPublicKey;
          if (s.fedapayEnv) updates.fedapayEnv = s.fedapayEnv;
          if (s.paymentFeePercent)
            updates.paymentFeePercent = Number(s.paymentFeePercent);
          if (s.maintenanceMode)
            updates.maintenanceMode = s.maintenanceMode === "true";
          if (s.maintenanceMessage)
            updates.maintenanceMessage = s.maintenanceMessage;

          if (Object.keys(updates).length > 0) set(updates);
        } catch (err) {
          console.error("Erreur fetchSettings", err.message);
        }
      },

      // ── Sauvegarde les paramètres en base ─────────────────────────────────
      saveSettings: async (data) => {
        try {
          await settingsApi.update(data);
        } catch (err) {
          console.error("Erreur saveSettings", err.message);
        }
      },

      // ── Actions boutique ──────────────────────────────────────────────────
      updateShopInfo: (data) => set((state) => ({ ...state, ...data })),

      // ── Actions FedaPay ───────────────────────────────────────────────────
      updateFedapay: (data) => set((state) => ({ ...state, ...data })),

      // ── Frais paiement ────────────────────────────────────────────────────
      setPaymentFeePercent: (value) =>
        set({ paymentFeePercent: Number(value) || 0 }),

      // ── Maintenance ───────────────────────────────────────────────────────
      setMaintenanceMode: (value) => set({ maintenanceMode: value }),
      setMaintenanceMessage: (msg) => set({ maintenanceMessage: msg }),

      // ── Zones ─────────────────────────────────────────────────────────────
      addZone: (zone) =>
        set((state) => ({
          zones: [
            ...state.zones,
            { ...zone, id: Date.now(), fee: Number(zone.fee), active: true },
          ],
        })),

      deleteZone: (id) =>
        set((state) => ({ zones: state.zones.filter((z) => z.id !== id) })),

      toggleZone: (id) =>
        set((state) => ({
          zones: state.zones.map((z) =>
            z.id === id ? { ...z, active: !z.active } : z,
          ),
        })),

      // ── Getters zones ─────────────────────────────────────────────────────
      getZoneByCity: (cityName) => {
        if (!cityName) return null;
        return (
          get().zones.find(
            (z) =>
              z.active &&
              z.name.toLowerCase().trim() === cityName.toLowerCase().trim(),
          ) || null
        );
      },

      getActiveCities: () =>
        get()
          .zones.filter((z) => z.active)
          .map((z) => z.name),
    }),
    {
      name: "mtechbenin-settings",
      version: 2,
      // Remove any password persisted by older versions from browser storage.
      migrate: (persistedState) => {
        if (persistedState && typeof persistedState === "object") {
          delete persistedState.adminPassword;
        }
        return persistedState;
      },
      partialize: (state) => {
        const safeState = { ...state };
        delete safeState.adminPassword;
        return safeState;
      },
    },
  ),
);

export default useSettingsStore;
