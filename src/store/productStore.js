import { create } from "zustand";
import { persist } from "zustand/middleware";
import { productsApi } from "@/lib/api";

const useProductStore = create(
  persist(
    (set, get) => ({
      products: [],
      featuredProducts: [],
      _featuredLastFetch: null,
      _hasHydrated: false,
      _lastFetch: null,
      loading: false,
      error: null,

      setHasHydrated: (state) => set({ _hasHydrated: state }),

      // ── Charge les produits depuis l'API (site public — actifs uniquement) ─
      fetchProducts: async (force = false) => {
        try {
          const now = Date.now();
          if (
            !force &&
            get()._lastFetch &&
            now - get()._lastFetch < 5 * 60 * 1000
          )
            return;

          set({ loading: true, error: null });

          // Pas de includeInactive ici → backend filtre active=true par défaut
          const data = await productsApi.getAll({ limit: 500, active: "true" });

          if (data.products && data.products.length > 0) {
            const normalized = data.products
              // Filtre défensif côté client au cas où
              .filter((p) => p.active !== false)
              .map((p) => ({
                id: p.id,
                name: p.name,
                slug: p.slug,
                image: Array.isArray(p.images) ? p.images[0] : p.images,
                images: Array.isArray(p.images)
                  ? p.images
                  : [p.images].filter(Boolean),
                price: p.price,
                comparePrice: p.comparePrice || null,
                status: p.status || "En stock",
                category: p.categorySlug,
                active: p.active,
                featured: p.featured,
                description: p.description || "",
                specs: Array.isArray(p.specs) ? p.specs : [],
                salesCount: p.salesCount || 0,
                hasRequiredVariants: p.hasRequiredVariants || false,
                stock: p.stock || 0,
                videoUrl: p.videoUrl || null,
              }));
            set({ products: normalized, _lastFetch: now });
          }
          set({ loading: false });
        } catch (err) {
          console.error("Erreur chargement produits API", err.message);
          set({ loading: false, error: err.message || "Erreur de chargement" });
        }
      },

      // La page d'accueil ne rapatrie que les produits mis en avant. Le
      // catalogue complet reste chargé à la demande sur ses propres pages.
      fetchFeaturedProducts: async (force = false) => {
        const now = Date.now();
        if (!force && get()._featuredLastFetch && now - get()._featuredLastFetch < 5 * 60 * 1000) return;
        try {
          const data = await productsApi.getAll({ limit: 8, active: "true", featured: "true" });
          const normalized = (data.products || []).filter((p) => p.active !== false).map((p) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            image: Array.isArray(p.images) ? p.images[0] : p.images,
            images: Array.isArray(p.images) ? p.images : [p.images].filter(Boolean),
            price: p.price,
            comparePrice: p.comparePrice || null,
            status: p.status || "En stock",
            category: p.categorySlug,
            active: p.active,
            featured: p.featured,
            description: p.description || "",
            specs: Array.isArray(p.specs) ? p.specs : [],
            salesCount: p.salesCount || 0,
            hasRequiredVariants: p.hasRequiredVariants || false,
            stock: p.stock || 0,
            videoUrl: p.videoUrl || null,
          }));
          set({ featuredProducts: normalized, _featuredLastFetch: now });
        } catch (err) {
          console.error("Erreur chargement produits mis en avant", err.message);
        }
      },

      // ── Reset — vide le cache (appelé à la sortie de l'admin) ─────────────
      reset: () => set({ products: [], _lastFetch: 0 }),

      // ── CRUD local (fallback admin uniquement) ────────────────────────────
      addProduct: (product) =>
        set((state) => ({
          products: [...state.products, { ...product, id: Date.now() }],
        })),

      updateProduct: (id, data) =>
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id ? { ...p, ...data } : p,
          ),
        })),

      deleteProduct: (id) =>
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
        })),

      toggleProduct: (id) =>
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id ? { ...p, active: !p.active } : p,
          ),
        })),

      // ── Getters — filtre active=true systématiquement ─────────────────────
      getActiveProducts: (activeCategories) => {
        const activeSlugs = activeCategories.map((c) => c.slug);
        return get().products.filter(
          (p) => p.active && activeSlugs.includes(p.category),
        );
      },

      getFeaturedProducts: (activeCategories) => {
        const activeSlugs = activeCategories.map((c) => c.slug);
        return get().products.filter(
          (p) => p.active && p.featured && activeSlugs.includes(p.category),
        );
      },

      getProductsByCategory: (categorySlug) =>
        get().products.filter((p) => p.active && p.category === categorySlug),
    }),
    {
      name: "mtechbenin-products",
      // v1 : ajout de `hasRequiredVariants` sur chaque produit normalisé. Un
      // cache antérieur à cette version n'a pas ce champ (donc `undefined`,
      // traité comme `false` par ProductCard) — sans ce bump, un visiteur
      // dont le cache a moins de 5 min réhydrate l'ancienne liste après un
      // déploiement, et les vignettes à caractéristique obligatoire
      // réaffichent des boutons d'achat direct. Pas de `migrate` : on veut
      // que ce cache soit jeté, pas transformé — les vraies données n'ont
      // de toute façon jamais été perdues, elles vivent en base.
      version: 1,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

export default useProductStore;
