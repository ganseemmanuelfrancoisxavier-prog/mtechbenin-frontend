"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star, Quote, ArrowRight, ArrowUpRight, Wrench } from "lucide-react";
import useReviewStore from "@/store/reviewStore";
import ReviewPhotos from "./ReviewPhotos";

export default function SocialProofSection() {
  const [mounted, setMounted] = useState(false);
  const { getFeaturedReviews, fetchFeaturedReviews, totalApprouves } =
    useReviewStore();

  useEffect(() => {
    setMounted(true);
    fetchFeaturedReviews(); // ← charge les avis featured depuis l'API
  }, []);

  const featured = mounted ? getFeaturedReviews() : [];

  const reviews = featured.map((review) => ({
    ...review,
    initial: review.name?.charAt(0) || "?",
    productName: review.productName || "",
  }));

  // On n'invite à « voir plus » que s'il reste réellement des avis à découvrir
  // au-delà de ceux affichés ici. `mounted` évite un écart d'hydratation.
  const resteAVoir = mounted && totalApprouves > reviews.length;

  return (
    <section className="mx-auto max-w-7xl px-5 pt-8 pb-16">
      {/* Header avis */}
      <div className="mb-10">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
          Avis publiés
        </p>
        <h2 className="font-display font-black text-3xl md:text-4xl text-apple-black tracking-tight">
          Ils parlent de nous
        </h2>
      </div>

      {/* Avis */}
      {reviews.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="glass-card relative flex flex-col gap-4 overflow-hidden rounded-3xl p-6"
            >
              <Quote
                className="absolute right-4 top-4 h-8 w-8 text-black/[0.04]"
                strokeWidth={1}
              />
              <div role="img" className="flex gap-0.5" aria-label={`${review.rating} sur 5 étoiles`}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    aria-hidden="true"
                    className={`h-3.5 w-3.5 ${star <= review.rating ? "fill-cta text-cta" : "text-black/10"}`}
                  />
                ))}
              </div>
              <div className="flex-1">
                <p className="text-[13px] leading-relaxed text-apple-black">
                  &ldquo;{review.text}&rdquo;
                </p>
                <ReviewPhotos
                  photos={review.photos}
                  auteur={review.name}
                  taille="sm"
                />
              </div>
              {review.productName && (
                <span className="self-start rounded-full bg-black/[0.04] px-3 py-1 text-[11px] font-medium text-apple-mid">
                  {review.productName}
                </span>
              )}
              <div className="flex items-center gap-3 border-t border-black/[0.05] pt-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-apple-black text-[12px] font-bold text-white">
                  {review.initial}
                </div>
                <div>
                  <p className="text-[13px] font-semibold leading-tight text-apple-black">
                    {review.name}
                  </p>
                  <p className="text-[11px] text-apple-mid">{review.city}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-black/[0.08] bg-white/70 p-6 text-sm text-neutral-500">
          {mounted
            ? "Aucun témoignage publié pour le moment."
            : "Chargement des témoignages..."}
        </p>
      )}

      {resteAVoir && (
        <div className="flex justify-center mt-10">
          <Link
            href="/avis"
            className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-apple-black hover:bg-neutral-800 text-white text-[13px] font-semibold transition-all"
          >
            Voir les {totalApprouves} avis
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      )}
      <div className="mt-12 flex justify-center">
        <Link
          href="/reparation"
          className="group flex w-full max-w-xl items-center gap-4 rounded-3xl border border-black/[0.06] bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-black/[0.05] text-apple-black">
            <Wrench className="h-5 w-5" strokeWidth={1.8} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-apple-mid">
              Nouveau service
            </span>
            <span className="mt-1 block text-sm font-bold leading-snug text-apple-black sm:text-base">
              Réparation et entretien d’appareils
            </span>
          </span>
          <ArrowUpRight className="h-4 w-4 shrink-0 text-apple-mid transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>
    </section>
  );
}
