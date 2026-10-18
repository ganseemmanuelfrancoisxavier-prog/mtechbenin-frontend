import { create } from "zustand";
import { persist } from "zustand/middleware";
import { categories as initialCategories } from "@/lib/categories";
import apiFetch from "@/lib/api";

const categoriesApi = {
  getAll: () => apiFetch("/api/categories"),
  create: (data) =>
    apiFetch("/api/categories", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) =>
    apiFetch(`/api/categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  delete: (id) => apiFetch(`/api/categories/${id}`, { method: "DELETE" }),
};

const useCategoryStore = create(
  persist(
    (set, get) => ({
      categories: initialCategories,
      _hasHydrated: false,
      _lastFetch: null,

      setHasHydrated: (state) => set({ _hasHydrated: state }),

      fetchCategories: async () => {
        try {
          const now = Date.now();
          if (get()._lastFetch && now - get()._lastFetch < 5 * 60 * 1000)
            return;
          const data = await categoriesApi.getAll();
          if (data.categories?.length > 0) {
            const normalized = data.categories.map((c) => ({
              id: c.id,
              slug: c.slug,
              name: c.name,
              label: c.label || c.name,
              icon: c.icon || "📦",
              sortOrder: c.sortOrder || 0,
              active: c.active,
            }));
            set({ categories: normalized, _lastFetch: now });
          }
        } catch (err) {
          console.error("Erreur fetchCategories", err.message);
        }
      },

      addCategory: async (category) => {
        try {
          const data = await categoriesApi.create(category);
          set((state) => ({
            categories: [
              ...state.categories,
              {
                ...data.category,
                label: data.category.label || data.category.name,
              },
            ],
          }));
        } catch {
          set((state) => ({
            categories: [...state.categories, { ...category, id: Date.now() }],
          }));
        }
      },

      updateCategory: async (id, data) => {
        try {
          await categoriesApi.update(id, data);
        } catch (err) {
          console.error("Erreur updateCategory", err.message);
        }
        set((state) => ({
          categories: state.categories.map((c) =>
            c.id === id ? { ...c, ...data } : c,
          ),
        }));
      },

      deleteCategory: async (id) => {
        try {
          await categoriesApi.delete(id);
        } catch (err) {
          console.error("Erreur deleteCategory", err.message);
        }
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id),
        }));
      },

      toggleCategory: async (id) => {
        const cat = get().categories.find((c) => c.id === id);
        if (!cat) return;
        try {
          await categoriesApi.update(id, { active: !cat.active });
        } catch (err) {
          console.error("Erreur toggleCategory", err.message);
        }
        set((state) => ({
          categories: state.categories.map((c) =>
            c.id === id ? { ...c, active: !c.active } : c,
          ),
        }));
      },

      getActiveCategories: () =>
        get()
          .categories.filter((c) => c.active)
          .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
      getCategoryLabel: (slug) =>
        get().categories.find((c) => c.slug === slug)?.label || slug,
    }),
    {
      name: "mtechbenin-categories",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

export default useCategoryStore;
