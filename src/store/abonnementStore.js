import { create } from "zustand";
import { persist } from "zustand/middleware";
import { services as initialServices } from "@/lib/abonnements";
import apiFetch from "@/lib/api";

const withDefaults = (services) =>
  services.map((s) => ({
    ...s,
    mediaType: s.mediaType || "gradient",
    mediaUrl: s.mediaUrl || "",
    mediaMuted: s.mediaMuted !== undefined ? s.mediaMuted : true,
    serviceStatus: s.serviceStatus || "active",
    maintenanceMessage:
      s.maintenanceMessage ||
      "Ce service est temporairement en maintenance. Revenez bientôt.",
    comingSoonMessage:
      s.comingSoonMessage ||
      "Ce service sera bientôt disponible. Restez connecté !",
    category: s.category || "family",
    totalPlaces: s.totalPlaces !== undefined ? s.totalPlaces : 0,
  }));
const DEFAULT_CATEGORY_ORDER = ["family", "link_access"];
const normalizeCategoryOrder = (order) =>
  Array.isArray(order) && order.length === 2 && new Set(order).size === 2 &&
  order.every((category) => DEFAULT_CATEGORY_ORDER.includes(category))
    ? order
    : DEFAULT_CATEGORY_ORDER;
let servicesFetchPromise = null;

const useAbonnementStore = create(
  persist(
    (set, get) => ({
      services: withDefaults(initialServices),
      categoryOrder: DEFAULT_CATEGORY_ORDER,
      _hasHydrated: false,
      _lastFetch: null,

      setHasHydrated: (state) => set({ _hasHydrated: state }),
      setCategoryOrder: (order) => set({ categoryOrder: normalizeCategoryOrder(order) }),

      // ── Charge les services depuis l'API ──────────────────────────────────
      fetchServices: async () => {
        const now = Date.now();
        if (get()._lastFetch && now - get()._lastFetch < 5 * 60 * 1000) return;
        if (servicesFetchPromise) return servicesFetchPromise;
        servicesFetchPromise = (async () => {
          try {
            const data = await apiFetch("/api/subscriptions");
            const categoryOrder = normalizeCategoryOrder(data.categoryOrder);
            set({ categoryOrder });
            if (data.services && data.services.length > 0) {
            const normalized = data.services.map((s) => ({
              // Champs API
              id: s.id,
              slug: s.slug,
              name: s.name,
              tagline: s.tagline || "",
              available: s.available,
              serviceStatus: s.serviceStatus || "active",
              maintenanceMessage:
                s.maintenanceMessage ||
                "Ce service est temporairement en maintenance. Revenez bientôt.",
              comingSoonMessage:
                s.comingSoonMessage ||
                "Ce service sera bientôt disponible. Restez connecté !",
              category: s.category || "family",
              totalPlaces: s.totalPlaces || 0,
              mediaType: s.mediaType || "gradient",
              mediaUrl: s.mediaUrl || "",
              mediaMuted: true,
              // Plans depuis l'API
              formules: (s.plans || []).map((p) => ({
                id: p.id,
                label: p.label,
                duration: p.duration,
                // Formule sans échéance. L'oublier ici ne casse RIEN de
                // visible : la fiche affiche la durée en mois de `duration`
                // (1 sur ces formules), propose le sélecteur de mois, et
                // c'est le serveur qui refuse la commande au dernier moment.
                // Le client ne comprend pas ce qui lui est reproché.
                aVie: !!p.aVie,
                price: p.price,
                // Avantages saisis dans le panel, une entrée par puce. Ce
                // normaliseur recopie les champs un à un : tout champ oublié
                // ici disparaît silencieusement de la fiche du service, même
                // si l'API le renvoie correctement.
                description: p.description || [],
              })),
              // Champs UI par défaut
              color: "from-gray-600 to-gray-900",
              lightColor: "bg-gray-50",
              textColor: "text-gray-600",
              borderColor: "border-gray-200",
              features: [],
              faq: [],
            }));
            set({ services: normalized, _lastFetch: now });
          }
          } catch (err) {
            console.error("Erreur chargement services API", err.message);
            // Garde les services locaux en fallback
          } finally {
            servicesFetchPromise = null;
          }
        })();
        return servicesFetchPromise;
      },

      // ── Visibilité ────────────────────────────────────────────────────────
      toggleService: (slug) =>
        set((state) => ({
          services: state.services.map((s) =>
            s.slug === slug ? { ...s, available: !s.available } : s,
          ),
        })),

      // ── Mise à jour générale ──────────────────────────────────────────────
      updateService: (slug, data) =>
        set((state) => ({
          services: state.services.map((s) =>
            s.slug === slug ? { ...s, ...data } : s,
          ),
        })),

      // ── Statut du service ─────────────────────────────────────────────────
      setServiceStatus: (slug, status) =>
        set((state) => ({
          services: state.services.map((s) =>
            s.slug === slug ? { ...s, serviceStatus: status } : s,
          ),
        })),

      setServiceStatusMessage: (slug, type, message) =>
        set((state) => ({
          services: state.services.map((s) => {
            if (s.slug !== slug) return s;
            if (type === "maintenance")
              return { ...s, maintenanceMessage: message };
            if (type === "coming_soon")
              return { ...s, comingSoonMessage: message };
            return s;
          }),
        })),

      // ── Catégorie ─────────────────────────────────────────────────────────
      setServiceCategory: (slug, category) =>
        set((state) => ({
          services: state.services.map((s) =>
            s.slug === slug ? { ...s, category } : s,
          ),
        })),

      // ── Places link_access ────────────────────────────────────────────────
      setTotalPlaces: (slug, total) =>
        set((state) => ({
          services: state.services.map((s) =>
            s.slug === slug ? { ...s, totalPlaces: Number(total) } : s,
          ),
        })),

      // ── Média ─────────────────────────────────────────────────────────────
      updateServiceMedia: (slug, mediaType, mediaUrl) =>
        set((state) => ({
          services: state.services.map((s) =>
            s.slug === slug ? { ...s, mediaType, mediaUrl } : s,
          ),
        })),

      toggleServiceMute: (slug) =>
        set((state) => ({
          services: state.services.map((s) =>
            s.slug === slug ? { ...s, mediaMuted: !s.mediaMuted } : s,
          ),
        })),

      // ── Ajouter un service ────────────────────────────────────────────────
      addService: (serviceData) =>
        set((state) => ({
          services: [
            ...state.services,
            {
              slug: serviceData.slug,
              name: serviceData.name,
              tagline: serviceData.tagline || "",
              color: serviceData.color || "from-gray-600 to-gray-900",
              lightColor: "bg-gray-50",
              textColor: "text-gray-600",
              borderColor: "border-gray-200",
              available: true,
              serviceStatus: "active",
              maintenanceMessage:
                "Ce service est temporairement en maintenance.",
              comingSoonMessage: "Ce service sera bientôt disponible.",
              category: serviceData.category || "family",
              totalPlaces: serviceData.totalPlaces || 0,
              mediaType: "gradient",
              mediaUrl: "",
              mediaMuted: true,
              formules: [],
              features: [],
              faq: [],
            },
          ],
        })),

      // ── Supprimer un service ──────────────────────────────────────────────
      deleteService: (slug) =>
        set((state) => ({
          services: state.services.filter((s) => s.slug !== slug),
        })),

      // ── Getters ───────────────────────────────────────────────────────────
      getActiveServices: () => {
        const order = normalizeCategoryOrder(get().categoryOrder);
        return get().services.filter((s) => s.available).sort(
          (a, b) => order.indexOf(a.category || "family") - order.indexOf(b.category || "family"),
        );
      },
      getServiceBySlug: (slug) => get().services.find((s) => s.slug === slug),
      getPublicServices: () => get().getActiveServices(),
    }),
    {
      name: "mtechbenin-abonnements",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

export default useAbonnementStore;
