"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Eye,
  ChevronDown,
  X,
  ShoppingBag,
  MapPin,
  Clock,
  CheckCircle,
  Truck,
  PackageCheck,
  XCircle,
  MessageCircle,
  RefreshCw,
} from "lucide-react";
import { formatPrice } from "@/lib/format";
import { ordersApi } from "@/lib/api";
import { settingsApi } from "@/lib/api";
import useSondagePeriodique from "@/hooks/useSondagePeriodique";

const statusConfig = {
  // Une commande « en attente » n'a jamais abouti au paiement. Sans cette
  // entrée, elle retombait sur la configuration « Confirmée » par défaut et
  // s'affichait donc comme payée — exactement l'inverse de la réalité.
  pending: {
    label: "Paiement non abouti",
    icon: Clock,
    bg: "bg-neutral-100",
    text: "text-neutral-500",
    border: "border-neutral-200",
  },
  confirmed: {
    label: "Confirmée",
    icon: CheckCircle,
    bg: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-100",
  },
  preparing: {
    label: "Préparation",
    icon: Clock,
    bg: "bg-orange-50",
    text: "text-orange-500",
    border: "border-orange-100",
  },
  shipped: {
    label: "En livraison",
    icon: Truck,
    bg: "bg-purple-50",
    text: "text-purple-600",
    border: "border-purple-100",
  },
  delivered: {
    label: "Livrée",
    icon: PackageCheck,
    bg: "bg-green-50",
    text: "text-green-600",
    border: "border-green-100",
  },
  cancelled: {
    label: "Annulée",
    icon: XCircle,
    bg: "bg-red-50",
    text: "text-red-500",
    border: "border-red-100",
  },
  CONFIRMED: {
    label: "Confirmée",
    icon: CheckCircle,
    bg: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-100",
  },
  PREPARING: {
    label: "Préparation",
    icon: Clock,
    bg: "bg-orange-50",
    text: "text-orange-500",
    border: "border-orange-100",
  },
  SHIPPED: {
    label: "En livraison",
    icon: Truck,
    bg: "bg-purple-50",
    text: "text-purple-600",
    border: "border-purple-100",
  },
  DELIVERED: {
    label: "Livrée",
    icon: PackageCheck,
    bg: "bg-green-50",
    text: "text-green-600",
    border: "border-green-100",
  },
  CANCELLED: {
    label: "Annulée",
    icon: XCircle,
    bg: "bg-red-50",
    text: "text-red-500",
    border: "border-red-100",
  },
};

const statusOrder = [
  "confirmed",
  "preparing",
  "shipped",
  "delivered",
  "cancelled",
];

// Valeurs du sélecteur qui ne sont pas des statuts : « payées » masque les
// commandes dont le paiement n'a jamais abouti, « tous » ne masque rien.
// C'est « payées » qui s'applique à l'ouverture de l'écran — les paniers
// abandonnés sont du bruit au quotidien, mais restent accessibles en un clic
// pour relancer les clients concernés.
const FILTRE_PAYEES = "payees";
const FILTRE_TOUS = "tous";

// ── Normalise une commande API vers le format attendu par le panel ─────────────
function normalizeOrder(o) {
  return {
    id: o.reference || o.id,
    dbId: o.id,
    status: (o.status || "confirmed").toLowerCase(),
    total: o.total || 0,
    date: o.createdAt || new Date().toISOString(),
    address: [o.neighborhood, o.city].filter(Boolean).join(", "),
    note: o.instructions || "",
    slot: o.deliverySlot || "",
    isGift: o.isGift || false,
    giftName: o.giftName || "",
    coords: o.deliveryLat ? { lat: o.deliveryLat, lng: o.deliveryLng } : null,
    client: {
      name: o.guestName || "—",
      phone: o.guestWhatsapp || "—",
      email: o.guestEmail || "",
    },
    items: (o.items || []).map((item) => ({
      name: item.productName || item.name,
      qty: item.quantity || item.qty || 1,
      price: item.unitPrice || item.price || 0,
      variants: Array.isArray(item.variants) ? item.variants : [],
    })),
  };
}

export default function AdminCommandes() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState(FILTRE_PAYEES);
  const [selected, setSelected] = useState(null);
  const [shopWhatsapp, setShopWhatsapp] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  // ── Charge les commandes depuis l'API ─────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ordersApi.getAll({ limit: 250 });
      setOrders((data.orders || []).map(normalizeOrder));
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Erreur chargement commandes", err.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAll();
    settingsApi
      .getPublic()
      .then((d) => {
        if (d.settings?.shopWhatsapp) setShopWhatsapp(d.settings.shopWhatsapp);
      })
      .catch(() => {});
  }, [loadAll]);

  // Rafraîchissement toutes les 60 s, suspendu quand l'onglet n'est pas
  // visible et rattrapé au retour.
  useSondagePeriodique(loadAll, 60_000);

  const filtered = orders.filter((o) => {
    const matchSearch =
      o.client.name.toLowerCase().includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      filterStatus === FILTRE_TOUS
        ? true
        : filterStatus === FILTRE_PAYEES
          ? o.status !== "pending"
          : o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // ── Change le statut via l'API ────────────────────────────────────────────
  const handleStatusChange = async (order, newStatus) => {
    try {
      // order.id = référence (ex: CMD-XXXX) — le backend cherche par reference
      await ordersApi.updateStatus(
        order.id,
        newStatus.toUpperCase(),
      );
      // Mise à jour optimiste locale
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: newStatus } : o)),
      );
      setSelected((prev) =>
        prev?.id === order.id ? { ...prev, status: newStatus } : prev,
      );
    } catch (err) {
      console.error("Erreur changement statut", err.message);
    }
  };

  const buildWhatsAppClient = (order) => {
    const phone = order.client.phone.replace(/\s/g, "");
    const s = statusConfig[order.status];
    const msg = encodeURIComponent(
      `Bonjour ${order.client.name} 👋\n\n` +
        `Votre commande *${order.id}* est maintenant : *${s?.label}*.\n\n` +
        `🔗 Suivez votre commande ici : ${typeof window !== "undefined" ? window.location.origin : "https://mtechbenin.com"}/suivi/${order.id}\n\n` +
        `Merci pour votre confiance — MTECHBENIN 🛍️`,
    );
    return `https://wa.me/${phone}?text=${msg}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-black text-2xl text-apple-black tracking-tight">
            Commandes
          </h1>
          <p className="text-apple-mid text-[13px] mt-1 flex items-center gap-1.5">
            {loading ? (
              <><RefreshCw className="w-3 h-3 animate-spin" /> Chargement…</>
            ) : (
              <>
                {/* Le compteur suit le filtre : annoncer le total brut
                    pendant qu'on affiche une liste réduite ferait croire à un
                    écran incomplet. On dit aussi ce qui est masqué, pour que
                    l'absence des paniers abandonnés soit un choix visible et
                    non une disparition inexpliquée. */}
                {filtered.length} commande{filtered.length > 1 ? "s" : ""}
                {orders.length > filtered.length && (
                  <span className="text-apple-mid/60">
                    {" "}· {orders.length - filtered.length} masquée
                    {orders.length - filtered.length > 1 ? "s" : ""}
                  </span>
                )}
                {lastUpdated && (
                  <span className="text-apple-mid/60">
                    · à {lastUpdated.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
              </>
            )}
          </p>
        </div>
        <button
          onClick={loadAll}
          disabled={loading}
          className="flex items-center gap-2 text-[13px] text-apple-mid hover:text-apple-black transition px-3 py-2.5 rounded-xl bg-black/[0.03] border border-black/[0.06] disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Actualiser
        </button>
      </div>

      {/* Filtres */}
      <div className="glass-card rounded-3xl p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-apple-mid"
            strokeWidth={1.8}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom ou référence..."
            className="w-full bg-black/[0.03] rounded-2xl pl-10 pr-4 py-2.5 text-[13px] border border-black/[0.06] focus:outline-none focus:border-black/15 transition"
          />
        </div>
        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="appearance-none bg-black/[0.03] border border-black/[0.06] rounded-2xl px-4 py-2.5 pr-9 text-[13px] focus:outline-none text-apple-black"
          >
            <option value={FILTRE_PAYEES}>Commandes payées</option>
            <option value="pending">Paiement non abouti</option>
            <option value={FILTRE_TOUS}>Toutes les commandes</option>
            {statusOrder.map((s) => (
              <option key={s} value={s}>
                {statusConfig[s].label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-apple-mid pointer-events-none" />
        </div>
      </div>

      {/* Liste commandes */}
      <div className="glass-card rounded-3xl overflow-hidden">
        <div className="divide-y divide-black/[0.05]">
          {loading && orders.length === 0 ? (
            <div className="divide-y divide-black/[0.04]">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                  <div className="w-9 h-9 bg-black/[0.06] rounded-2xl flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-black/[0.07] rounded-full w-1/3" />
                    <div className="h-2.5 bg-black/[0.04] rounded-full w-1/4" />
                  </div>
                  <div className="text-right space-y-1.5">
                    <div className="h-3 bg-black/[0.07] rounded-full w-16 ml-auto" />
                    <div className="h-5 bg-black/[0.04] rounded-full w-20 ml-auto" />
                  </div>
                  <div className="w-4 h-4 bg-black/[0.04] rounded flex-shrink-0" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-14">
              <ShoppingBag
                className="w-8 h-8 text-apple-mid/30 mx-auto mb-2"
                strokeWidth={1}
              />
              <p className="text-apple-mid text-[13px]">
                {orders.length === 0
                  ? "Aucune commande en base"
                  : "Aucune commande trouvée"}
              </p>
            </div>
          ) : (
            filtered.map((order) => {
              const s = statusConfig[order.status] || statusConfig.confirmed;
              const Icon = s.icon;
              return (
                <div
                  key={order.id}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-black/[0.015] transition-colors cursor-pointer"
                  onClick={() => setSelected(order)}
                >
                  <div
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 ${s.bg}`}
                  >
                    <Icon className={`w-4 h-4 ${s.text}`} strokeWidth={1.8} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-apple-black text-[13px]">
                      {order.client.name}
                    </p>
                    <p className="text-apple-mid text-[11px] font-mono">
                      {order.id}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-apple-black text-[13px]">
                      {formatPrice(order.total)}
                    </p>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}
                    >
                      {s.label}
                    </span>
                  </div>
                  <Eye
                    className="w-4 h-4 text-apple-mid flex-shrink-0"
                    strokeWidth={1.6}
                  />
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Panel détail commande */}
      {selected &&
        (() => {
          const s = statusConfig[selected.status] || statusConfig.confirmed;
          const Icon = s.icon;
          return (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end p-0 sm:p-4">
              <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setSelected(null)}
              />
              <div className="relative bg-white w-full sm:w-[520px] h-[92vh] sm:h-auto sm:max-h-[92vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden">
                {/* Header panel */}
                <div className="px-6 py-5 border-b border-black/[0.06] flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center ${s.bg}`}
                    >
                      <Icon className={`w-5 h-5 ${s.text}`} strokeWidth={1.8} />
                    </div>
                    <div>
                      <h2 className="font-display font-bold text-[15px] text-apple-black font-mono">
                        {selected.id}
                      </h2>
                      <p className="text-apple-mid text-[12px]">
                        {selected.client.name}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    className="p-2 hover:bg-black/[0.05] rounded-xl transition"
                  >
                    <X className="w-5 h-5 text-apple-mid" />
                  </button>
                </div>

                <div className="overflow-y-auto flex-1 p-6 space-y-5">
                  {/* Infos client */}
                  <div className="bg-black/[0.03] rounded-2xl p-4 space-y-2.5">
                    <p className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-3">
                      Client
                    </p>
                    {[
                      { label: "Nom", value: selected.client.name },
                      { label: "Téléphone", value: selected.client.phone },
                      { label: "Adresse", value: selected.address },
                      { label: "Créneau", value: selected.slot },
                      {
                        label: "Date",
                        value: new Date(selected.date).toLocaleDateString(
                          "fr-FR",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        ),
                      },
                      ...(selected.note
                        ? [{ label: "Note", value: selected.note }]
                        : []),
                      ...(selected.isGift
                        ? [
                            {
                              label: "🎁 Destinataire",
                              value: selected.giftName,
                            },
                          ]
                        : []),
                    ].map((row) => (
                      <div
                        key={row.label}
                        className="flex justify-between text-[13px]"
                      >
                        <span className="text-apple-mid">{row.label}</span>
                        <span className="font-medium text-apple-black text-right max-w-[60%]">
                          {row.value}
                        </span>
                      </div>
                    ))}
                    {/* Lien GPS si disponible */}
                    {selected.coords && (
                      <a
                        href={`https://www.google.com/maps?q=${selected.coords.lat},${selected.coords.lng}&z=17`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 mt-2 text-[12px] text-blue-600 hover:underline"
                      >
                        <MapPin className="w-3.5 h-3.5" /> Voir sur Google Maps
                      </a>
                    )}
                  </div>

                  {/* Articles */}
                  <div className="bg-black/[0.03] rounded-2xl p-4">
                    <p className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-3">
                      Articles
                    </p>
                    <div className="space-y-2">
                      {selected.items.map((item, i) => (
                        <div key={i} className="text-[13px] space-y-0.5">
                          <div className="flex justify-between">
                            <span className="text-apple-mid">
                              {item.name} × {item.qty}
                            </span>
                            <span className="font-semibold text-apple-black">
                              {formatPrice(item.price * item.qty)}
                            </span>
                          </div>
                          {item.variants?.length > 0 && (
                            <div className="flex flex-wrap gap-1 pl-0.5">
                              {item.variants.map((v) => (
                                <span
                                  key={v.typeName}
                                  className={`text-[10px] px-2 py-0.5 rounded-full ${
                                    v.value === "Non choisi"
                                      ? "bg-black/[0.03] text-apple-mid/50 italic"
                                      : "bg-black/[0.05] text-apple-mid"
                                  }`}
                                >
                                  {v.typeName}: {v.value}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                      <div className="border-t border-black/[0.06] pt-2 flex justify-between font-bold text-[14px]">
                        <span className="text-apple-black">Total</span>
                        <span className="text-apple-black">
                          {formatPrice(selected.total)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Changer le statut */}
                  <div>
                    <p className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-3">
                      Statut — synchronisé avec la page de suivi client
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {statusOrder.map((status) => {
                        const cfg = statusConfig[status];
                        const Icn = cfg.icon;
                        const isActive = selected.status === status;
                        return (
                          <button
                            key={status}
                            onClick={() => handleStatusChange(selected, status)}
                            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-[12px] font-semibold transition-all border-2 ${
                              isActive
                                ? `${cfg.bg} ${cfg.text} border-current`
                                : "bg-black/[0.02] text-apple-mid border-transparent hover:bg-black/[0.04]"
                            }`}
                          >
                            <Icn
                              className="w-4 h-4 flex-shrink-0"
                              strokeWidth={1.8}
                            />
                            {cfg.label}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-2 mt-3 p-2.5 rounded-xl bg-blue-50 border border-blue-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse flex-shrink-0" />
                      <p className="text-[11px] text-blue-600">
                        Le changement de statut est immédiatement visible sur la
                        page de suivi du client.
                      </p>
                    </div>
                  </div>

                  {/* WhatsApp client */}
                  <a
                    href={buildWhatsAppClient(selected)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-4 rounded-2xl bg-green-50 border border-green-100 hover:bg-green-100 transition"
                  >
                    <div>
                      <p className="font-semibold text-green-700 text-[13px]">
                        Notifier le client
                      </p>
                      <p className="text-green-600 text-[11px] mt-0.5">
                        Envoyer le nouveau statut + lien de suivi via WhatsApp
                      </p>
                    </div>
                    <MessageCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  </a>
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
}
