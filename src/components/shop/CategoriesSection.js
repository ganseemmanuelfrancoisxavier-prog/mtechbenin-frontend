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
      .filter((cat) => cat.slug !== "abonnements")
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
  ].sort((a, b) => a.label.localeCompare(b.label, "fr", { sensitivity: "base" }));

  return (
    <section className="max-w-7xl mx-auto px-5 pt-20 pb-[50px]">
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-2">
            Catégories
          </p>
          <h2 className="font-display font-black text-3xl md:text-4xl text-apple-black tracking-tight">
            Notre Catalogue
          </h2>
        </div>
        <Link
          href="/catalogue"
          className="hidden md:flex items-center gap-1 text-[13px] font-medium text-apple-mid hover:text-apple-black transition-colors duration-200"
        >
          Tout voir <ChevronRight className="w-3.5 h-3.5" />
        </Link>
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {allItems.map(({ slug, label, Icon, href }) => (
            <Link
              key={slug}
              href={href}
              className="group relative glass-card rounded-3xl p-5 flex flex-col items-center text-center hover:-translate-y-1 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-black/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl" />
              <div className="relative w-12 h-12 rounded-2xl bg-black/[0.04] group-hover:bg-black/[0.07] flex items-center justify-center mb-3.5 transition-all duration-300">
                <Icon className="w-5 h-5 text-apple-black" strokeWidth={1.6} />
              </div>
              <h3 className="font-semibold text-apple-black text-[13px] leading-tight">
                {label}
              </h3>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
