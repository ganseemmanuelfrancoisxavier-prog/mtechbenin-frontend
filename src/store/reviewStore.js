import { create } from "zustand";
import { persist } from "zustand/middleware";
import apiFetch from "@/lib/api";

const reviewsApiLocal = {
  getBySlug: (slug) => apiFetch(`/api/reviews/${slug}`),
  getFeatured: () => apiFetch("/api/reviews/featured"),
  create: (data) =>
    apiFetch("/api/reviews", { method: "POST", body: JSON.stringify(data) }),
  approve: (id) =>
    apiFetch(`/api/reviews/admin/${id}/approve`, { method: "PATCH" }),
  featured: (id) =>
    apiFetch(`/api/reviews/admin/${id}/featured`, { method: "PATCH" }),
  delete: (id) => apiFetch(`/api/reviews/admin/${id}`, { method: "DELETE" }),
};

const initialReviews = [
  {
    id: 1,
    productSlug: "airpod-pro-2",
    productName: "AirPod Pro 2ème génération",
    name: "Koffi Mensah",
    city: "Cotonou",
    rating: 5,
    text: "Livraison ultra rapide ! J'ai reçu mes AirPods Pro en moins de 2h.",
    date: "Mai 2026",
    approved: true,
    featured: true,
  },
  {
    id: 2,
    productSlug: "netflix",
    productName: "Netflix Premium",
    name: "Aïcha Dossou",
    city: "Abomey-Calavi",
    rating: 5,
    text: "Mon abonnement Netflix activé en 5 minutes. Service impeccable !",
    date: "Mai 2026",
    approved: true,
    featured: true,
  },
  {
    id: 3,
    productSlug: "jbl-boombox-4",
    productName: "JBL Boombox 4ème génération",
    name: "Rodrigue Agossou",
    city: "Cotonou",
    rating: 5,
    text: "La JBL Boombox est authentique, son incroyable.",
    date: "Avril 2026",
    approved: true,
    featured: true,
  },
];

const useReviewStore = create(
  persist(
    (set, get) => ({
      reviews: initialReviews,
      totalApprouves: 0,
      _lastFetch: {},

      // ── Charge les avis d'un produit depuis l'API ─────────────────────────
      fetchReviewsBySlug: async (slug) => {
        try {
          const now = Date.now();
          if (
            get()._lastFetch[slug] &&
            now - get()._lastFetch[slug] < 5 * 60 * 1000
          )
            return;
          const data = await reviewsApiLocal.getBySlug(slug);
          if (data.reviews) {
            // Remplace les avis locaux de ce produit par ceux de l'API
            set((state) => ({
              reviews: [
                ...state.reviews.filter((r) => r.productSlug !== slug),
                ...data.reviews,
              ],
              _lastFetch: { ...state._lastFetch, [slug]: now },
            }));
          }
        } catch (err) {
          console.error("Erreur fetchReviewsBySlug", err.message);
        }
      },

      // ── Charge les avis featured depuis l'API ─────────────────────────────
      fetchFeaturedReviews: async () => {
        try {
          const data = await reviewsApiLocal.getFeatured();
          if (data.reviews?.length > 0) {
            set((state) => ({
              reviews: [
                ...state.reviews.filter((r) => !r.featured),
                ...data.reviews,
              ],
            }));
          }
          // Sert à décider si le bouton « Voir tous les avis » a quelque chose
          // de plus à montrer que les avis à la une déjà affichés.
          if (typeof data.totalApprouves === "number") {
            set({ totalApprouves: data.totalApprouves });
          }
        } catch (err) {
          console.error("Erreur fetchFeaturedReviews", err.message);
        }
      },

      // ── Client — soumettre un avis ────────────────────────────────────────
      // L'erreur est propagée : elle était avalée, et l'écran annonçait
      // « Avis envoyé ! » alors que rien n'avait été enregistré.
      addReview: async (review) => {
        await reviewsApiLocal.create(review);
        set((state) => ({
          reviews: [
            ...state.reviews,
            {
              ...review,
              id: Date.now(),
              date: new Date().toLocaleDateString("fr-FR", {
                month: "long",
                year: "numeric",
              }),
              approved: false,
              featured: false,
            },
          ],
        }));
      },

      // ── Admin ─────────────────────────────────────────────────────────────
      approveReview: async (id) => {
        try {
          await reviewsApiLocal.approve(id);
        } catch {}
        set((state) => ({
          reviews: state.reviews.map((r) =>
            r.id === id ? { ...r, approved: true } : r,
          ),
        }));
      },

      rejectReview: async (id) => {
        try {
          await reviewsApiLocal.delete(id);
        } catch {}
        set((state) => ({ reviews: state.reviews.filter((r) => r.id !== id) }));
      },

      toggleFeatured: async (id) => {
        try {
          await reviewsApiLocal.featured(id);
        } catch {}
        set((state) => ({
          reviews: state.reviews.map((r) =>
            r.id === id ? { ...r, featured: !r.featured } : r,
          ),
        }));
      },

      // ── Getters ───────────────────────────────────────────────────────────
      getReviewsByProduct: (slug) =>
        get().reviews.filter((r) => r.productSlug === slug && r.approved),
      getFeaturedReviews: () =>
        get().reviews.filter((r) => r.approved && r.featured),
      getPendingReviews: () => get().reviews.filter((r) => !r.approved),
      getAverageRating: (slug) => {
        const reviews = get().reviews.filter(
          (r) => r.productSlug === slug && r.approved,
        );
        if (!reviews.length) return 0;
        return reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
      },
    }),
    { name: "mtechbenin-reviews" },
  ),
);

export default useReviewStore;
