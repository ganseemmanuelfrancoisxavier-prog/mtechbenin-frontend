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

const DefaultIcon = null;
const CATEGORIES_AFFICHÉES = 8;

const ordinateurCatalogueImage = "data:image/webp;base64,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";

const CATEGORY_CONTENT = {
  abonnements: {
    image: "/images/categories/abonnements.jpg",
    description: "Netflix, Apple Music, iCloud+, Apple TV, etc.",
  },
  accessoires: {
    image: "/images/categories/accessoires-magsafe.svg",
    description: "Chargeurs, câbles, coques, protections, MagSafe...",
  },
  ecouteurs: {
    image: "/images/categories/ecouteurs-airpods-casque.svg",
    description: "AirPods, écouteurs Bluetooth, accessoires audio...",
  },
  enceintes: {
    image: "/images/categories/enceintes-partybox.svg",
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
    image: ordinateurCatalogueImage,
    description: "Mac, PC, composants, accessoires, périphériques...",
  },
  ordinateur: {
    image: ordinateurCatalogueImage,
    description: "Mac, PC, composants, accessoires, périphériques...",
  },
  "pc-portable": {
    image: ordinateurCatalogueImage,
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
        : slug === "sextoys"
          ? styles.sextoysImage
          : slug === "enceintes"
            ? styles.speakerImage
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
              {Icon ? <Icon className={styles.fallbackIcon} strokeWidth={1.4} /> : null}
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

  const allItems = activeCategories
    .filter((cat) => isCatalogueCategory(cat))
    .map((cat) => {
      const label = cat.label || cat.name;
      const [categoryIcon, ...imageParts] = String(cat.icon || "").split("::catalogue::");
      const catalogueImage = imageParts.join("::catalogue::");
      const content = getCategoryContent(cat.slug);
      const productImage = featuredProducts.find(
        (product) => product.category === cat.slug && product.image,
      )?.image;
      return {
        slug: cat.slug,
        label,
        Icon: emojiToIcon[categoryIcon] || DefaultIcon,
        href: cat.slug === "abonnements"
          ? "/abonnements"
          : isSmartphoneCategory(cat.slug)
            ? "/smartphones"
            : `/catalogue/${cat.slug}`,
        ...content,
        image: catalogueImage || content.image || productImage,
        description: getCategoryDescription(cat.slug, label),
      };
    });

  if (!allItems.some((item) => item.slug === "abonnements")) {
    allItems.push({
      slug: "abonnements",
      label: "Abonnements",
      Icon: Tv,
      href: "/abonnements",
      ...getCategoryContent("abonnements"),
      description: getCategoryDescription("abonnements", "Abonnements"),
    });
  }

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
