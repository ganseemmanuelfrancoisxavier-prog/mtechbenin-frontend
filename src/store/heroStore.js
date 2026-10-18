import { create } from "zustand";
import { persist } from "zustand/middleware";
import apiFetch from "@/lib/api";

const heroApiLocal = {
  getActive: () => apiFetch("/api/hero"),
  getAll: () => apiFetch("/api/hero/all"),
  create: (data) =>
    apiFetch("/api/hero", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) =>
    apiFetch(`/api/hero/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  toggle: (id) => apiFetch(`/api/hero/${id}/toggle`, { method: "PATCH" }),
  delete: (id) => apiFetch(`/api/hero/${id}`, { method: "DELETE" }),
};

const initialMedias = [
  {
    id: 1,
    type: "gradient",
    active: true,
    order: 1,
    tag: "Nouveauté",
    title: "AirPods Pro",
    subtitle: "2ème Génération",
    description:
      "Audio spatial personnalisé. Réduction de bruit active. Livraison express à Cotonou.",
    cta: "Découvrir",
    href: "/catalogue/ecouteurs",
    badge: "À partir de 9 750 FCFA",
    bg: "from-[#0A0A0A] via-[#1a1a2e] to-[#0f3460]",
    url: "",
    categoryKey: "ecouteurs",
  },
  {
    id: 2,
    type: "gradient",
    active: true,
    order: 2,
    tag: "Best Seller",
    title: "JBL Boombox",
    subtitle: "4ème Génération",
    description:
      "Son puissant, basses profondes. La référence des enceintes Bluetooth au Bénin.",
    cta: "Voir les enceintes",
    href: "/catalogue/enceintes",
    badge: "Authentique & Garanti",
    bg: "from-[#0f0f0f] via-[#1a1a1a] to-[#2d2d2d]",
    url: "",
    categoryKey: "enceintes",
  },
  {
    id: 3,
    type: "gradient",
    active: true,
    order: 3,
    tag: "Digital",
    title: "Abonnements",
    subtitle: "Netflix · Spotify · Apple Music",
    description:
      "Accédez à vos plateformes préférées au meilleur prix. Activation en quelques minutes.",
    cta: "Voir les abonnements",
    href: "/abonnements",
    badge: "Dès 3 000 FCFA/mois",
    bg: "from-[#0a0a2e] via-[#0f1a3d] to-[#1D72B8]",
    url: "",
    categoryKey: "abonnements",
  },
];

const useHeroStore = create(
  persist(
    (set, get) => ({
      medias: initialMedias,
      _hasHydrated: false,
      _lastFetch: null,

      setHasHydrated: (state) => set({ _hasHydrated: state }),

      fetchHero: async () => {
        try {
          const now = Date.now();
          if (get()._lastFetch && now - get()._lastFetch < 5 * 60 * 1000)
            return;
          const data = await heroApiLocal.getActive();
          if (data.medias?.length > 0) {
            set({ medias: data.medias, _lastFetch: now });
          }
        } catch (err) {
          console.error("Erreur fetchHero", err.message);
        }
      },

      addMedia: async (media) => {
        try {
          const data = await heroApiLocal.create(media);
          set((state) => ({
            medias: [
              ...state.medias,
              data.media || {
                ...media,
                id: Date.now(),
                order: state.medias.length + 1,
              },
            ],
          }));
        } catch {
          set((state) => ({
            medias: [
              ...state.medias,
              { ...media, id: Date.now(), order: state.medias.length + 1 },
            ],
          }));
        }
      },

      updateMedia: async (id, data) => {
        try {
          await heroApiLocal.update(id, data);
        } catch (err) {
          console.error("Erreur updateMedia", err.message);
        }
        set((state) => ({
          medias: state.medias.map((m) =>
            m.id === id ? { ...m, ...data } : m,
          ),
        }));
      },

      deleteMedia: async (id) => {
        try {
          await heroApiLocal.delete(id);
        } catch (err) {
          console.error("Erreur deleteMedia", err.message);
        }
        set((state) => ({
          medias: state.medias
            .filter((m) => m.id !== id)
            .map((m, i) => ({ ...m, order: i + 1 })),
        }));
      },

      toggleMedia: async (id) => {
        try {
          await heroApiLocal.toggle(id);
        } catch (err) {
          console.error("Erreur toggleMedia", err.message);
        }
        set((state) => ({
          medias: state.medias.map((m) =>
            m.id === id ? { ...m, active: !m.active } : m,
          ),
        }));
      },

      moveMedia: async (id, direction) => {
        const medias = [...get().medias].sort((a, b) => a.order - b.order);
        const index = medias.findIndex((m) => m.id === id);
        const swapIdx = direction === "up" ? index - 1 : index + 1;
        if (swapIdx < 0 || swapIdx >= medias.length) return;
        const newOrder = medias[swapIdx].order;
        medias[swapIdx].order = medias[index].order;
        medias[index].order = newOrder;
        set({ medias });
        try {
          await heroApiLocal.update(id, { order: medias[index].order });
          await heroApiLocal.update(medias[swapIdx].id, {
            order: medias[swapIdx].order,
          });
        } catch (err) {
          console.error("Erreur moveMedia", err.message);
        }
      },

      getActiveMedias: () =>
        get()
          .medias.filter((m) => m.active)
          .sort((a, b) => a.order - b.order),
    }),
    {
      name: "mtechbenin-hero",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

export default useHeroStore;
