"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  CheckCircle,
  Clock,
  Package,
  Truck,
  Home,
  ArrowRight,
  Search,
  MessageCircle,
} from "lucide-react";
import { formatPrice } from "@/lib/format";
import { ordersApi } from "@/lib/api";
import useOrderStore from "@/store/orderStore";
import useSettingsStore from "@/store/settingsStore";
import useSondagePeriodique from "@/hooks/useSondagePeriodique";

const statusSteps = [
  {
    id: "CONFIRMED",
    label: "Paiement confirmé",
    desc: "Votre paiement a été validé avec succès",
    icon: CheckCircle,
    color: "text-blue-500",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  {
    id: "PREPARING",
    label: "En préparation",
    desc: "Votre commande est en cours de préparation",
    icon: Package,
    color: "text-orange-500",
    bg: "bg-orange-50",
    border: "border-orange-200",
  },
  {
    id: "SHIPPED",
    label: "En livraison",
    desc: "Votre livreur est en route vers vous",
    icon: Truck,
    color: "text-purple-500",
    bg: "bg-purple-50",
    border: "border-purple-200",
  },
  {
    id: "DELIVERED",
    label: "Livrée",
    desc: "Votre commande a été livrée avec succès",
    icon: Home,
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200",
  },
];

// Gère les statuts en minuscules (store local) ET majuscules (API backend)
const statusBadge = {
  CONFIRMED: {
    bg: "bg-blue-50",
    text: "text-blue-600",
    label: "Paiement confirmé",
  },
  PREPARING: {
    bg: "bg-orange-50",
    text: "text-orange-500",
    label: "En préparation",
  },
  SHIPPED: {
    bg: "bg-purple-50",
    text: "text-purple-600",
    label: "En livraison",
  },
  DELIVERED: { bg: "bg-green-50", text: "text-green-600", label: "Livrée" },
  CANCELLED: { bg: "bg-red-50", text: "text-red-500", label: "Annulée" },
  // Aliases minuscules (store local)
  confirmed: {
    bg: "bg-blue-50",
    text: "text-blue-600",
    label: "Paiement confirmé",
  },
  preparing: {
    bg: "bg-orange-50",
    text: "text-orange-500",
    label: "En préparation",
  },
  shipped: {
    bg: "bg-purple-50",
    text: "text-purple-600",
    label: "En livraison",
  },
  delivered: { bg: "bg-green-50", text: "text-green-600", label: "Livrée" },
  cancelled: { bg: "bg-red-50", text: "text-red-500", label: "Annulée" },
};

function getStepIndex(status) {
  const s = status?.toUpperCase();
  if (s === "CANCELLED") return -1;
  return statusSteps.findIndex((step) => step.id === s);
}

// Normalise une commande API (backend) vers le format attendu par le composant
function normalizeApiOrder(apiOrder) {
  return {
    id: apiOrder.reference,
    status: apiOrder.status,
    date: apiOrder.createdAt,
    total: apiOrder.total,
    address: [apiOrder.neighborhood, apiOrder.city].filter(Boolean).join(", "),
    note: apiOrder.instructions || "",
    client: { name: apiOrder.guestName, phone: apiOrder.guestWhatsapp },
    items: (apiOrder.items || []).map((i) => ({
      name: i.productName,
      qty: i.quantity,
      price: i.unitPrice,
    })),
  };
}

export default function SuiviPage({ reference }) {
  const [mounted, setMounted] = useState(false);
  const [searchRef, setSearchRef] = useState(reference || "");
  const [order, setOrder] = useState(null);
  const [searched, setSearched] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);

  const { getOrderById } = useOrderStore();
  const { shopWhatsapp } = useSettingsStore();

  // Recherche — API en priorité, store local en fallback
  const searchOrder = async (ref) => {
    if (!ref?.trim()) return;
    setLoading(true);
    setNotFound(false);

    try {
      // 1. Cherche dans l'API (source principale — base de données)
      const data = await ordersApi.getByRef(ref.trim().toUpperCase());
      setOrder(normalizeApiOrder(data.order));
      setSearched(true);
      setNotFound(false);
    } catch {
      // 2. Fallback — store local (commandes récentes non encore synchronisées)
      const found = getOrderById(ref.trim().toUpperCase());
      setOrder(found || null);
      setSearched(true);
      setNotFound(!found);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    if (reference) searchOrder(reference);
  }, []);

  // Re-vérifie le statut toutes les 30 s tant qu'une commande est affichée —
  // et uniquement pendant que la page est réellement regardée. Un client qui
  // laisse l'onglet de suivi ouvert en arrière-plan n'interroge plus rien.
  const rafraichirSuivi = useCallback(() => {
    if (!order?.id || !mounted) return;
    searchOrder(order.id);
  }, [order?.id, mounted]);

  useSondagePeriodique(rafraichirSuivi, 30_000);

  const handleSearch = () => searchOrder(searchRef);

  const whatsappVendeur = `https://wa.me/${(shopWhatsapp || "+22961151561").replace(/\s/g, "")}`;
  const currentStepIndex = order ? getStepIndex(order.status) : -1;
  const badge = order
    ? statusBadge[order.status] || statusBadge.CONFIRMED
    : null;

  return (
    <div className="max-w-3xl mx-auto px-5 py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="font-display font-black text-3xl md:text-4xl text-apple-black mb-3 tracking-tight">
          Suivi de commande
        </h1>
        <p className="text-apple-mid text-[14px]">
          Entrez votre référence de commande pour suivre votre livraison en
          temps réel
        </p>
      </div>

      {/* Barre de recherche */}
      <div className="glass-card rounded-3xl p-5 mb-8">
        <div className="flex gap-3">
          <input
            value={searchRef}
            onChange={(e) => setSearchRef(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Ex: MTECH-2026-12345"
            className="flex-1 bg-black/[0.03] rounded-2xl px-4 py-3 text-[14px] font-mono focus:outline-none focus:border-black/20 border border-black/[0.07] text-apple-black placeholder-apple-mid/50 transition"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="flex items-center gap-2 bg-apple-black hover:bg-neutral-800 text-white font-semibold px-6 py-3 rounded-2xl transition-all active:scale-95 disabled:opacity-60"
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">
              {loading ? "Recherche..." : "Rechercher"}
            </span>
          </button>
        </div>
      </div>

      {/* ── Résultat trouvé ─────────────────────────────────────────────── */}
      {searched && order && (
        <div className="space-y-5">
          {/* Infos commande */}
          <div className="glass-card rounded-3xl p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-[11px] text-apple-mid font-semibold uppercase tracking-widest mb-1">
                  Référence
                </p>
                <p className="font-display font-black text-[18px] text-apple-black tracking-tight font-mono">
                  {order.id}
                </p>
              </div>
              {badge && (
                <span
                  className={`text-[11px] font-semibold px-3 py-1.5 rounded-full ${badge.bg} ${badge.text}`}
                >
                  {badge.label}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Client", value: order.client?.name },
                {
                  label: "Date",
                  value: new Date(order.date).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  }),
                },
                { label: "Livraison", value: order.address },
                ...(order.note ? [{ label: "Note", value: order.note }] : []),
              ].map((row) => (
                <div key={row.label}>
                  <p className="text-apple-mid text-[11px] mb-0.5">
                    {row.label}
                  </p>
                  <p className="font-medium text-apple-black text-[13px]">
                    {row.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline statut */}
          {order.status?.toUpperCase() === "CANCELLED" ? (
            <div className="glass-card rounded-3xl p-6 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">❌</span>
              </div>
              <h3 className="font-display font-bold text-lg text-apple-black mb-2">
                Commande annulée
              </h3>
              <p className="text-apple-mid text-[13px]">
                Cette commande a été annulée. Contactez-nous si vous avez des
                questions.
              </p>
            </div>
          ) : (
            <div className="glass-card rounded-3xl p-6">
              <h3 className="font-display font-bold text-lg text-apple-black mb-6">
                Progression de votre commande
              </h3>
              <div className="space-y-0">
                {statusSteps.map((step, index) => {
                  const isCompleted = index <= currentStepIndex;
                  const isCurrent = index === currentStepIndex;
                  const isLast = index === statusSteps.length - 1;
                  const Icon = step.icon;

                  return (
                    <div key={step.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all ${
                            isCompleted
                              ? `${step.bg} ${step.border}`
                              : "bg-black/[0.03] border-black/[0.08]"
                          } ${isCurrent ? "ring-4 ring-black/10 scale-110" : ""}`}
                        >
                          <Icon
                            className={`w-5 h-5 ${isCompleted ? step.color : "text-apple-mid"}`}
                          />
                        </div>
                        {!isLast && (
                          <div
                            className={`w-0.5 h-10 my-1 transition-all ${index < currentStepIndex ? "bg-green-400" : "bg-black/[0.06]"}`}
                          />
                        )}
                      </div>

                      <div className={`pb-6 flex-1 ${isLast ? "pb-0" : ""}`}>
                        <div className="flex items-center gap-2 mb-0.5">
                          <p
                            className={`font-semibold text-[13px] ${isCompleted ? "text-apple-black" : "text-apple-mid"}`}
                          >
                            {step.label}
                          </p>
                          {isCurrent && (
                            <span className="flex items-center gap-1 text-[11px] text-cta font-medium">
                              <span className="w-1.5 h-1.5 bg-cta rounded-full animate-pulse" />
                              En cours
                            </span>
                          )}
                        </div>
                        <p
                          className={`text-[12px] ${isCompleted ? "text-apple-mid" : "text-apple-mid/40"}`}
                        >
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Articles */}
          <div className="glass-card rounded-3xl p-6">
            <h3 className="font-semibold text-apple-black text-[14px] mb-4">
              Articles commandés
            </h3>
            <div className="space-y-2.5">
              {order.items?.map((item, i) => (
                <div key={i} className="flex justify-between text-[13px]">
                  <span className="text-apple-mid">
                    {item.name} × {item.qty}
                  </span>
                  <span className="font-semibold text-apple-black">
                    {formatPrice(item.price * item.qty)}
                  </span>
                </div>
              ))}
              <div className="border-t border-black/[0.06] pt-2.5 flex justify-between font-bold text-[14px]">
                <span className="text-apple-black">Total</span>
                <span className="text-apple-black">
                  {formatPrice(order.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Contact vendeur */}
          <div className="glass-card rounded-3xl p-5 flex items-center justify-between">
            <div>
              <p className="font-semibold text-apple-black text-[13px]">
                Un problème ?
              </p>
              <p className="text-apple-mid text-[11px] mt-0.5">
                Contactez-nous sur WhatsApp —{" "}
                {shopWhatsapp || "+229 61 15 15 61"}
              </p>
            </div>
            <a
              href={whatsappVendeur}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-5 py-3 rounded-2xl transition text-[13px]"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </a>
          </div>
        </div>
      )}

      {/* Commande introuvable */}
      {searched && notFound && (
        <div className="text-center py-12 glass-card rounded-3xl">
          <p className="text-4xl mb-4">🔍</p>
          <p className="font-display font-bold text-lg text-apple-black mb-2">
            Commande introuvable
          </p>
          <p className="text-apple-mid text-[13px] mb-6">
            Vérifiez votre référence et réessayez.
            <br />
            Format attendu : <span className="font-mono">MTECH-2026-XXXXX</span>
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-apple-black text-white font-semibold px-6 py-3 rounded-2xl text-[13px] hover:bg-neutral-800 transition"
          >
            Retour à l&apos;accueil <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
