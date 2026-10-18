"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Package, Tv } from "lucide-react";
import ProductCard from "./ProductCard";
import Link from "next/link";
import { formatPrice, prixDepart } from "@/lib/format";
import useProductStore from "@/store/productStore";
import useAbonnementStore from "@/store/abonnementStore";
import useCategoryStore from "@/store/categoryStore";
import { productsApi } from "@/lib/api";
import { services as staticServices } from "@/lib/abonnements";
import { categories as staticCategories } from "@/lib/categories";

export default function RecherchePage({ initialQuery = "" }) {
  const router = useRouter();

  const [query, setQuery] = useState(initialQuery);
  const [mounted, setMounted] = useState(false);
  const [apiResults, setApiResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const { products, fetchProducts } = useProductStore();
  const { getActiveServices, fetchServices } = useAbonnementStore();
  const { getActiveCategories, fetchCategories } = useCategoryStore();

  useEffect(() => {
    setMounted(true);
    fetchProducts();
    fetchServices();
    fetchCategories();
  }, []);

  const activeCategories = mounted
    ? getActiveCategories()
    : staticCategories.filter((c) => c.active);
  const activeServices = mounted
    ? getActiveServices()
    : staticServices.filter((s) => s.available);
  const activeSlugs = activeCategories.map((c) => c.slug);

  // ── Recherche via API avec debounce 300ms ─────────────────────────────────
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setApiResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const data = await productsApi.search(query.trim(), 20);
        setApiResults(data.products || []);
      } catch {
        // Fallback local si l'API échoue
        setApiResults([]);
      }
      setSearchLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  // Produits à afficher : résultats API en priorité, fallback local
  const productResults = useMemo(() => {
    if (!query.trim()) return [];
    if (apiResults.length > 0) return apiResults;
    // Fallback local
    const q = query.toLowerCase();
    return products.filter(
      (p) =>
        p.active &&
        (p.name.toLowerCase().includes(q) ||
          (p.categorySlug || p.category || "").toLowerCase().includes(q) ||
          (p.description || "").toLowerCase().includes(q)),
    );
  }, [query, apiResults, products]);

  // Abonnements — filtre local (pas de route API search pour les services)
  const serviceResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return activeServices.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.tagline?.toLowerCase().includes(q),
    );
  }, [query, activeServices]);

  const totalResults = productResults.length + serviceResults.length;

  // Met à jour l'URL
  useEffect(() => {
    if (!mounted) return;
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    router.replace(`/recherche?${params.toString()}`, { scroll: false });
  }, [query, mounted]);

  return (
    <div className="max-w-7xl mx-auto px-5 py-10">
      {/* Barre de recherche */}
      <div className="max-w-2xl mx-auto mb-10">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-apple-mid" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un produit, un abonnement..."
            className="w-full bg-white border border-black/10 rounded-2xl pl-12 pr-12 py-4 text-base focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-sm"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-apple-mid hover:text-apple-black transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          {/* Spinner recherche */}
          {searchLoading && (
            <div className="absolute right-12 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-black/20 border-t-black/60 rounded-full animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* État vide */}
      {!query.trim() && (
        <div className="text-center py-20">
          <Search className="w-16 h-16 text-apple-gray mx-auto mb-4" />
          <h2 className="font-display font-black text-2xl text-apple-black mb-2">
            Que recherchez-vous ?
          </h2>
          <p className="text-apple-mid">
            Tapez le nom d&apos;un produit ou d&apos;un service
          </p>
          {/* Suggestions catégories */}
          <div className="flex flex-wrap gap-2 justify-center mt-8">
            {activeCategories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/catalogue/${cat.slug}`}
                className="text-[13px] bg-black/[0.04] hover:bg-black/[0.07] text-apple-mid px-4 py-2 rounded-full transition"
              >
                {cat.label || cat.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Chargement */}
      {query.trim() && searchLoading && productResults.length === 0 && (
        <div className="text-center py-20">
          <div className="w-10 h-10 border-2 border-black/20 border-t-black/60 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-apple-mid">Recherche en cours...</p>
        </div>
      )}

      {/* Aucun résultat */}
      {query.trim() && !searchLoading && totalResults === 0 && (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-apple-gray rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="w-10 h-10 text-apple-mid" />
          </div>
          <h2 className="font-display font-black text-2xl text-apple-black mb-2">
            Aucun résultat pour &quot;{query}&quot;
          </h2>
          <p className="text-apple-mid mb-6">
            Essayez avec d&apos;autres termes ou explorez notre catalogue
          </p>
          <Link
            href="/catalogue"
            className="inline-flex items-center gap-2 bg-cta text-white font-semibold px-8 py-3 rounded-2xl hover:bg-cta/90 transition"
          >
            Voir tous les produits
          </Link>
        </div>
      )}

      {/* Résultats */}
      {query.trim() && !searchLoading && totalResults > 0 && (
        <div className="space-y-12">
          <p className="text-apple-mid text-sm">
            <span className="font-semibold text-apple-black">
              {totalResults} résultat{totalResults > 1 ? "s" : ""}
            </span>{" "}
            pour &quot;{query}&quot;
          </p>

          {/* Produits */}
          {productResults.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Package className="w-5 h-5 text-primary" />
                <h2 className="font-display font-bold text-xl text-apple-black">
                  Produits
                </h2>
                <span className="text-apple-mid text-sm">
                  ({productResults.length})
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {productResults.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          )}

          {/* Abonnements */}
          {serviceResults.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Tv className="w-5 h-5 text-green-600" />
                <h2 className="font-display font-bold text-xl text-apple-black">
                  Abonnements
                </h2>
                <span className="text-apple-mid text-sm">
                  ({serviceResults.length})
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {serviceResults.map((service) => {
                  const formules = service.formules || service.plans || [];
                  const { prix: prixMin, suffixe: suffixePrix } =
                    prixDepart(formules);
                  const minPrice = prixMin ?? 0;
                  return (
                    <Link
                      key={service.slug}
                      href={`/abonnements/${service.slug}`}
                      className="glass-card rounded-3xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                    >
                      <div
                        className={`bg-gradient-to-br ${service.color} p-5 relative overflow-hidden`}
                      >
                        <div className="absolute -top-3 -right-3 w-16 h-16 bg-white/10 rounded-full" />
                        <h3 className="font-display font-black text-white text-lg relative z-10">
                          {service.name}
                        </h3>
                        <p className="text-white/70 text-xs mt-1 relative z-10 line-clamp-1">
                          {service.tagline}
                        </p>
                      </div>
                      <div className="p-4">
                        <p className="text-xs text-apple-mid mb-1">
                          À partir de
                        </p>
                        <p className="font-display font-black text-lg text-apple-black">
                          {minPrice > 0 ? formatPrice(minPrice) : "—"}
                          <span className="text-apple-mid font-normal text-sm">
                            {suffixePrix}
                          </span>
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
