"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ChevronRight, Minus, Plus, ShoppingBag } from "lucide-react";
import { formatPrice } from "@/lib/format";

export default function IPhoneSalesDetail({ product, variantTypes, selectedVariants, onSelectVariant, quantity, setQuantity, price, canBuy, onBuy }) {
  const storageType = variantTypes.find((type) => /stockage|capacit[ée]/i.test(type.name));
  const stateTypes = variantTypes.filter((type) => type !== storageType && /état|etat|condition/i.test(type.name));
  const otherTypes = variantTypes.filter((type) => type !== storageType && !stateTypes.includes(type));

  return (
    <main className="mx-auto w-full max-w-6xl px-5 pb-36 pt-6 md:pb-20 md:pt-10">
      <nav className="mb-7 flex flex-wrap items-center gap-2 text-sm text-neutral-500">
        <Link href="/" className="hover:text-black">Accueil</Link><ChevronRight size={15} />
        <Link href="/smartphones/iphone" className="hover:text-black">Boutique iPhone</Link><ChevronRight size={15} />
        <span className="font-medium text-neutral-900">{product.name}</span>
      </nav>

      <Link href="/smartphones/iphone" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-neutral-600 hover:text-black md:hidden">
        <ArrowLeft size={17} /> Tous les iPhone
      </Link>

      <div className="grid gap-8 md:grid-cols-[1fr_1fr] md:items-start md:gap-14">
        <div className="relative aspect-square overflow-hidden rounded-[30px] bg-neutral-50 md:sticky md:top-8">
          <Image src={product.images?.[0] || "/placeholder.jpg"} alt={product.name} fill unoptimized priority className="object-contain p-5 md:p-10" sizes="(max-width: 768px) 100vw, 50vw" />
          <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-neutral-700 shadow-sm">{product.status}</span>
        </div>

        <section className="space-y-6">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[.2em] text-neutral-500">Boutique · iPhone</p>
            <h1 className="text-3xl font-black tracking-tight text-neutral-950 md:text-4xl">{product.name}</h1>
            <p className="mt-3 text-sm leading-6 text-neutral-600">Choisissez d’abord l’état du téléphone, puis sa capacité de stockage.</p>
          </div>

          {stateTypes.map((type) => (
            <fieldset key={type.id}>
              <legend className="mb-3 text-sm font-bold text-neutral-900">{type.name}{type.required ? " *" : ""}</legend>
              <div className="grid grid-cols-2 gap-3">
                {type.options.map((option) => {
                  const active = selectedVariants[type.name] === option.value;
                  return <button key={option.id || option.value} type="button" onClick={() => onSelectVariant(type.name, option.value)} aria-pressed={active} className={`rounded-2xl border p-4 text-left transition ${active ? "border-neutral-950 bg-neutral-950 text-white shadow-md" : "border-black/10 bg-white hover:border-black/40"}`}><span className="block text-base font-bold">{option.value}</span></button>;
                })}
              </div>
            </fieldset>
          ))}

          {storageType ? (
            <fieldset>
              <legend className="mb-3 text-sm font-bold text-neutral-900">Stockage <span className="font-normal text-neutral-500">· choisissez une capacité</span></legend>
              <div className="grid grid-cols-2 gap-3">
                {storageType.options.map((option) => {
                  const active = selectedVariants[storageType.name] === option.value;
                  return <button key={option.id || option.value} type="button" onClick={() => onSelectVariant(storageType.name, option.value)} aria-pressed={active} className={`rounded-2xl border p-4 text-left transition ${active ? "border-neutral-950 bg-neutral-950 text-white shadow-md" : "border-black/10 bg-white hover:border-black/40"}`}>
                    <span className="block text-base font-bold">{option.value}</span>
                  </button>;
                })}
              </div>
            </fieldset>
          ) : (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Les capacités de stockage ne sont pas encore configurées pour ce modèle. Contactez-nous pour commander.</div>
          )}

          {otherTypes.map((type) => (
            <fieldset key={type.id}>
              <legend className="mb-3 text-sm font-bold text-neutral-900">{type.name}{type.required ? " *" : ""}</legend>
              <div className="flex flex-wrap gap-2">
                {type.options.map((option) => {
                  const active = selectedVariants[type.name] === option.value;
                  return <button key={option.id || option.value} type="button" onClick={() => onSelectVariant(type.name, option.value)} aria-pressed={active} className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${active ? "border-neutral-950 bg-neutral-950 text-white" : "border-black/10 bg-white text-neutral-800 hover:border-black/40"}`}>{option.value}</button>;
                })}
              </div>
            </fieldset>
          ))}

          <div className="flex items-end justify-between gap-4 border-t border-black/[.07] pt-5">
            <div><p className="text-sm text-neutral-500">Prix de votre sélection</p><p className="mt-1 text-3xl font-black tracking-tight text-neutral-950">{formatPrice(price * quantity)}</p>{quantity > 1 && <p className="mt-1 text-xs text-neutral-500">{formatPrice(price)} × {quantity}</p>}</div>
            <div className="inline-flex items-center gap-3 rounded-full bg-neutral-100 p-1">
              <button type="button" aria-label="Diminuer la quantité" onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="grid h-10 w-10 place-items-center rounded-full bg-white shadow-sm"><Minus size={16} /></button>
              <span className="w-5 text-center font-bold">{quantity}</span>
              <button type="button" aria-label="Augmenter la quantité" onClick={() => setQuantity((q) => q + 1)} className="grid h-10 w-10 place-items-center rounded-full bg-white shadow-sm"><Plus size={16} /></button>
            </div>
          </div>

          <button type="button" onClick={onBuy} disabled={!canBuy} className="flex w-full items-center justify-center gap-3 rounded-2xl bg-neutral-950 px-6 py-4 text-base font-bold text-white shadow-lg transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40">
            <ShoppingBag size={19} /> Commander <ArrowRight size={18} />
          </button>
          {!canBuy && <p className="text-center text-xs text-neutral-500">Choisissez les options requises avant de commander.</p>}
          <p className="text-center text-xs text-neutral-500">Votre commande et le paiement se poursuivent dans le panier sécurisé.</p>
        </section>
      </div>
    </main>
  );
}
