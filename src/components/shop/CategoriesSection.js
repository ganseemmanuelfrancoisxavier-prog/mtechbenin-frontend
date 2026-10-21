"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Headphones,
  Speaker,
  Wind,
  Heart,
  Package,
  Gamepad2,
  Smartphone,
  Laptop,
  Watch,
  Music,
  Camera,
  Monitor,
  Tv,
  Sparkles,
  Mic,
  Piano,
  Drum,
  Guitar,
  Trophy,
  Dices,
  Puzzle,
  Printer,
  Mouse,
  HardDrive,
  Disc,
  Plug,
  Lightbulb,
  Flashlight,
  Magnet,
  Wrench,
  Settings,
  Microscope,
  Telescope,
  Globe,
  Car,
  Bike,
  Plane,
  Rocket,
  ShoppingBag,
  Gift,
  Star,
  Gem,
  Coins,
  Medal,
  Leaf,
  Coffee,
  Sofa,
  Flower,
} from "lucide-react";
import useCategoryStore from "@/store/categoryStore";
import { categories as staticCategories } from "@/lib/categories";

// Correspondance emoji admin → icône Lucide
const emojiToIcon = {
  "🎧": Headphones,
  "🔊": Speaker,
  "💨": Wind,
  "💄": Sparkles,
  "📦": Package,
  "🎮": Gamepad2,
  "📱": Smartphone,
  "💻": Laptop,
  "⌚": Watch,
  "🎵": Music,
  "📷": Camera,
  "🖥️": Monitor,
  "📺": Tv,
  "❤️": Heart,
  "🎤": Mic,
  "🎹": Piano,
  "🥁": Drum,
  "🎸": Guitar,
  "🎺": Music,
  "🎻": Music,
  "🕹️": Gamepad2,
  "🃏": Dices,
  "🎲": Dices,
  "🧩": Puzzle,
  "🏆": Trophy,
  "🖨️": Printer,
  "🖱️": Mouse,
  "🖲️": Mouse,
  "💾": HardDrive,
  "💿": Disc,
  "📀": Disc,
  "📡": Globe,
  "🛰️": Globe,
  "🔋": Plug,
  "🔌": Plug,
  "💡": Lightbulb,
  "🔦": Flashlight,
  "🧲": Magnet,
  "🔧": Wrench,
  "🔩": Wrench,
  "⚙️": Settings,
  "🛠️": Wrench,
  "🔬": Microscope,
  "🔭": Telescope,
  "🌐": Globe,
  "🚗": Car,
  "🏍️": Bike,
  "🚲": Bike,
  "✈️": Plane,
  "🚀": Rocket,
  "🛍️": ShoppingBag,
  "🎁": Gift,
  "🎀": Gift,
  "⭐": Star,
  "💎": Gem,
  "🪙": Coins,
  "💰": Coins,
  "🏅": Medal,
  "🥇": Medal,
  "🌿": Leaf,
  "🌸": Flower,
  "🌴": Leaf,
  "☕": Coffee,
  "🛋️": Sofa,
};

const DefaultIcon = Package;
const CATEGORIES_AFFICHÉES = 8;

export default function CategoriesSection() {
  const [mounted, setMounted] = useState(false);
  const carouselRef = useRef(null);
  const reduceMotion = useReducedMotion();
  const { getActiveCategories, fetchCategories } = useCategoryStore();

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
    fetchCategories();
  }, []);

  const activeCategories = mounted
    ? getActiveCategories()
    : staticCategories.filter((c) => c.active);

  const allItems = [
    ...activeCategories
      .filter((cat) => cat.slug !== "abonnements" &&
          cat.slug !== "reparation" &&
          cat.slug !== "suivi")
      .map((cat) => ({
        slug: cat.slug,
        label: cat.label || cat.name,
        Icon: emojiToIcon[cat.icon] || DefaultIcon,
        href: `/catalogue/${cat.slug}`,
      })),
    {
      slug: "abonnements",
      label: "Abonnements",
      Icon: Tv,
      href: "/abonnements",
    },
    {
      slug: "reparation",
      label: "Réparation",
      Icon: Wrench,
      href: "/reparation",
    },
    {
      slug: "suivi",
      label: "Suivi commande",
      Icon: Package,
      href: "/suivi",
    },
  ].sort((a, b) => a.label.localeCompare(b.label, "fr", { sensitivity: "base" }));

  const visibleItems = allItems.slice(0, CATEGORIES_AFFICHÉES);

  return (
    <section className="max-w-7xl mx-auto px-5 pt-20 pb-[50px]">
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-2">
            Catégories
          </p>
          <h2 className="font-display font-black text-3xl md:text-4xl text-apple-black tracking-tight">
            Notre univers
          </h2>
        </div>
        {mounted && visibleItems.length > 2 && (
          <div className="hidden sm:flex items-center gap-2">
            <button type="button" aria-label="Défiler les univers vers la gauche" onClick={() => scrollCarousel(-1)} className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-apple-black shadow-sm transition hover:bg-black/[0.04]">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button type="button" aria-label="Défiler les univers vers la droite" onClick={() => scrollCarousel(1)} className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-apple-black shadow-sm transition hover:bg-black/[0.04]">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {!mounted ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="glass-card rounded-3xl p-5 flex flex-col items-center animate-pulse"
            >
              <div className="w-12 h-12 bg-black/[0.06] rounded-2xl mb-3.5" />
              <div className="h-3 bg-black/[0.05] rounded-full w-16 mb-1" />
              <div className="h-2 bg-black/[0.04] rounded-full w-20 hidden md:block" />
            </div>
          ))}
        </div>
      ) : (
        <div ref={carouselRef} className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-5 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Carrousel des univers">
          {visibleItems.map(({ slug, label, Icon, href }, index) => (
            <motion.div
              key={slug}
              initial={reduceMotion ? false : { opacity: 0, x: 42 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.48, delay: reduceMotion ? 0 : index * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className="w-[42%] shrink-0 snap-start sm:w-[30%] lg:w-[23%]"
            >
              <Link href={href} className="catalogue-card-float group relative glass-card rounded-3xl p-5 flex min-h-[118px] h-full flex-col items-center justify-center text-center transition-all duration-300 overflow-hidden">
                <div className="absolute inset-0 bg-black/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl" />
                <div className="catalogue-card-depth relative w-12 h-12 rounded-2xl bg-black/[0.04] group-hover:bg-black/[0.07] flex items-center justify-center mb-3.5 transition-all duration-300">
                  <Icon className="w-5 h-5 text-apple-black" strokeWidth={1.6} />
                </div>
                <h3 className="catalogue-card-depth font-semibold text-apple-black text-[13px] leading-tight">{label}</h3>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {mounted && (
        <div className="mt-8 flex justify-center">
          <Link
            href="/catalogue"
            className="group inline-flex min-h-11 items-center gap-2 rounded-full border border-black/10 bg-white px-6 py-3 text-[13px] font-semibold text-apple-black shadow-sm transition-all hover:-translate-y-0.5 hover:border-black/20 hover:shadow-md"
          >
            Voir plus de catégories
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      )}
    </section>
  );
}
