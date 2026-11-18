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

const initialMedias = [];

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
      version: 2,
      migrate: (persistedState) => {
        const legacySlides = new Set([
          "AirPods Pro",
          "JBL Boombox",
          "Abonnements",
        ]);
        const medias = Array.isArray(persistedState?.medias)
          ? persistedState.medias.filter(
              (media) =>
                !(typeof media.id === "number" && legacySlides.has(media.title)),
            )
          : [];
        const removedLegacySlides =
          medias.length !== (persistedState?.medias?.length || 0);

        return {
          ...persistedState,
          medias,
          _lastFetch: removedLegacySlides ? null : persistedState?._lastFetch,
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

export default useHeroStore;
