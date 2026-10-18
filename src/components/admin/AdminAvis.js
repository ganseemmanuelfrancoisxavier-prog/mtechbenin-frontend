"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, X, Star, MessageSquare, Eye, RefreshCw } from "lucide-react";
import { reviewsApi } from "@/lib/api";
import ReviewPhotos from "@/components/shop/ReviewPhotos";
import useSondagePeriodique from "@/hooks/useSondagePeriodique";

export default function AdminAvis() {
  const [reviews, setReviews] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(false);

  // ── Charge pending + approuvés depuis l'API ───────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [pendingData, approvedData] = await Promise.all([
        reviewsApi.getPending(),
        reviewsApi.getApproved(), // ← tous les approuvés, pas juste featured
      ]);
      const pending = (pendingData.reviews || []).map((r) => ({
        ...r,
        approved: false,
      }));
      const approved = (approvedData.reviews || []).map((r) => ({
        ...r,
        approved: true,
      }));
      const all = [...pending];
      approved.forEach((r) => {
        if (!all.find((x) => x.id === r.id)) all.push(r);
      });
      setReviews(all);
    } catch (err) {
      console.error("Erreur chargement avis", err.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Suspendu quand l'onglet n'est pas visible : un panneau laissé ouvert
  // interrogeait la base indéfiniment pour un écran que personne ne regarde.
  useSondagePeriodique(loadAll, 120_000);

  const pending = reviews.filter((r) => !r.approved);
  const approved = reviews.filter((r) => r.approved);
  const displayed = filter === "pending" ? pending : approved;

  // ── Actions via API ───────────────────────────────────────────────────────
  const handleApprove = async (id) => {
    try {
      await reviewsApi.approve(id);
      await loadAll();
    } catch (err) {
      console.error("Erreur approveReview", err.message);
    }
  };

  const handleReject = async (id) => {
    try {
      await reviewsApi.delete(id);
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error("Erreur rejectReview", err.message);
    }
  };

  const handleToggleFeatured = async (id) => {
    try {
      await reviewsApi.featured(id);
      await loadAll();
    } catch (err) {
      console.error("Erreur toggleFeatured", err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-black text-2xl text-apple-black tracking-tight">
            Avis clients
          </h1>
          <p className="text-apple-mid text-[13px] mt-1">
            {loading
              ? "Chargement..."
              : `${pending.length} en attente · ${approved.length} approuvés`}
          </p>
        </div>
        <button
          onClick={loadAll}
          disabled={loading}
          className="flex items-center gap-2 text-[13px] text-apple-mid hover:text-apple-black transition px-3 py-2.5 rounded-xl bg-black/[0.03] border border-black/[0.06] disabled:opacity-50"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
          />{" "}
          Actualiser
        </button>
      </div>

      {pending.length > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-orange-50 border border-orange-100">
          <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse flex-shrink-0" />
          <p className="text-[13px] text-orange-700 font-medium">
            {pending.length} avis en attente de modération
          </p>
        </div>
      )}

      <div className="flex gap-2">
        {[
          { key: "pending", label: `En attente (${pending.length})` },
          { key: "approved", label: `Approuvés (${approved.length})` },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-2xl text-[13px] font-semibold transition-all ${filter === f.key ? "bg-apple-black text-white" : "bg-black/[0.04] text-apple-mid hover:bg-black/[0.07]"}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {loading && displayed.length === 0 ? (
          <div className="glass-card rounded-3xl p-12 text-center">
            <div className="w-6 h-6 border-2 border-black/20 border-t-black/70 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-apple-mid text-[13px]">Chargement des avis...</p>
          </div>
        ) : displayed.length === 0 ? (
          <div className="glass-card rounded-3xl p-12 text-center">
            <MessageSquare
              className="w-10 h-10 text-apple-mid/30 mx-auto mb-3"
              strokeWidth={1}
            />
            <p className="text-apple-mid text-[13px]">
              {filter === "pending"
                ? "Aucun avis en attente"
                : "Aucun avis approuvé"}
            </p>
          </div>
        ) : (
          displayed.map((review) => (
            <div key={review.id} className="glass-card rounded-3xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-apple-black flex items-center justify-center text-white font-bold text-[13px] flex-shrink-0">
                    {review.name?.charAt(0) || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-apple-black text-[13px]">
                        {review.name}
                      </p>
                      {review.city && (
                        <span className="text-apple-mid text-[11px]">
                          {review.city}
                        </span>
                      )}
                      {review.city && (
                        <span className="text-apple-mid text-[11px]">·</span>
                      )}
                      <span className="text-apple-mid text-[11px]">
                        {review.date}
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5 mb-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${s <= review.rating ? "fill-cta text-cta" : "text-black/10"}`}
                          strokeWidth={s <= review.rating ? 0 : 1.5}
                        />
                      ))}
                    </div>
                    <p className="text-apple-mid text-[13px] leading-relaxed mb-2">
                      {review.text}
                    </p>
                    {/* Les photos doivent être visibles AVANT d'approuver :
                        c'est le seul moment où elles sont modérées. */}
                    <ReviewPhotos
                      photos={review.photos}
                      auteur={review.name}
                      taille="sm"
                    />
                    <p className="text-[11px] text-apple-mid/60 font-mono mt-2">
                      Produit : {review.productName}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 flex-shrink-0">
                  {!review.approved ? (
                    <>
                      <button
                        onClick={() => handleApprove(review.id)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-50 text-green-600 hover:bg-green-100 transition text-[12px] font-semibold"
                      >
                        <Check className="w-3.5 h-3.5" /> Approuver
                      </button>
                      <button
                        onClick={() => handleReject(review.id)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition text-[12px] font-semibold"
                      >
                        <X className="w-3.5 h-3.5" /> Rejeter
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleToggleFeatured(review.id)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition text-[12px] font-semibold ${
                          review.featured
                            ? "bg-orange-50 text-orange-500 hover:bg-orange-100"
                            : "bg-black/[0.04] text-apple-mid hover:bg-black/[0.07]"
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {review.featured ? "Sur accueil" : "Accueil"}
                      </button>
                      <button
                        onClick={() => handleReject(review.id)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition text-[12px] font-semibold"
                      >
                        <X className="w-3.5 h-3.5" /> Supprimer
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
