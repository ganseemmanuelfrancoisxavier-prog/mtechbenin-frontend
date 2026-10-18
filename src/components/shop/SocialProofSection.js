"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Star, Quote, ArrowRight } from "lucide-react";
import useReviewStore from "@/store/reviewStore";
import ReviewPhotos from "./ReviewPhotos";

const stats = [
  { value: 53712, suffix: "+", label: "Clients satisfaits" },
  { value: 126328, suffix: "+", label: "Commandes livrées" },
  { value: 4.8, suffix: "/5", label: "Note moyenne" },
  { value: 7, suffix: " ans", label: "D'expertise" },
];

const fallbackReviews = [
  {
    id: 1,
    name: "Koffi Mensah",
    city: "Cotonou",
    initial: "K",
    rating: 5,
    text: "Livraison ultra rapide ! J'ai reçu mes AirPods Pro en moins de 2h. Qualité au rendez-vous, je recommande vivement MTECHBENIN.",
    productName: "AirPods Pro 2ème génération",
  },
  {
    id: 2,
    name: "Aïcha Dossou",
    city: "Abomey-Calavi",
    initial: "A",
    rating: 5,
    text: "Mon abonnement Netflix a été activé en 5 minutes après le paiement. Service impeccable, prix imbattables au Bénin !",
    productName: "Netflix Premium",
  },
  {
    id: 3,
    name: "Rodrigue Agossou",
    city: "Cotonou",
    initial: "R",
    rating: 5,
    text: "La JBL Boombox est authentique, son incroyable. Le vendeur est très réactif sur WhatsApp. Client fidèle depuis 2 ans.",
    productName: "JBL Boombox 3ème génération",
  },
];

function AnimatedCounter({ value, suffix }) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) setStarted(true);
      },
      { threshold: 0.5 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else setCount(Math.floor(current * 10) / 10);
    }, 1500 / steps);
    return () => clearInterval(timer);
  }, [started, value]);

  return (
    <span ref={ref}>
      {Number.isInteger(value) ? Math.floor(count) : count.toFixed(1)}
      {suffix}
    </span>
  );
}

export default function SocialProofSection() {
  const [mounted, setMounted] = useState(false);
  const { getFeaturedReviews, fetchFeaturedReviews, totalApprouves } =
    useReviewStore();

  useEffect(() => {
    setMounted(true);
    fetchFeaturedReviews(); // ← charge les avis featured depuis l'API
  }, []);

  const featured = mounted ? getFeaturedReviews() : [];

  const reviews =
    featured.length > 0
      ? featured.map((r) => ({
          ...r,
          initial: r.name?.charAt(0) || "?",
          productName: r.productName || "",
        }))
      : fallbackReviews;

  // On n'invite à « voir plus » que s'il reste réellement des avis à découvrir
  // au-delà de ceux affichés ici. `mounted` évite un écart d'hydratation.
  const resteAVoir = mounted && totalApprouves > reviews.length;

  return (
    <section className="max-w-7xl mx-auto px-5 pt-8 pb-[65px]">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-24">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="glass-card rounded-3xl p-6 text-center"
          >
            <div className="font-display font-black text-3xl md:text-4xl text-apple-black mb-1.5 tracking-tight">
              <AnimatedCounter value={stat.value} suffix={stat.suffix} />
            </div>
            <p className="text-apple-mid text-[13px]">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Header avis */}
      <div className="mb-10">
        <p className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-2">
          Témoignages
        </p>
        <h2 className="font-display font-black text-3xl md:text-4xl text-apple-black tracking-tight">
          Ils parlent de nous
        </h2>
      </div>

      {/* Avis */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="glass-card rounded-3xl p-6 flex flex-col gap-4 relative overflow-hidden"
          >
            <Quote
              className="absolute top-4 right-4 w-8 h-8 text-black/[0.04]"
              strokeWidth={1}
            />
            {/* Cinq étoiles fixes dont on ne change que le remplissage :
                boucler sur `review.rating` dessinait autant d'étoiles que la
                valeur reçue, sans plafond. */}
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-3.5 h-3.5 ${s <= review.rating ? "fill-cta text-cta" : "text-black/10"}`}
                />
              ))}
            </div>
            <div className="flex-1">
              <p className="text-apple-black text-[13px] leading-relaxed">
                &ldquo;{review.text}&rdquo;
              </p>
              <ReviewPhotos
                photos={review.photos}
                auteur={review.name}
                taille="sm"
              />
            </div>
            <span className="text-[11px] bg-black/[0.04] text-apple-mid px-3 py-1 rounded-full self-start font-medium">
              {review.productName}
            </span>
            <div className="flex items-center gap-3 pt-3 border-t border-black/[0.05]">
              <div className="w-8 h-8 rounded-full bg-apple-black flex items-center justify-center text-white font-bold text-[12px] flex-shrink-0">
                {review.initial}
              </div>
              <div>
                <p className="font-semibold text-apple-black text-[13px] leading-tight">
                  {review.name}
                </p>
                <p className="text-apple-mid text-[11px]">{review.city}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

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
    </section>
  );
}
