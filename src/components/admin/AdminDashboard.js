"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  TrendingUp,
  Package,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  Clock,
  Truck,
  PackageCheck,
  XCircle,
} from "lucide-react";
import { formatPrice } from "@/lib/format";
import { statsApi } from "@/lib/api";
import useSondagePeriodique from "@/hooks/useSondagePeriodique";

const STATUS = {
  confirmed: { label: "Confirmée", bg: "bg-blue-50", text: "text-blue-600", icon: CheckCircle },
  preparing: { label: "Préparation", bg: "bg-orange-50", text: "text-orange-500", icon: Clock },
  shipped: { label: "En livraison", bg: "bg-purple-50", text: "text-purple-600", icon: Truck },
  delivered: { label: "Livrée", bg: "bg-green-50", text: "text-green-600", icon: PackageCheck },
  cancelled: { label: "Annulée", bg: "bg-red-50", text: "text-red-500", icon: XCircle },
};
const normalize = (s) => (s || "confirmed").toLowerCase();

function Sk({ w = "w-full", h = "h-3.5", rounded = "rounded-full" }) {
  return <div className={`animate-pulse bg-black/[0.07] ${w} ${h} ${rounded}`} />;
}

function StatSkeleton() {
  return (
    <div className="glass-card rounded-3xl p-5">
      <div className="w-9 h-9 bg-black/[0.06] rounded-2xl animate-pulse mb-4" />
      <Sk w="w-20" h="h-6" rounded="rounded-xl" />
      <div className="mt-1.5">
        <Sk w="w-28" h="h-2.5" />
      </div>
    </div>
  );
}

function OrderRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-2 py-3 animate-pulse">
      <div className="w-8 h-8 bg-black/[0.06] rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Sk w="w-1/2" />
        <Sk w="w-1/3" h="h-2.5" />
      </div>
      <div className="text-right space-y-1.5">
        <Sk w="w-16" />
        <Sk w="w-14" h="h-2.5" />
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [donnees, setDonnees] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(false);

  // Un seul appel, quelques centaines d'octets. Auparavant : 500 produits et
  // 250 commandes entiers — 141 Ko — pour n'en tirer que des totaux et douze
  // lignes. Les comptes se font désormais dans Postgres.
  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(false);
    try {
      setDonnees(await statsApi.dashboard());
      setLastUpdated(new Date());
    } catch {
      setError(true);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  // Premier chargement
  useEffect(() => {
    load();
  }, [load]);

  // Rafraîchissement toutes les 30 s — suspendu tant que l'onglet n'est pas
  // visible, et rattrapé au retour.
  const rafraichir = useCallback(() => load(true), [load]);
  useSondagePeriodique(rafraichir, 30_000);

  // Le serveur a fait les comptes ; il ne reste qu'à les nommer. En
  // particulier, le chiffre d'affaires porte maintenant sur TOUTES les
  // commandes : additionné ici, il ne portait que sur les 250 rapatriées.
  const lowStockProducts = donnees?.stockFaible ?? [];
  const topProducts = donnees?.meilleuresVentes ?? [];
  const recentOrders = donnees?.commandesRecentes ?? [];
  const totalRevenue = donnees?.commandes?.chiffreAffaires ?? 0;
  const totalOrders = donnees?.commandes?.total ?? 0;
  const activeProducts = donnees?.produits?.actifs ?? 0;
  const lowStockCount = donnees?.produits?.stockFaible ?? 0;

  const stats = [
    { label: "Revenus", value: formatPrice(totalRevenue), icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
    { label: "Commandes", value: totalOrders, icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Produits actifs", value: activeProducts, icon: Package, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Stock faible", value: lowStockCount, icon: AlertTriangle, color: lowStockCount > 0 ? "text-cta" : "text-green-600", bg: lowStockCount > 0 ? "bg-red-50" : "bg-green-50" },
  ];

  const formatTime = (d) =>
    d
      ? d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
      : "";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-black text-2xl text-apple-black tracking-tight">
            Tableau de bord
          </h1>
          {lastUpdated && (
            <p className="text-apple-mid text-[12px] mt-0.5 flex items-center gap-1.5">
              {refreshing ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" /> Actualisation…
                </>
              ) : (
                <>Mis à jour à {formatTime(lastUpdated)}</>
              )}
            </p>
          )}
        </div>
        <button
          onClick={() => load()}
          disabled={loading || refreshing}
          className="flex items-center gap-2 text-[13px] text-apple-mid hover:text-apple-black transition px-3 py-2.5 rounded-xl bg-black/[0.03] border border-black/[0.06] disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${(loading || refreshing) ? "animate-spin" : ""}`} />
          Actualiser
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 border border-red-100">
          <AlertTriangle className="w-4 h-4 text-cta flex-shrink-0" />
          <p className="text-[13px] text-cta flex-1">Impossible de charger les données.</p>
          <button onClick={() => load()} className="text-[12px] font-semibold text-cta underline">
            Réessayer
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
          : stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="glass-card rounded-3xl p-5">
                  <div className={`w-9 h-9 ${stat.bg} rounded-2xl flex items-center justify-center mb-4`}>
                    <Icon className={`w-4 h-4 ${stat.color}`} strokeWidth={1.8} />
                  </div>
                  <p className="font-display font-black text-xl text-apple-black tracking-tight">
                    {stat.value}
                  </p>
                  <p className="text-apple-mid text-[12px] mt-0.5">{stat.label}</p>
                </div>
              );
            })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Commandes récentes */}
        <div className="lg:col-span-2 glass-card rounded-3xl p-5">
          <div className="flex items-center justify-between mb-5">
            <p className="font-display font-bold text-[15px] text-apple-black">
              Commandes récentes
            </p>
            <Link
              href="/admin/commandes"
              className="flex items-center gap-0.5 text-[12px] text-apple-mid hover:text-apple-black transition-colors"
            >
              Voir tout <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-0.5">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <OrderRowSkeleton key={i} />)
            ) : recentOrders.length === 0 ? (
              <div className="text-center py-10">
                <ShoppingBag className="w-8 h-8 text-apple-mid/25 mx-auto mb-2" strokeWidth={1} />
                <p className="text-apple-mid text-[13px]">Aucune commande en base</p>
              </div>
            ) : (
              recentOrders.map((order) => {
                const key = normalize(order.status);
                const s = STATUS[key] || STATUS.confirmed;
                const Icon = s.icon;
                return (
                  <Link
                    key={order.id || order.reference}
                    href="/admin/commandes"
                    className="flex items-center gap-3 py-3 px-2 rounded-2xl hover:bg-black/[0.025] transition-colors"
                  >
                    <div className={`w-8 h-8 ${s.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-3.5 h-3.5 ${s.text}`} strokeWidth={1.8} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-apple-black text-[13px] truncate">
                        {order.guestName || order.client?.name || "—"}
                      </p>
                      <p className="text-apple-mid text-[11px] font-mono">
                        {order.reference || order.id}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-apple-black text-[13px]">
                        {formatPrice(order.total)}
                      </p>
                      <span className={`text-[10px] font-semibold ${s.text}`}>
                        {s.label}
                      </span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Top produits */}
        <div className="glass-card rounded-3xl p-5">
          <p className="font-display font-bold text-[15px] text-apple-black mb-5">
            Top produits
          </p>
          <div className="space-y-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 animate-pulse">
                  <div className="w-5 h-5 bg-black/[0.06] rounded flex-shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-1.5">
                    <Sk w="w-3/4" />
                    <Sk w="w-1/2" h="h-2.5" />
                    <div className="h-1 bg-black/[0.06] rounded-full mt-2" />
                  </div>
                </div>
              ))
            ) : topProducts.length === 0 ? (
              <p className="text-apple-mid text-[12px] text-center py-4">
                Aucune donnée de vente
              </p>
            ) : (
              topProducts.map((product, i) => {
                const maxSales = Math.max(...topProducts.map((p) => p.sales), 1);
                return (
                  <div key={product.name} className="flex items-start gap-3">
                    <span className="font-display font-black text-[14px] text-neutral-300 w-5 flex-shrink-0 mt-0.5 text-center">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-apple-black text-[12px] leading-snug truncate">
                        {product.name}
                      </p>
                      <p className="text-apple-mid text-[11px] mt-0.5">
                        {product.sales} ventes · {formatPrice(product.revenue)}
                      </p>
                      <div className="mt-1.5 h-1 bg-black/[0.06] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-apple-black rounded-full transition-all duration-700"
                          style={{ width: `${Math.max((product.sales / maxSales) * 100, 5)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Stock faible */}
      <div className="glass-card rounded-3xl p-5">
        <div className="flex items-center gap-2 mb-4">
          {!loading && lowStockProducts.length > 0 && (
            <div className="w-1.5 h-1.5 bg-cta rounded-full animate-pulse" />
          )}
          <p className="font-display font-bold text-[15px] text-apple-black">
            Stock faible
          </p>
          {!loading && lowStockProducts.length > 0 && (
            <Link
              href="/admin/produits"
              className="ml-auto text-[12px] text-apple-mid hover:text-apple-black transition-colors flex items-center gap-0.5"
            >
              Gérer <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 bg-black/[0.05] rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : lowStockProducts.length === 0 ? (
          <div className="flex items-center gap-2 py-2">
            <div className="w-5 h-5 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-green-500 text-[11px]">✓</span>
            </div>
            <p className="text-apple-mid text-[13px]">Tous les stocks sont suffisants</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {lowStockProducts.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-2xl px-4 py-3"
                style={{
                  background: item.stock === 0 ? "rgba(227,6,19,0.07)" : "rgba(227,6,19,0.04)",
                  border: "1px solid rgba(227,6,19,0.10)",
                }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <AlertTriangle className="w-3.5 h-3.5 text-cta flex-shrink-0" strokeWidth={1.8} />
                  <span className="text-[12px] font-medium text-apple-black truncate">
                    {item.name}
                  </span>
                </div>
                <span className="text-cta font-bold text-[12px] flex-shrink-0 ml-2">
                  {item.stock === 0 ? "Rupture" : `${item.stock} restant${item.stock > 1 ? "s" : ""}`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
