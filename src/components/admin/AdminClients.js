"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Eye,
  X,
  Phone,
  MessageCircle,
  ShoppingBag,
  Calendar,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import { formatPrice } from "@/lib/format";
import { clientsApi, ordersApi } from "@/lib/api";

const statusColors = {
  CONFIRMED: "bg-blue-50 text-blue-600",
  confirmed: "bg-blue-50 text-blue-600",
  PREPARING: "bg-orange-50 text-orange-500",
  preparing: "bg-orange-50 text-orange-500",
  SHIPPED: "bg-purple-50 text-purple-600",
  shipped: "bg-purple-50 text-purple-600",
  DELIVERED: "bg-green-50 text-green-600",
  delivered: "bg-green-50 text-green-600",
  CANCELLED: "bg-red-50 text-red-500",
  cancelled: "bg-red-50 text-red-500",
};
const statusLabels = {
  CONFIRMED: "Confirmée",
  confirmed: "Confirmée",
  PREPARING: "Préparation",
  preparing: "Préparation",
  SHIPPED: "En livraison",
  shipped: "En livraison",
  DELIVERED: "Livrée",
  delivered: "Livrée",
  CANCELLED: "Annulée",
  cancelled: "Annulée",
};
const tierColors = {
  bronze: "bg-orange-50 text-orange-600",
  silver: "bg-gray-100 text-gray-600",
  gold: "bg-yellow-50 text-yellow-600",
};

export default function AdminClients() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const fetchClients = async (q = "") => {
    setLoading(true);
    try {
      const params = q ? { search: q } : {};
      const data = await clientsApi.getAll(params);
      setClients(data.clients || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error("Erreur fetchClients", err.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Debounce recherche 400ms
  useEffect(() => {
    const t = setTimeout(() => fetchClients(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // ── Ouvre le panel client + charge ses commandes depuis l'API ─────────────
  const openClient = async (raw) => {
    const client = normalize(raw);
    setSelected(client);
    setLoadingOrders(true);
    try {
      const data = await ordersApi.getAll({ search: raw.whatsapp, limit: 50 });
      const orders = (data.orders || []).map((o) => ({
        ref: o.reference,
        total: o.total,
        status: o.status,
        date: o.createdAt,
      }));
      // Ne pas écraser l'historique si l'admin a ouvert un autre client entre-
      // temps (la réponse d'une requête plus ancienne peut arriver en dernier).
      setSelected((prev) => (prev && prev.id === client.id ? { ...prev, orderHistory: orders } : prev));
    } catch (err) {
      console.error("Erreur chargement commandes client", err.message);
    }
    setLoadingOrders(false);
  };

  const normalize = (c) => ({
    id: c.id,
    name: c.name || "Client",
    phone: c.whatsapp || "",
    email: c.email || "",
    city: c.city || "",
    orders: c.totalOrders || 0,
    totalSpent: c.totalSpent || 0,
    points: c.points || 0,
    tier: c.tier || "bronze",
    joinedAt: c.createdAt || "",
    lastOrder: c.lastOrderAt || "",
    orderHistory: [],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-black text-2xl text-apple-black tracking-tight">
            Clients
          </h1>
          <p className="text-apple-mid text-[13px] mt-1">
            {loading ? "Chargement..." : `${total} clients enregistrés`}
          </p>
        </div>
        <button
          onClick={() => fetchClients(search)}
          className="flex items-center gap-2 text-[13px] text-apple-mid hover:text-apple-black transition px-3 py-2.5 rounded-xl bg-black/[0.03] border border-black/[0.06]"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Actualiser
        </button>
      </div>

      <div className="glass-card rounded-3xl p-4">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-apple-mid"
            strokeWidth={1.8}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nom, téléphone WhatsApp..."
            className="w-full bg-black/[0.03] rounded-2xl pl-10 pr-4 py-2.5 text-[13px] border border-black/[0.06] focus:outline-none focus:border-black/15 transition"
          />
        </div>
      </div>

      <div className="glass-card rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/[0.05] bg-black/[0.02]">
                {[
                  "Client",
                  "Commandes",
                  "Total dépensé",
                  "Points",
                  "Actions",
                ].map((h, i) => (
                  <th
                    key={h}
                    className={`text-left px-5 py-3 text-[11px] font-semibold text-apple-mid uppercase tracking-wider ${i > 0 && i < 4 ? "hidden md:table-cell" : ""} ${i === 4 ? "text-right" : ""}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {loading && clients.length === 0 ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-black/[0.06] rounded-full flex-shrink-0" />
                        <div className="space-y-1.5">
                          <div className="h-3 bg-black/[0.07] rounded-full w-24" />
                          <div className="h-2.5 bg-black/[0.04] rounded-full w-16" />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell"><div className="h-3 bg-black/[0.06] rounded-full w-6" /></td>
                    <td className="px-5 py-4 hidden md:table-cell"><div className="h-3 bg-black/[0.06] rounded-full w-20" /></td>
                    <td className="px-5 py-4 hidden md:table-cell"><div className="h-5 bg-black/[0.04] rounded-full w-14" /></td>
                    <td className="px-5 py-4"><div className="h-8 bg-black/[0.04] rounded-xl w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : clients.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-14 text-apple-mid text-[13px]"
                  >
                    Aucun client trouvé
                  </td>
                </tr>
              ) : (
                clients.map((raw) => {
                  const client = normalize(raw);
                  return (
                    <tr
                      key={client.id}
                      className="hover:bg-black/[0.015] transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-apple-black flex items-center justify-center text-white font-bold text-[13px] flex-shrink-0">
                            {client.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-apple-black text-[13px]">
                                {client.name}
                              </p>
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase ${tierColors[client.tier] || tierColors.bronze}`}
                              >
                                {client.tier}
                              </span>
                            </div>
                            <p className="text-apple-mid text-[11px]">
                              {client.city}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <span className="font-bold text-apple-black text-[13px]">
                          {client.orders}
                        </span>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <span className="font-bold text-apple-black text-[13px]">
                          {formatPrice(client.totalSpent)}
                        </span>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <span className="text-[12px] bg-black/[0.04] text-apple-mid px-2.5 py-1 rounded-full font-medium">
                          {client.points} pts
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          {client.phone && (
                            <a
                              href={`https://wa.me/${client.phone.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 rounded-xl hover:bg-green-50 transition text-apple-mid hover:text-green-600"
                            >
                              <MessageCircle
                                className="w-4 h-4"
                                strokeWidth={1.8}
                              />
                            </a>
                          )}
                          <button
                            onClick={() => openClient(raw)}
                            className="p-2 rounded-xl hover:bg-black/[0.05] transition text-apple-mid hover:text-apple-black"
                          >
                            <Eye className="w-4 h-4" strokeWidth={1.8} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Panel client */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          />
          <div className="relative bg-white w-full sm:w-[440px] h-[90vh] sm:h-screen rounded-t-3xl sm:rounded-none shadow-2xl flex flex-col overflow-hidden">
            <div className="px-6 py-5 border-b border-black/[0.06] flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-apple-black flex items-center justify-center text-white font-bold text-[14px]">
                  {selected.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-display font-bold text-[15px] text-apple-black">
                      {selected.name}
                    </p>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase ${tierColors[selected.tier] || tierColors.bronze}`}
                    >
                      {selected.tier}
                    </span>
                  </div>
                  <p className="text-apple-mid text-[12px]">{selected.city}</p>
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
              {/* Stats */}
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  {
                    label: "Commandes",
                    value: selected.orders,
                    icon: ShoppingBag,
                  },
                  {
                    label: "Dépensé",
                    value: formatPrice(selected.totalSpent),
                    icon: TrendingUp,
                  },
                  {
                    label: "Points",
                    value: `${selected.points} pts`,
                    icon: Calendar,
                  },
                ].map((s) => {
                  const Icon = s.icon;
                  return (
                    <div
                      key={s.label}
                      className="rounded-2xl p-3 text-center bg-black/[0.03]"
                    >
                      <p className="font-display font-black text-[15px] text-apple-black">
                        {s.value}
                      </p>
                      <p className="text-apple-mid text-[11px] mt-0.5">
                        {s.label}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Contact */}
              <div>
                <p className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-2">
                  Contact
                </p>
                <div className="rounded-2xl bg-black/[0.03] p-3.5 space-y-1.5">
                  {selected.phone && (
                    <p className="text-[13px] text-apple-black font-medium font-mono">
                      {selected.phone}
                    </p>
                  )}
                  {selected.email && (
                    <p className="text-[13px] text-apple-mid">
                      {selected.email}
                    </p>
                  )}
                  {selected.lastOrder && (
                    <p className="text-[11px] text-apple-mid">
                      Dernière commande :{" "}
                      {new Date(selected.lastOrder).toLocaleDateString(
                        "fr-FR",
                        { day: "2-digit", month: "short", year: "numeric" },
                      )}
                    </p>
                  )}
                </div>
              </div>

              {/* Historique commandes */}
              <div>
                <p className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-2">
                  Historique commandes
                </p>
                {loadingOrders ? (
                  <div className="text-center py-6 rounded-2xl bg-black/[0.02]">
                    <div className="w-5 h-5 border-2 border-black/20 border-t-black/70 rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-apple-mid text-[12px]">Chargement...</p>
                  </div>
                ) : selected.orderHistory?.length > 0 ? (
                  <div className="space-y-2">
                    {selected.orderHistory.map((o) => (
                      <div
                        key={o.ref}
                        className="flex items-center justify-between py-2.5 px-3.5 rounded-2xl bg-black/[0.03]"
                      >
                        <div>
                          <p className="font-mono text-[11px] text-apple-mid">
                            {o.ref}
                          </p>
                          <p className="font-bold text-apple-black text-[13px] mt-0.5">
                            {formatPrice(o.total)}
                          </p>
                          {o.date && (
                            <p className="text-[10px] text-apple-mid mt-0.5">
                              {new Date(o.date).toLocaleDateString("fr-FR", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                          )}
                        </div>
                        <span
                          className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${statusColors[o.status] || "bg-black/[0.04] text-apple-mid"}`}
                        >
                          {statusLabels[o.status] || o.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 rounded-2xl bg-black/[0.02]">
                    <p className="text-apple-mid text-[13px]">
                      Aucune commande enregistrée
                    </p>
                    <p className="text-apple-mid/60 text-[11px] mt-1">
                      Les commandes apparaissent après livraison
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2.5">
                {selected.phone && (
                  <a
                    href={`https://wa.me/${selected.phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[13px] font-semibold"
                    style={{
                      background: "rgba(37,211,102,0.10)",
                      border: "1px solid rgba(37,211,102,0.20)",
                      color: "#128C7E",
                    }}
                  >
                    <MessageCircle className="w-4 h-4" strokeWidth={1.8} />{" "}
                    WhatsApp
                  </a>
                )}
                {selected.phone && (
                  <a
                    href={`tel:${selected.phone}`}
                    className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-[13px] font-semibold bg-black/[0.04] text-apple-mid hover:bg-black/[0.07] transition border border-black/[0.06]"
                  >
                    <Phone className="w-4 h-4" strokeWidth={1.8} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
