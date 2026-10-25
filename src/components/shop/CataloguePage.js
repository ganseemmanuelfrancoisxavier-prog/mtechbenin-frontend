"use client";

import { useState, useEffect, useMemo } from "react";
import { SlidersHorizontal, X, ChevronDown } from "lucide-react";
import ProductCard from "./ProductCard";
import useProductStore from "@/store/productStore";
import useCategoryStore from "@/store/categoryStore";
import { categories as staticCategories } from "@/lib/categories";
import { isCatalogueCategory } from "@/lib/catalogueCategories";

const sortOptions = [
  { value: "default", label: "Par défaut" },
  { value: "price-asc", label: "Prix croissant" },
  { value: "price-desc", label: "Prix décroissant" },
  { value: "discount", label: "Meilleures promos" },
];

export default function CataloguePage({ initialCategory = "tous" }) {
  const [mounted, setMounted] = useState(false);

  const { products, fetchProducts, loading, error } = useProductStore();
  const { getActiveCategories, getCategoryLabel, fetchCategories } =
    useCategoryStore();

  useEffect(() => {
    setMounted(true);
    fetchProducts(); // ← charge produits depuis l'API
    fetchCategories(); // ← charge catégories depuis l'API
  }, []);

  const activeCategories = mounted
    ? getActiveCategories()
    : staticCategories.filter((c) => c.active);

  // Produits actifs depuis le store (déjà chargés depuis l'API)
  const allProducts = mounted
    ? products.filter((p) => p.active)
    : products.filter((p) => p.active);

  const categoryOptions = [
    { slug: "tous", label: "Tous les produits" },
    ...activeCategories.filter(isCatalogueCategory),
  ];

  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState("default");
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [maxPrice, setMaxPrice] = useState(500000);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filtered = useMemo(() => {
    let list = [...allProducts];

    if (selectedCategory !== "tous") {
      list = list.filter(
        (p) =>
          // Supporte les deux champs : categorySlug (API) et category (local)
          (p.categorySlug || p.category) === selectedCategory,
      );
    }

    if (onlyInStock) {
      list = list.filter((p) => p.status !== "Rupture" && p.stock !== 0);
    }

    list = list.filter((p) => p.price <= maxPrice);

    switch (sortBy) {
      case "price-asc":
        list.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        list.sort((a, b) => b.price - a.price);
        break;
      case "discount":
        list.sort((a, b) => {
          const da = a.comparePrice
            ? (a.comparePrice - a.price) / a.comparePrice
            : 0;
          const db = b.comparePrice
            ? (b.comparePrice - b.price) / b.comparePrice
            : 0;
          return db - da;
        });
        break;
    }
    return list;
  }, [allProducts, selectedCategory, sortBy, onlyInStock, maxPrice]);

  const pageTitle =
    selectedCategory === "tous"
      ? "Tous les produits"
      : getCategoryLabel(selectedCategory);

  const FilterPanel = () => (
    <div className="space-y-8">
      <div>
        <h3 className="font-semibold text-apple-black text-sm mb-4">
          Catégorie
        </h3>
        <div className="space-y-2">
          {categoryOptions.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => {
                setSelectedCategory(cat.slug);
                setSidebarOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 rounded-2xl text-sm transition-all ${
                selectedCategory === cat.slug
                  ? "bg-primary text-white font-semibold"
                  : "text-apple-mid hover:bg-apple-gray"
              }`}
            >
              {cat.label || cat.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-apple-black text-sm mb-4">
          Prix maximum
          <span className="text-primary font-bold ml-2">
            {maxPrice.toLocaleString("fr-FR")} FCFA
          </span>
        </h3>
        <input
          type="range"
          min={1000}
          max={500000}
          step={1000}
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-xs text-apple-mid mt-1">
          <span>1 000 FCFA</span>
          <span>500 000 FCFA</span>
        </div>
      </div>

      <div>
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => setOnlyInStock(!onlyInStock)}
            className={`w-11 h-6 rounded-full transition-colors duration-200 relative ${onlyInStock ? "bg-primary" : "bg-apple-gray"}`}
          >
            <div
              className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${onlyInStock ? "translate-x-6" : "translate-x-1"}`}
            />
          </div>
          <span className="text-sm text-apple-black">En stock uniquement</span>
        </label>
      </div>

      <button
        onClick={() => {
          setSelectedCategory("tous");
          setSortBy("default");
          setOnlyInStock(false);
          setMaxPrice(500000);
        }}
        className="w-full text-sm text-apple-mid hover:text-primary transition-colors text-center"
      >
        Réinitialiser les filtres
      </button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-5 py-10">
      <div className="mb-8">
        <h1 className="font-display font-black text-3xl md:text-4xl text-apple-black">
          {pageTitle}
        </h1>
        <p className="text-apple-mid mt-2">
          {!mounted
            ? "Chargement..."
            : `${filtered.length} produit${filtered.length > 1 ? "s" : ""}`}
        </p>
      </div>

      <div className="flex gap-8">
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="glass-card rounded-3xl p-6 sticky top-24">
            <FilterPanel />
          </div>
        </aside>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-6 gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden flex items-center gap-2 glass-card px-4 py-2.5 rounded-2xl text-sm font-medium text-apple-black"
            >
              <SlidersHorizontal className="w-4 h-4" /> Filtres
            </button>
            <div className="relative ml-auto">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white border border-black/10 text-apple-black text-sm px-4 py-2.5 pr-10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-apple-mid pointer-events-none" />
            </div>
          </div>

          {!mounted || (loading && products.length === 0) ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
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
          ) : error && products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-apple-mid text-lg">
                Impossible de charger les produits pour le moment.
              </p>
              <button
                onClick={() => fetchProducts(true)}
                className="mt-4 text-primary font-semibold text-sm hover:underline"
              >
                Réessayer
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-apple-mid text-lg">Aucun produit trouvé</p>
              <button
                onClick={() => {
                  setSelectedCategory("tous");
                  setMaxPrice(500000);
                  setOnlyInStock(false);
                }}
                className="mt-4 text-primary font-semibold text-sm hover:underline"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sidebar mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-2xl p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-bold text-lg text-apple-black">
                Filtres
              </h2>
              <button onClick={() => setSidebarOpen(false)}>
                <X className="w-5 h-5 text-apple-mid" />
              </button>
            </div>
            <FilterPanel />
          </div>
        </div>
      )}
    </div>
  );
}
