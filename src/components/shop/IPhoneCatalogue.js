"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, RotateCw } from "lucide-react";
import useProductStore from "@/store/productStore";
import { imageIphone } from "@/lib/reparationModeles";
import { formatPrice } from "@/lib/format";

function getImage(product) {
  const firstImage = product.image || product.images?.[0];
  return firstImage || imageIphone(`${product.name} ${product.slug}`);
}

function getModelOrder(product) {
  const model = `${product.name} ${product.slug}`.toLowerCase();
  const generation = Number(model.match(/iphone[\s-]*(\d+)/)?.[1] || 0);
  const pro = /pro/.test(model) ? 1 : 0;
  const max = /max/.test(model) ? 1 : 0;
  return generation * 100 + pro * 10 + max;
}

export default function IPhoneCatalogue() {
  const { products, fetchProducts, loading, error } = useProductStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchProducts();
  }, [fetchProducts]);

  const iphones = useMemo(() => products
    .filter((product) => {
      const label = `${product.name} ${product.slug}`;
      const isPhoneModel = /iphone[\s-]*\d+/i.test(label);
      const isAccessory = /coque|étui|etui|chargeur|câble|cable|protection|vitre|film|case|cover|adaptateur/i.test(label);
      const category = String(product.category || product.categorySlug || "").toLowerCase();
      const isSmartphoneCategory = !category || /smartphone|telephone|téléphone|iphone/.test(category);
      return product.active !== false && isPhoneModel && !isAccessory && isSmartphoneCategory;
    })
    .sort((a, b) => getModelOrder(b) - getModelOrder(a) || a.name.localeCompare(b.name, "fr")), [products]);

  const isLoading = !mounted || (loading && products.length === 0);

  return (
    <main className="mx-auto w-full max-w-7xl px-5 pb-16 pt-6 md:pt-10">
      <Link href="/smartphones" className="mb-6 inline-flex items-center gap-2 text-sm text-neutral-500 transition hover:text-black">
        <ArrowLeft size={16} aria-hidden="true" /> Retour aux appareils
      </Link>

      <header className="mb-6 md:mb-8">
        <p className="mb-2 text-xs font-bold uppercase tracking-[.2em] text-neutral-500">Smartphones · Apple</p>
        <h1 className="text-3xl font-black tracking-[-.045em] text-neutral-950 md:text-4xl">Tous les modèles iPhone</h1>
        <p className="mt-2 text-sm text-neutral-500">Choisissez votre modèle, puis sa capacité et sa couleur.</p>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-3 gap-3 sm:gap-5 lg:grid-cols-4">
          {Array.from({ length: 6 }, (_, index) => <div key={index} className="aspect-[.78] animate-pulse rounded-[24px] bg-neutral-100" />)}
        </div>
      ) : error && products.length === 0 ? (
        <div className="rounded-3xl bg-neutral-50 px-6 py-12 text-center">
          <p className="text-neutral-600">Impossible de charger les iPhone pour le moment.</p>
          <button onClick={() => fetchProducts(true)} className="mt-4 inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white">
            <RotateCw size={16} aria-hidden="true" /> Réessayer
          </button>
        </div>
      ) : iphones.length === 0 ? (
        <div className="rounded-3xl bg-neutral-50 px-6 py-12 text-center text-neutral-600">
          Aucun iPhone n’est actuellement disponible dans le catalogue.
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:gap-5 lg:grid-cols-4">
          {iphones.map((product) => (
            <Link
              href={`/produit/${product.slug}`}
              key={product.id || product.slug}
              className="group flex min-w-0 flex-col overflow-hidden rounded-[22px] border border-black/[.04] bg-white p-2.5 shadow-[0_9px_28px_rgba(20,20,24,.07)] transition hover:-translate-y-1 hover:shadow-[0_14px_34px_rgba(20,20,24,.12)] sm:rounded-[28px] sm:p-4"
            >
              <span className="relative mb-2 block aspect-square w-full overflow-hidden rounded-2xl bg-white sm:mb-3">
                <Image
                  src={getImage(product)}
                  alt={product.name}
                  fill
                  unoptimized
                  className="object-contain p-1 transition-transform duration-300 group-hover:scale-[1.04] sm:p-2"
                  sizes="(max-width: 640px) 30vw, (max-width: 1024px) 24vw, 280px"
                />
              </span>
              <span className="flex flex-1 flex-col items-center px-0.5 pb-1 text-center sm:px-1 sm:pb-2">
                <strong className="line-clamp-2 min-h-9 text-[12px] font-bold leading-4 text-neutral-950 sm:min-h-12 sm:text-base sm:leading-5">
                  {product.name}
                </strong>
                <span className="mt-1 text-[10px] text-neutral-500 sm:mt-2 sm:text-xs">À partir de</span>
                <span className="mt-0.5 text-[11px] font-bold text-neutral-900 sm:text-sm">{formatPrice(product.price)}</span>
                <span className="mt-2 hidden items-center gap-1 text-xs font-semibold text-neutral-700 sm:inline-flex">
                  Choisir les options <ArrowRight size={14} aria-hidden="true" />
                </span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
