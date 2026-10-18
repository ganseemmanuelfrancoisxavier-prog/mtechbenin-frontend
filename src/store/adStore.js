import { create } from "zustand";
import { adsApi } from "@/lib/api";

// Calque de clientMediaStore. Point important : on range l'objet reçu TEL QUEL,
// sans recopier les champs un à un. Un normaliseur champ par champ fait
// disparaître silencieusement de l'affichage tout champ qu'on oublie d'y
// ajouter, même quand l'API le renvoie correctement — c'est exactement ce qui
// est arrivé aux descriptions de formules d'abonnement.
const useAdStore = create((set, get) => ({
  ads: [],
  loading: false,
  error: null,
  _lastFetch: null,

  fetchAds: async (force = false) => {
    const now = Date.now();
    if (!force && get()._lastFetch && now - get()._lastFetch < 5 * 60 * 1000) {
      return;
    }
    set({ loading: true, error: null });
    try {
      const data = await adsApi.getActive();
      set({
        ads: Array.isArray(data.ads) ? data.ads : [],
        _lastFetch: now,
        loading: false,
      });
    } catch (err) {
      console.error("Erreur fetchAds", err.message);
      set({ loading: false, error: err.message || "Erreur de chargement" });
    }
  },
}));

export default useAdStore;
