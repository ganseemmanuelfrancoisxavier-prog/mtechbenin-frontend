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
    let cancelled = false;
    const timeoutId = window.setTimeout(() => {
      if (!cancelled) setReady(true);
    }, 12000);

    const initialData = [
      useCategoryStore.getState().fetchCategories(),
      useHeroStore.getState().fetchHero(),
      useAbonnementStore.getState().fetchServices(),
      useProductStore.getState().fetchFeaturedProducts(),
      useReviewStore.getState().fetchFeaturedReviews(),
      useAdStore.getState().fetchAds(),
      useClientMediaStore.getState().fetchMedias(),
    ];

    Promise.allSettled(initialData).finally(() => {
      window.clearTimeout(timeoutId);
      if (!cancelled) setReady(true);
    });

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
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
