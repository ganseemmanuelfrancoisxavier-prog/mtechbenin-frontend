"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Star, Quote, ArrowLeft, ImageIcon, Loader2 } from "lucide-react";
import ShopLayout from "@/components/layout/ShopLayout";
import ReviewPhotos from "@/components/shop/ReviewPhotos";
import { reviewsApi } from "@/lib/api";

const PAR_PAGE = 12;

const FILTRES = [
  { cle: "tous", label: "Tous", params: {} },
  { cle: "photos", label: "Avec photos", params: { withPhotos: "true" } },
  { cle: "cinq", label: "5 étoiles", params: { minRating: 5 } },
];

export default function AvisPage() {
  const [filtre, setFiltre] = useState("tous");
  const [avis, setAvis] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [moyenne, setMoyenne] = useState(0);
  const [totalApprouves, setTotalApprouves] = useState(0);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  // Numéro de la dernière demande émise. En enchaînant les filtres, une réponse
  // lente peut revenir après une plus récente : on ignore alors la périmée.
  const demandeRef = useRef(0);

  const charger = useCallback(async (cleFiltre, numeroPage) => {
    const demande = ++demandeRef.current;
    setChargement(true);
    setErreur("");
    try {
      const { params } = FILTRES.find((f) => f.cle === cleFiltre) || FILTRES[0];
      const data = await reviewsApi.getPublic({
        page: numeroPage,
        limit: PAR_PAGE,
        ...params,
      });
      if (demande !== demandeRef.current) return;
      // Page 1 remplace, les suivantes s'ajoutent : c'est un « charger plus ».
      setAvis((prec) =>
        numeroPage === 1 ? data.reviews || [] : [...prec, ...(data.reviews || [])],
      );
      setTotal(data.total || 0);
      setMoyenne(data.moyenne || 0);
      setTotalApprouves(data.totalApprouves || 0);
    } catch (err) {
      if (demande !== demandeRef.current) return;
      setErreur(err.message || "Impossible de charger les avis pour le moment.");
    } finally {
      if (demande === demandeRef.current) setChargement(false);
    }
  }, []);

  useEffect(() => {
    charger(filtre, page);
  }, [charger, filtre, page]);

  const changerFiltre = (cle) => {
    if (cle === filtre) return;
    setFiltre(cle);
    setPage(1);
  };

  // Le filtre « avec photos » écarte des lignes après lecture (voir le
  // contrôleur) : le total annoncé par le serveur peut donc dépasser ce qu'on
  // a réellement reçu. On se fie au nombre de pages demandées.
  const resteDesPages = page * PAR_PAGE < total;

  return (
    <ShopLayout>
      <div className="max-w-5xl mx-auto px-5 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-apple-mid hover:text-apple-black text-[13px] mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à l&apos;accueil
        </Link>

        {/* En-tête */}
        <div className="mb-10">
          <p className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-2">
            Témoignages
          </p>
          <h1 className="font-display font-black text-3xl md:text-4xl text-apple-black tracking-tight mb-4">
            Ce que disent nos clients
          </h1>
          {totalApprouves > 0 && (
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${s <= Math.round(moyenne) ? "fill-cta text-cta" : "text-black/10"}`}
                  />
                ))}
              </div>
              <span className="font-semibold text-apple-black text-[14px]">
                {moyenne}/5
              </span>
              <span className="text-apple-mid text-[13px]">
                · {totalApprouves} avis vérifiés
              </span>
            </div>
          )}
        </div>

        {/* Filtres */}
        <div className="flex flex-wrap gap-2 mb-8">
          {FILTRES.map((f) => (
            <button
              key={f.cle}
              type="button"
              onClick={() => changerFiltre(f.cle)}
              className={`px-4 py-2 rounded-full text-[13px] font-medium transition-all ${
                filtre === f.cle
                  ? "bg-apple-black text-white"
                  : "bg-black/[0.04] text-apple-mid hover:bg-black/[0.07]"
              }`}
            >
              {f.cle === "photos" && (
                <ImageIcon className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" />
              )}
              {f.label}
            </button>
          ))}
        </div>

        {erreur && (
          <div className="glass-card rounded-3xl p-6 text-center mb-6">
            <p className="text-red-500 text-[13px]">{erreur}</p>
          </div>
        )}

        {/* Liste */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {avis.map((review) => (
            <div
              key={review.id}
              className="glass-card rounded-3xl p-6 flex flex-col gap-4 relative overflow-hidden"
            >
              <Quote
                className="absolute top-4 right-4 w-8 h-8 text-black/[0.04]"
                strokeWidth={1}
              />
              <div className="flex items-center gap-3 pr-8">
                <div className="w-10 h-10 rounded-full bg-apple-black flex items-center justify-center text-white font-bold text-[14px] flex-shrink-0">
                  {review.name?.charAt(0) || "?"}
                </div>
                <div>
                  <p className="font-semibold text-apple-black text-[15px] leading-tight">
                    {review.name}
                  </p>
                  <p className="mt-1 text-apple-mid text-[12px]">
                    {[review.city, review.date].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </div>
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
                <ReviewPhotos photos={review.photos} auteur={review.name} />
              </div>

              {review.productSlug && review.productName && (
                <Link
                  href={`/produit/${review.productSlug}`}
                  className="text-[11px] bg-black/[0.04] hover:bg-black/[0.07] text-apple-mid px-3 py-1 rounded-full self-start font-medium transition-colors"
                >
                  {review.productName}
                </Link>
              )}

            </div>
          ))}
        </div>

        {chargement && (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 text-apple-mid animate-spin" />
          </div>
        )}

        {!chargement && avis.length === 0 && !erreur && (
          <div className="glass-card rounded-3xl py-16 text-center">
            <p className="text-apple-black font-semibold text-[14px] mb-1">
              Aucun avis dans cette sélection
            </p>
            <p className="text-apple-mid text-[13px]">
              Essayez un autre filtre pour voir plus de témoignages.
            </p>
          </div>
        )}

        {!chargement && resteDesPages && (
          <div className="flex justify-center mt-10">
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              className="px-7 py-3.5 rounded-full bg-black/[0.04] hover:bg-black/[0.07] text-apple-black text-[13px] font-semibold transition-all"
            >
              Charger plus d&apos;avis
            </button>
          </div>
        )}
      </div>
    </ShopLayout>
  );
}
