"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useAnimationControls, useInView } from "framer-motion";
import {
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

// Visuels des cartes « Notre univers », repris depuis la capture de référence.
// Les catégories créées dans l'admin gardent leur icône si aucun visuel dédié
// ne correspond à leur nom ou à leur slug.
const categoryArtwork = {
  abonnements: "/images/categories/abonnements.png",
  accessoires: "/images/categories/accessoires.png",
  ecouteurs: "/images/categories/ecouteurs.png",
  enceintes: "/images/categories/enceintes.png",
  "for-man": "/images/categories/for-man.png",
  "for-woman": "/images/categories/for-woman.png",
  reparation: "/images/categories/reparation.png",
  "smartphone-tablette": "/images/categories/smartphone-tablette.png",
};

function getCategoryArtwork(slug, label) {
  const normalize = (value = "") =>
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  const keys = [normalize(slug), normalize(label)];

  for (const key of keys) {
    if (categoryArtwork[key]) return categoryArtwork[key];
    if (key.includes("abonnement")) return categoryArtwork.abonnements;
    if (key.includes("accessoire")) return categoryArtwork.accessoires;
    if (key.includes("ecouteur")) return categoryArtwork.ecouteurs;
    if (key.includes("enceinte")) return categoryArtwork.enceintes;
    if (key.includes("reparation")) return categoryArtwork.reparation;
    if (key.includes("smartphone") || key.includes("tablette"))
      return categoryArtwork["smartphone-tablette"];
    if (key.includes("for-man") || key.includes("homme"))
      return categoryArtwork["for-man"];
    if (key.includes("for-woman") || key.includes("femme"))
      return categoryArtwork["for-woman"];
  }

  return null;
}

function CategoryRevealCard({ item, index, scrollDirection }) {
  const cardRef = useRef(null);
  const isInView = useInView(cardRef, { once: false, amount: 0.2 });
  const controls = useAnimationControls();

  useEffect(() => {
    if (isInView) {
      if (scrollDirection.current === "down") {
        controls.start({
          opacity: 1,
          y: 0,
          scale: 1,
          transition: {
            duration: 1,
            delay: index * 0.07,
            ease: [0.22, 1, 0.36, 1],
          },
        });
      } else {
        controls.set({ opacity: 1, y: 0, scale: 1 });
      }
    } else if (scrollDirection.current === "up") {
      controls.set({ opacity: 0, y: -22, scale: 0.97 });
    }
  }, [controls, index, isInView, scrollDirection]);

  const { label, Icon, href, image } = item;

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: -22, scale: 0.97 }}
      animate={controls}
    >
      <Link
        href={href}
        className="glass-card flex min-h-[102px] flex-col items-center justify-center rounded-3xl border border-black/[0.04] bg-white px-2 py-3 text-center shadow-[0_12px_30px_rgba(0,0,0,0.12)] sm:min-h-[132px] sm:px-4 sm:py-4"
      >
        {image ? (
          <Image
            src={image}
            alt=""
            aria-hidden="true"
            width={255}
            height={140}
            loading="lazy"
            className="h-12 w-[88%] object-contain sm:h-16"
          />
        ) : (
          <span className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-black/[0.04]">
            <Icon className="h-5 w-5 text-apple-black" strokeWidth={1.6} />
          </span>
        )}
        <span className="mt-2 text-[13px] font-semibold leading-tight text-apple-black">
          {label}
        </span>
      </Link>
    </motion.div>
  );
}

export default function CategoriesSection() {
  const [mounted, setMounted] = useState(false);
  const scrollDirection = useRef("none");
  const previousScrollY = useRef(0);
  const { getActiveCategories, fetchCategories } = useCategoryStore();

  useEffect(() => {
    setMounted(true);
    fetchCategories();
  }, []);

  useEffect(() => {
    previousScrollY.current = window.scrollY;
    const updateScrollDirection = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY !== previousScrollY.current) {
        scrollDirection.current =
          currentScrollY > previousScrollY.current ? "down" : "up";
        previousScrollY.current = currentScrollY;
      }
    };

    window.addEventListener("scroll", updateScrollDirection, { passive: true });
    return () => window.removeEventListener("scroll", updateScrollDirection);
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
        image: getCategoryArtwork(cat.slug, cat.label || cat.name),
        href: `/catalogue/${cat.slug}`,
      })),
    {
      slug: "abonnements",
      label: "Abonnements",
      Icon: Tv,
      image: categoryArtwork.abonnements,
      href: "/abonnements",
    },
    {
      slug: "reparation",
      label: "Réparation",
      Icon: Wrench,
      image: categoryArtwork.reparation,
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
        <div className="grid grid-cols-2 gap-4">
          {visibleItems.map((item, index) => (
            <CategoryRevealCard
              key={item.slug}
              item={item}
              index={index}
              scrollDirection={scrollDirection}
            />
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
