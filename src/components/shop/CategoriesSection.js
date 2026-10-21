"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
import CategoryGrid3D from "./CategoryGrid3D";

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
  const { getActiveCategories, fetchCategories } = useCategoryStore();

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
        <CategoryGrid3D items={visibleItems} />
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
