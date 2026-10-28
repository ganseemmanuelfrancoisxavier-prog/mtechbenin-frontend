"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronRight } from "lucide-react";
import {
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
import useProductStore from "@/store/productStore";
import { categories as staticCategories } from "@/lib/categories";
import { isCatalogueCategory } from "@/lib/catalogueCategories";
import styles from "./CategoriesSection.module.css";

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

const CATEGORY_CONTENT = {
  abonnements: {
    image: "/images/categories/abonnements.jpg",
    description: "Netflix, Apple Music, iCloud+, Apple TV, etc.",
  },
  accessoires: {
    image: "/images/categories/accessoires.jpg",
    description: "Chargeurs, câbles, coques, protections, MagSafe...",
  },
  ecouteurs: {
    image: "/images/categories/ecouteurs.jpg",
    description: "AirPods, écouteurs Bluetooth, accessoires audio...",
  },
  enceintes: {
    image: "/images/categories/enceintes-reference.jpg",
    description: "Enceintes Bluetooth, barres de son, audio pro...",
  },
  "for-man": {
    image: "/images/categories/for-man.jpg",
    description: "Montres, accessoires, gadgets, lifestyle...",
  },
  "for-men": {
    image: "/images/categories/for-man.jpg",
    description: "Montres, accessoires, gadgets, lifestyle...",
  },
  "for-woman": {
    image: "/images/categories/for-woman.jpg",
    description: "Montres, sacs, parfums, accessoires, lifestyle...",
  },
  "for-women": {
    image: "/images/categories/for-woman.jpg",
    description: "Montres, sacs, parfums, accessoires, lifestyle...",
  },
  "smartphone-tablette": {
    image: "/images/categories/smartphone-tablette-reference.jpg",
    description: "iPhone, Samsung, Xiaomi, tablettes, et plus...",
  },
  smartphones: {
    image: "/images/categories/smartphone-tablette-reference.jpg",
    description: "iPhone, Samsung, Xiaomi, tablettes, et plus...",
  },
  telephones: {
    image: "/images/categories/smartphone-tablette-reference.jpg",
    description: "iPhone, Samsung, Xiaomi, tablettes, et plus...",
  },
  tablettes: {
    image: "/images/categories/smartphone-tablette-reference.jpg",
    description: "iPhone, Samsung, Xiaomi, tablettes, et plus...",
  },
  ordinateurs: {
    image: "/images/categories/ordinateurs-reference.jpg",
    description: "Mac, PC, composants, accessoires, périphériques...",
  },
  ordinateur: {
    image: "/images/categories/ordinateurs-reference.jpg",
    description: "Mac, PC, composants, accessoires, périphériques...",
  },
  "pc-portable": {
    image: "/images/categories/ordinateurs-reference.jpg",
    description: "Mac, PC, composants, accessoires, périphériques...",
  },
  vapes: {
    image: "/images/categories/vapes.webp",
    description: "Vapes et cigarettes électroniques.",
  },
  sextoys: {
    image: "/images/categories/sextoys.svg",
    description: "Bien-être intime et accessoires pour adultes.",
  },
};

const CATEGORY_ORDER = [
  "abonnements",
  "ordinateurs",
  "smartphone-tablette",
  "accessoires",
  "ecouteurs",
  "enceintes",
  "for-man",
  "for-woman",
];

function getCategoryOrderIndex(slug) {
  const key = String(slug || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  if (/(ordinateur|laptop|pc-portable|informatique)/.test(key)) {
    return CATEGORY_ORDER.indexOf("ordinateurs");
  }
  if (/(smartphone|telephone|tablette)/.test(key)) {
    return CATEGORY_ORDER.indexOf("smartphone-tablette");
  }
  if (/^for-(wo)?man$/.test(key)) {
    return CATEGORY_ORDER.indexOf(key.includes("wo") ? "for-woman" : "for-man");
  }
  return CATEGORY_ORDER.indexOf(key);
}

function getCategoryContent(slug) {
  const key = String(slug || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  if (CATEGORY_CONTENT[key]) return CATEGORY_CONTENT[key];
  if (/(smartphone|telephone|tablette)/.test(key)) {
    return CATEGORY_CONTENT["smartphone-tablette"];
  }
  if (/(ordinateur|laptop|pc-portable|informatique)/.test(key)) {
    return CATEGORY_CONTENT.ordinateurs;
  }
  return {};
}

function getCategoryDescription(slug, label) {
  return (
    getCategoryContent(slug).description ||
    `Découvrez notre sélection de ${String(label || "produits").toLowerCase()}...`
  );
}

function isSmartphoneCategory(slug) {
  const key = String(slug || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return /(smartphone|telephone|tablette)/.test(key);
}

function CategoryRevealCard({ item }) {
  const { label, Icon, href, image, description, slug } = item;
  const imageClassName =
    slug === "accessoires"
      ? styles.accessoriesImage
      : slug === "ecouteurs"
        ? styles.earbudsImage
        : "";

  return (
    <div className={styles.reveal}>
      <Link
        href={href}
        className={styles.card}
      >
        <span className={styles.imageFrame}>
          {image ? (
            <Image
              src={image}
              alt=""
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={`${styles.image} ${imageClassName}`}
            />
          ) : (
            <span className={styles.imageFallback} aria-hidden="true">
              <Icon className={styles.fallbackIcon} strokeWidth={1.4} />
            </span>
          )}
        </span>
        <span className={styles.cardInfo}>
          <span className={styles.cardTitle}>{label}</span>
          <span className={styles.cardDescription}>{description}</span>
          <span className={styles.arrow} aria-hidden="true">
            <ArrowRight />
          </span>
        </span>
      </Link>
    </div>
  );
}

export default function CategoriesSection() {
  const [mounted, setMounted] = useState(false);
  const { getActiveCategories, fetchCategories } = useCategoryStore();
  const featuredProducts = useProductStore((state) => state.featuredProducts);

  useEffect(() => {
    setMounted(true);
    fetchCategories();
  }, []);

  const activeCategories = mounted
    ? getActiveCategories()
    : staticCategories.filter((c) => c.active);

  const allItems = [
    ...activeCategories
      .filter((cat) => cat.slug !== "abonnements" && isCatalogueCategory(cat))
      .map((cat) => {
        const label = cat.label || cat.name;
        const content = getCategoryContent(cat.slug);
        const productImage = featuredProducts.find(
          (product) => product.category === cat.slug && product.image,
        )?.image;
        return {
          slug: cat.slug,
          label,
          Icon: emojiToIcon[cat.icon] || DefaultIcon,
          href: isSmartphoneCategory(cat.slug)
            ? "/smartphones"
            : `/catalogue/${cat.slug}`,
          ...content,
          image: content.image || productImage,
          description: getCategoryDescription(cat.slug, label),
        };
      }),
    {
      slug: "abonnements",
      label: "Abonnements",
      Icon: Tv,
      href: "/abonnements",
      ...getCategoryContent("abonnements"),
    },
  ].sort((a, b) => {
    const aOrder = getCategoryOrderIndex(a.slug);
    const bOrder = getCategoryOrderIndex(b.slug);
    if (aOrder !== -1 || bOrder !== -1) {
      return (aOrder === -1 ? CATEGORY_ORDER.length : aOrder) -
        (bOrder === -1 ? CATEGORY_ORDER.length : bOrder);
    }
    return a.label.localeCompare(b.label, "fr", { sensitivity: "base" });
  });

  const visibleItems = allItems.slice(0, CATEGORIES_AFFICHÉES);

  return (
    <section className={styles.section}>
      <div className={styles.heading}>
        <p className={styles.eyebrow}>Catalogue</p>
        <h2 className={styles.title}>Nos produits</h2>
        <p className={styles.intro}>
          Découvrez notre sélection de produits et services Apple, Android et bien plus.
        </p>
      </div>

      {!mounted ? (
        <div className={styles.grid}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className={styles.skeleton}>
              <div className={styles.skeletonImage} />
              <div className={styles.skeletonTitle} />
              <div className={styles.skeletonDescription} />
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.grid}>
          {visibleItems.map((item) => (
            <CategoryRevealCard
              key={item.slug}
              item={item}
            />
          ))}
        </div>
      )}

      {mounted && allItems.length > CATEGORIES_AFFICHÉES && (
        <div className={styles.more}>
          <Link
            href="/catalogue"
            className={styles.moreLink}
          >
            Voir plus de catégories
            <ChevronRight className={styles.moreChevron} />
          </Link>
        </div>
      )}
    </section>
  );
}
