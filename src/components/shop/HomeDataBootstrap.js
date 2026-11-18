"use client";

import { useEffect } from "react";
import useCategoryStore from "@/store/categoryStore";
import useHeroStore from "@/store/heroStore";
import useAbonnementStore from "@/store/abonnementStore";
import useProductStore from "@/store/productStore";
import useReviewStore from "@/store/reviewStore";
import useAdStore from "@/store/adStore";
import useClientMediaStore from "@/store/clientMediaStore";

export default function HomeDataBootstrap({ children }) {
  useEffect(() => {
    // Show the page immediately; remote data refreshes without blocking it.
    void useCategoryStore.getState().fetchCategories();
    void useHeroStore.getState().fetchHero();
    void useAbonnementStore.getState().fetchServices();
    void useProductStore.getState().fetchFeaturedProducts();
    void useReviewStore.getState().fetchFeaturedReviews();
    void useClientMediaStore.getState().fetchMedias();

    // Restore the last ads first so returning visitors see them while the API
    // refreshes in the background.
    void (async () => {
      try {
        await useAdStore.persist.rehydrate();
      } catch (error) {
        console.error("Erreur restauration annonces", error);
      }
      await useAdStore.getState().fetchAds();
    })();
  }, []);

  return children;
}
