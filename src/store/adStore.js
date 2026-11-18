import { create } from "zustand";
import { persist } from "zustand/middleware";
import { adsApi } from "@/lib/api";

let adsFetchPromise = null;

const useAdStore = create(
  persist(
    (set, get) => ({
      ads: [],
      loading: false,
      error: null,
      _lastFetch: null,

      fetchAds: async (force = false) => {
        const now = Date.now();
        if (
          !force &&
          get()._lastFetch &&
          now - get()._lastFetch < 5 * 60 * 1000
        ) {
          return;
        }
        if (adsFetchPromise) return adsFetchPromise;

        adsFetchPromise = (async () => {
          set({ loading: true, error: null });
          try {
            const data = await adsApi.getActive();
            set({
              ads: Array.isArray(data.ads) ? data.ads : [],
              _lastFetch: Date.now(),
              loading: false,
            });
          } catch (err) {
            console.error("Erreur fetchAds", err.message);
            set({ loading: false, error: err.message || "Erreur de chargement" });
          } finally {
            adsFetchPromise = null;
          }
        })();

        return adsFetchPromise;
      },
    }),
    {
      name: "mtechbenin-ads",
      // Hydrate after the first render to keep server and browser markup aligned.
      skipHydration: true,
      partialize: (state) => ({
        ads: state.ads,
        _lastFetch: state._lastFetch,
      }),
    },
  ),
);

export default useAdStore;
