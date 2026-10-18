import { create } from "zustand";
import { clientMediaApi } from "@/lib/api";

const useClientMediaStore = create((set, get) => ({
  medias: [],
  loading: false,
  error: null,
  _lastFetch: null,

  fetchMedias: async (force = false) => {
    const now = Date.now();
    if (!force && get()._lastFetch && now - get()._lastFetch < 5 * 60 * 1000) {
      return;
    }
    set({ loading: true, error: null });
    try {
      const data = await clientMediaApi.getActive();
      set({
        medias: Array.isArray(data.medias) ? data.medias : [],
        _lastFetch: now,
        loading: false,
      });
    } catch (err) {
      console.error("Erreur fetchMedias", err.message);
      set({ loading: false, error: err.message || "Erreur de chargement" });
    }
  },
}));

export default useClientMediaStore;
