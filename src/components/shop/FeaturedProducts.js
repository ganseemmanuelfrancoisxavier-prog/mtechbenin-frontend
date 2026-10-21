"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "./ProductCard";
import useProductStore from "@/store/productStore";

export default function FeaturedProducts() {
  const [mounted, setMounted] = useState(false);
  const carouselRef = useRef(null);
  const reduceMotion = useReducedMotion();

  const { featuredProducts, fetchFeaturedProducts } = useProductStore();

  const scrollCarousel = (direction) => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    carousel.scrollBy({
      left: direction * carousel.clientWidth * 0.8,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  };

  useEffect(() => {
    setMounted(true);
    fetchFeaturedProducts();
  }, []);

  const featured = featuredProducts.filter((p) => p.active && p.featured);

  // Skeleton pendant le chargement
  if (!mounted) {
    return (
      <section className="mx-auto max-w-7xl px-5 py-12 sm:py-14">
        <div className="flex items-end justify-between mb-7">
          <div>
            <div className="h-3 bg-black/[0.05] rounded-full w-20 mb-3 animate-pulse" />
            <div className="h-8 bg-black/[0.05] rounded-full w-48 animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="glass-card rounded-3xl overflow-hidden animate-pulse"
            >
              <div className="bg-black/[0.05] aspect-square" />
              <div className="p-4 space-y-2">
                <div className="h-3 bg-black/[0.05] rounded-full w-3/4" />
                <div className="h-4 bg-black/[0.05] rounded-full w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (featured.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-5 pt-12 pb-8 sm:pt-14">
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-2">
            Sélection
          </p>
          <h2 className="font-display font-black text-3xl md:text-4xl text-apple-black tracking-tight">
            Nos Coups de Cœur
          </h2>
        </div>
        <Link
          href="/catalogue"
          className="hidden md:flex items-center gap-1 text-[13px] font-medium text-apple-mid hover:text-apple-black transition-colors duration-200"
        >
          Voir tout <ChevronRight className="w-3.5 h-3.5" />
        </Link>
        {featured.length > 2 && (
          <div className="hidden sm:flex items-center gap-2">
            <button type="button" aria-label="Défiler les coups de cœur vers la gauche" onClick={() => scrollCarousel(-1)} className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-apple-black shadow-sm transition hover:bg-black/[0.04]">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button type="button" aria-label="Défiler les coups de cœur vers la droite" onClick={() => scrollCarousel(1)} className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-apple-black shadow-sm transition hover:bg-black/[0.04]">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div ref={carouselRef} className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain px-5 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Carrousel des coups de cœur">
        {featured.map((product, index) => (
          <motion.div
            key={product.id}
            initial={reduceMotion ? false : { opacity: 0, x: 42 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.48, delay: reduceMotion ? 0 : index * 0.06, ease: [0.22, 1, 0.36, 1] }}
            className="w-[76%] shrink-0 snap-start sm:w-[42%] md:w-[31%] lg:w-[24%]"
          >
            <ProductCard product={product} featuredCta />
          </motion.div>
        ))}
      </div>

      <div className="mt-8 text-center md:hidden">
        <Link
          href="/catalogue"
          className="inline-flex items-center gap-2 btn-glass text-sm px-6 py-3"
        >
          Voir tous les produits <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
