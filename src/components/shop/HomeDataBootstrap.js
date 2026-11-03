"use client";

import { useEffect, useState } from "react";
import useCategoryStore from "@/store/categoryStore";
import useHeroStore from "@/store/heroStore";
import useAbonnementStore from "@/store/abonnementStore";
import useProductStore from "@/store/productStore";
import useReviewStore from "@/store/reviewStore";
import useAdStore from "@/store/adStore";
import useClientMediaStore from "@/store/clientMediaStore";

export default function HomeDataBootstrap({ children }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Load remote data in the background so a slow API cannot block the shop.
    void useCategoryStore.getState().fetchCategories();
    void useHeroStore.getState().fetchHero();
    void useAbonnementStore.getState().fetchServices();
    void useProductStore.getState().fetchFeaturedProducts();
    void useReviewStore.getState().fetchFeaturedReviews();
    void useAdStore.getState().fetchAds();
    void useClientMediaStore.getState().fetchMedias();
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <section
        className="flex min-h-[55vh] items-center justify-center"
        aria-busy="true"
        aria-live="polite"
      >
        <div className="flex flex-col items-center gap-3 text-neutral-500">
          <span
            aria-hidden="true"
            className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-800 motion-reduce:animate-none"
          />
          <p className="text-sm">Préparation de votre boutique…</p>
        </div>
      </section>
    );
  }

  return children;
}
