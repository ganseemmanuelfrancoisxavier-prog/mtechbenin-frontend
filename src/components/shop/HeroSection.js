"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import useCategoryStore from "@/store/categoryStore";
import useAbonnementStore from "@/store/abonnementStore";
import useHeroStore from "@/store/heroStore";
import { categories as staticCategories } from "@/lib/categories";
import { services as staticServices } from "@/lib/abonnements";
import { urlVideoJouable, afficheVideo } from "@/lib/media";
import useVisibleVideo from "@/hooks/useVisibleVideo";

export default function HeroSection() {
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { getActiveCategories, fetchCategories } = useCategoryStore();
  const { getActiveServices, fetchServices } = useAbonnementStore();
  const { getActiveMedias, fetchHero } = useHeroStore();

  useEffect(() => {
    setMounted(true);
    fetchHero(); // ← slides depuis l'API
    fetchCategories(); // ← catégories depuis l'API
    fetchServices(); // ← services abonnements depuis l'API
  }, []);

  const activeCategories = mounted
    ? getActiveCategories()
    : staticCategories.filter((c) => c.active);

  const activeServices = mounted
    ? getActiveServices()
    : staticServices.filter((s) => s.available);

  const activeCategorySlugs = activeCategories.map((c) => c.slug);

  const slides = mounted
    ? getActiveMedias().filter((slide) => {
        if (!slide.categoryKey) return true;
        if (slide.categoryKey === "abonnements")
          return activeServices.length > 0;
        return activeCategorySlugs.includes(slide.categoryKey);
      })
    : staticCategories
        .filter((c) => c.active)
        .slice(0, 3)
        .map((c, i) => ({
          id: i,
          type: "gradient",
          active: true,
          title: c.label,
          subtitle: "",
          description: "",
          cta: "Découvrir",
          href: `/catalogue/${c.slug}`,
          badge: "",
          bg: "from-[#0A0A0A] via-[#1a1a2e] to-[#0f3460]",
          tag: "Collection",
          categoryKey: c.slug,
        }));

  const safeIndex = slides.length === 0 ? 0 : current % slides.length;
  const activeSlide = slides[safeIndex];
  const heroVideo = useVisibleVideo({
    enabled: mounted && activeSlide?.type === "video",
    identity: activeSlide?.id ?? safeIndex,
  });

  const goNext = useCallback(() => {
    if (isAnimating || slides.length <= 1) return;
    setIsAnimating(true);
    setCurrent((prev) => (prev + 1) % slides.length);
    setTimeout(() => setIsAnimating(false), 500);
  }, [isAnimating, slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(goNext, 8000);
    return () => clearInterval(timer);
  }, [goNext, slides.length]);

  // Skeleton pendant le chargement initial
  if (!mounted) {
    return (
      <section className="relative w-full min-h-[92vh] md:min-h-[85vh] flex items-center overflow-hidden bg-gradient-to-br from-[#0A0A0A] via-[#1a1a2e] to-[#0f3460]">
        <div className="relative z-10 max-w-7xl mx-auto px-5 w-full py-20">
          <div className="animate-pulse space-y-4">
            <div className="h-5 bg-white/10 rounded-full w-32" />
            <div className="h-16 bg-white/10 rounded-2xl w-64" />
            <div className="h-8  bg-white/10 rounded-xl  w-48" />
            <div className="h-4  bg-white/10 rounded-full w-80 mt-4" />
            <div className="h-4  bg-white/10 rounded-full w-64" />
            <div className="flex gap-3 mt-6">
              <div className="h-12 bg-white/10 rounded-2xl w-36" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (slides.length === 0) return null;

  const slide = slides[safeIndex];

  return (
    <section className="relative w-full min-h-[92vh] md:min-h-[85vh] flex items-center overflow-hidden">
      {/* Fond */}
      <div
        className={`absolute inset-0 transition-all duration-700 ${
          slide.type === "gradient"
            ? `bg-gradient-to-br ${slide.bg}`
            : "bg-black"
        }`}
      >
        {slide.type === "image" && slide.url && (
          <Image
            src={slide.url}
            alt={slide.title}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        )}
        {slide.type === "video" && slide.url && (
          <video
            // Sans `key`, React réutilise le MÊME nœud d'un slide à l'autre et
            // se contente d'échanger `src`. Mesuré en production : à la
            // bascule, `currentTime` passait de 8,2 s à 8,7 s au lieu de
            // repartir de zéro. Une vidéo plus courte que la précédente
            // démarrait donc après sa propre fin — à l'arrêt, avec le bouton
            // de lecture du navigateur par-dessus. Une `key` par slide force
            // un élément neuf, dont le drapeau de lecture automatique est
            // remis à zéro.
            key={slide.id ?? safeIndex}
            ref={heroVideo.ref}
            src={heroVideo.selected ? urlVideoJouable(slide.url) : undefined}
            // Première image servie en JPEG par Cloudinary : sans elle, le
            // hero reste noir le temps que la vidéo se décode.
            poster={afficheVideo(slide.url)}
            autoPlay={heroVideo.selected && !heroVideo.reducedMotion}
            muted
            loop
            playsInline
            preload="none"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        {(slide.type === "image" || slide.type === "video") && (
          <div className="absolute inset-0 bg-black/50" />
        )}
      </div>

      {/* Effets de fond */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/[0.03] rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-20 w-80 h-80 bg-white/[0.02] rounded-full blur-3xl" />
      </div>

      {/* Contenu */}
      <div className="relative z-10 max-w-7xl mx-auto px-5 w-full py-20">
        <div
          className={`transition-all duration-500 ${isAnimating ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"}`}
        >
          {slide.tag && (
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6"
              style={{
                background: "rgba(0,0,0,0.30)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <span className="w-1.5 h-1.5 bg-cta rounded-full animate-pulse" />
              <span className="text-white/80 text-[11px] font-semibold tracking-widest uppercase">
                {slide.tag}
              </span>
            </div>
          )}

          <h1 className="font-display font-black text-white leading-none mb-2 tracking-tight">
            <span className="block text-5xl md:text-7xl lg:text-8xl">
              {slide.title}
            </span>
            {slide.subtitle && (
              <span className="block text-3xl md:text-5xl lg:text-6xl text-white/50 mt-1">
                {slide.subtitle}
              </span>
            )}
          </h1>

          {slide.description && (
            <p className="text-white/55 text-base md:text-lg mt-6 max-w-xl leading-relaxed">
              {slide.description}
            </p>
          )}

          {slide.badge && (
            <div
              className="inline-block rounded-2xl px-4 py-2 mt-5"
              style={{
                background: "rgba(0,0,0,0.30)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <span className="text-cta font-semibold text-sm">
                {slide.badge}
              </span>
            </div>
          )}

          <div className="flex items-center gap-3 mt-8">
            <Link
              href={slide.href || "/catalogue"}
              className="inline-flex items-center gap-2 btn-glass-dark text-sm px-7 py-3.5"
            >
              {slide.cta || "Découvrir"} <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/catalogue"
              className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm font-medium transition-colors duration-200 px-4 py-3.5"
            >
              Tout voir
            </Link>
          </div>
        </div>
      </div>

      {/* Pas de flèches latérales : la navigation se fait par les points
          ci-dessous, et le défilement automatique enchaîne les diapositives. */}

      {/* Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`transition-all duration-300 rounded-full ${
                i === safeIndex
                  ? "w-6 h-1.5 bg-white"
                  : "w-1.5 h-1.5 bg-white/30 hover:bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
