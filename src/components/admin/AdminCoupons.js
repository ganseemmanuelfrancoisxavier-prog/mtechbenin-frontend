"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Check,
  Tag,
  ToggleLeft,
  ToggleRight,
  Copy,
  RefreshCw,
} from "lucide-react";
import { formatPrice } from "@/lib/format";
import { couponsApi } from "@/lib/api";

const emptyForm = {
  code: "",
  type: "percentage",
  value: "",
  minOrder: "",
  maxUses: "",
  expiresAt: "",
  active: true,
};

function formatDiscount(coupon) {
  return coupon.type === "PERCENTAGE" || coupon.type === "percentage"
    ? `-${coupon.value}%`
    : `-${formatPrice(coupon.value)}`;
}

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "MTECH-";
  for (let i = 0; i < 4; i++)
    code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function isExpired(expiresAt) {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}


export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(null);
  const [loading, setLoading] = useState(false);

  // ── Charge les coupons depuis l'API ───────────────────────────────────────
  const loadAll = async () => {
    setLoading(true);
    try {
      const data = await couponsApi.getAll();
      setCoupons(
        (data.coupons || []).map((c) => ({
          ...c,
          type: c.type?.toLowerCase() || "percentage",
          usedCount: c.usedCount || 0,
        })),
      );
    } catch (err) {
      console.error("Erreur chargement coupons", err.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const updateForm = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));
  const filtered = coupons.filter((c) =>
    c.code.toLowerCase().includes(search.toLowerCase()),
  );

  const openAdd = () => {
    setEditingCoupon(null);
    setForm({ ...emptyForm, code: generateCode() });
    setShowModal(true);
  };

  const openEdit = (coupon) => {
    setEditingCoupon(coupon);
    setForm({
      code: coupon.code,
      type: coupon.type?.toLowerCase() || "percentage",
      value: coupon.value,
      minOrder: coupon.minOrder || "",
      maxUses: coupon.maxUses || "",
      expiresAt: coupon.expiresAt ? coupon.expiresAt.split("T")[0] : "",
      active: coupon.active,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.code || !form.value) return;
    const data = {
      code: form.code.toUpperCase().trim(),
      type: form.type.toUpperCase(),
      value: Number(form.value),
      minOrder: form.minOrder ? Number(form.minOrder) : 0,
      maxUses: form.maxUses ? Number(form.maxUses) : null,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      active: form.active,
    };
    try {
      if (editingCoupon) await couponsApi.update(editingCoupon.id, data);
      else await couponsApi.create(data);
      await loadAll();
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setShowModal(false);
      }, 900);
    } catch (err) {
      console.error("Erreur save coupon", err.message);
    }
  };

  const handleDelete = async (coupon) => {
    try {
      await couponsApi.delete(coupon.id);
      await loadAll();
    } catch (err) {
      console.error("Erreur delete coupon", err.message);
    }
    setDeleteConfirm(null);
  };

  const handleToggle = async (coupon) => {
    try {
      await couponsApi.update(coupon.id, { active: !coupon.active });
      await loadAll();
    } catch (err) {
      console.error("Erreur toggle coupon", err.message);
    }
  };

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-black text-2xl text-apple-black tracking-tight">
            Coupons
          </h1>
          <p className="text-apple-mid text-[13px] mt-1">
            {coupons.length} codes promo
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadAll}
            disabled={loading}
            className="flex items-center gap-2 text-[13px] text-apple-mid hover:text-apple-black transition px-3 py-2.5 rounded-xl bg-black/[0.03] border border-black/[0.06] disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-apple-black hover:bg-neutral-800 text-white font-semibold px-4 py-2.5 rounded-2xl transition-all text-sm"
          >
            <Plus className="w-4 h-4" /> Créer un coupon
          </button>
        </div>
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
            placeholder="Rechercher un code..."
            className="w-full bg-black/[0.03] rounded-2xl pl-10 pr-4 py-2.5 text-[13px] border border-black/[0.06] focus:outline-none focus:border-black/15 transition"
          />
        </div>
      </div>

      <div className="glass-card rounded-3xl overflow-hidden">
        <div className="divide-y divide-black/[0.05]">
          {loading && coupons.length === 0 && (
            <div className="divide-y divide-black/[0.05]">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                  <div className="w-9 h-9 bg-black/[0.06] rounded-2xl flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-black/[0.07] rounded-full w-1/4" />
                    <div className="h-2.5 bg-black/[0.04] rounded-full w-1/3" />
                  </div>
                  <div className="h-6 w-12 bg-black/[0.04] rounded-full" />
                  <div className="flex gap-1.5">
                    <div className="w-8 h-8 bg-black/[0.04] rounded-xl" />
                    <div className="w-8 h-8 bg-black/[0.04] rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          )}
          {filtered.map((coupon) => {
            const expired = isExpired(coupon.expiresAt);
            const full = coupon.maxUses && coupon.usedCount >= coupon.maxUses;
            return (
              <div
                key={coupon.code}
                className={`flex items-center gap-4 px-5 py-4 hover:bg-black/[0.015] transition-colors ${!coupon.active || expired ? "opacity-50" : ""}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono font-bold text-apple-black text-[14px] tracking-wider">
                      {coupon.code}
                    </span>
                    <button
                      onClick={() => handleCopy(coupon.code)}
                      className="text-apple-mid hover:text-apple-black transition-colors"
                    >
                      {copied === coupon.code ? (
                        <Check className="w-3.5 h-3.5 text-green-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="badge-promo">
                      {formatDiscount(coupon)}
                    </span>
                    {coupon.minOrder > 0 && (
                      <span className="text-[11px] bg-black/[0.04] text-apple-mid px-2 py-0.5 rounded-full">
                        min. {formatPrice(coupon.minOrder)}
                      </span>
                    )}
                    {coupon.maxUses && (
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full ${full ? "bg-red-50 text-cta font-medium" : "bg-black/[0.04] text-apple-mid"}`}
                      >
                        {coupon.usedCount}/{coupon.maxUses} utilisations
                      </span>
                    )}
                    {expired && (
                      <span className="text-[11px] bg-red-50 text-cta px-2 py-0.5 rounded-full font-medium">
                        Expiré
                      </span>
                    )}
                    {coupon.expiresAt && !expired && (
                      <span className="text-[11px] text-apple-mid">
                        Exp.{" "}
                        {new Date(coupon.expiresAt).toLocaleDateString("fr-FR")}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleToggle(coupon)}
                    className="p-2 rounded-xl hover:bg-black/[0.05] transition text-apple-mid"
                  >
                    {coupon.active ? (
                      <ToggleRight className="w-4 h-4 text-green-500" />
                    ) : (
                      <ToggleLeft className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => openEdit(coupon)}
                    className="p-2 rounded-xl hover:bg-blue-50 transition text-apple-mid hover:text-blue-600"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(coupon)}
                    className="p-2 rounded-xl hover:bg-red-50 transition text-apple-mid hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
          {!loading && filtered.length === 0 && (
            <div className="text-center py-14">
              <Tag
                className="w-8 h-8 text-apple-mid/30 mx-auto mb-2"
                strokeWidth={1}
              />
              <p className="text-apple-mid text-[13px]">Aucun coupon trouvé</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal ajout/édition */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-5 border-b border-black/[0.06] flex items-center justify-between rounded-t-3xl z-10">
              <h2 className="font-display font-bold text-lg text-apple-black">
                {editingCoupon ? "Modifier le coupon" : "Nouveau coupon"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-black/[0.05] rounded-xl transition"
              >
                <X className="w-5 h-5 text-apple-mid" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1.5 block">
                  Code *
                </label>
                <div className="flex gap-2">
                  <input
                    value={form.code}
                    onChange={(e) =>
                      updateForm("code", e.target.value.toUpperCase())
                    }
                    placeholder="MTECH-XXXX"
                    className="flex-1 bg-black/[0.03] rounded-xl px-4 py-3 text-sm font-mono border border-black/[0.07] focus:outline-none focus:border-black/20 transition"
                  />
                  <button
                    onClick={() => updateForm("code", generateCode())}
                    className="px-3.5 py-3 rounded-xl bg-black/[0.04] text-[12px] font-semibold text-apple-mid hover:bg-black/[0.07] transition border border-black/[0.06]"
                  >
                    Générer
                  </button>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-2 block">
                  Type de réduction
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "percentage", label: "Pourcentage (%)" },
                    { value: "fixed", label: "Montant fixe (FCFA)" },
                  ].map((t) => (
                    <button
                      key={t.value}
                      onClick={() => updateForm("type", t.value)}
                      className={`py-3 rounded-2xl text-[13px] font-medium transition-all ${form.type === t.value ? "bg-apple-black text-white" : "bg-black/[0.04] text-apple-mid hover:bg-black/[0.07]"}`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1.5 block">
                    Valeur * {form.type === "percentage" ? "(%)" : "(FCFA)"}
                  </label>
                  <input
                    type="number"
                    value={form.value}
                    onChange={(e) => updateForm("value", e.target.value)}
                    placeholder={form.type === "percentage" ? "20" : "2000"}
                    className="w-full bg-black/[0.03] rounded-xl px-4 py-3 text-[13px] border border-black/[0.07] focus:outline-none focus:border-black/20 transition"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1.5 block">
                    Commande min.
                  </label>
                  <input
                    type="number"
                    value={form.minOrder}
                    onChange={(e) => updateForm("minOrder", e.target.value)}
                    placeholder="5000"
                    className="w-full bg-black/[0.03] rounded-xl px-4 py-3 text-[13px] border border-black/[0.07] focus:outline-none focus:border-black/20 transition"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1.5 block">
                    Max. utilisations
                  </label>
                  <input
                    type="number"
                    value={form.maxUses}
                    onChange={(e) => updateForm("maxUses", e.target.value)}
                    placeholder="Illimité"
                    className="w-full bg-black/[0.03] rounded-xl px-4 py-3 text-[13px] border border-black/[0.07] focus:outline-none focus:border-black/20 transition"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1.5 block">
                    Expiration
                  </label>
                  <input
                    type="date"
                    value={form.expiresAt}
                    onChange={(e) => updateForm("expiresAt", e.target.value)}
                    className="w-full bg-black/[0.03] rounded-xl px-4 py-3 text-[13px] border border-black/[0.07] focus:outline-none focus:border-black/20 transition"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-black/[0.03] rounded-2xl">
                <div>
                  <p className="font-medium text-apple-black text-sm">
                    Coupon actif
                  </p>
                  <p className="text-apple-mid text-xs mt-0.5">
                    Utilisable sur le site
                  </p>
                </div>
                <div
                  onClick={() => updateForm("active", !form.active)}
                  className={`w-11 h-6 rounded-full transition-colors duration-200 relative cursor-pointer ${form.active ? "bg-apple-black" : "bg-apple-mid/40"}`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${form.active ? "translate-x-6" : "translate-x-1"}`}
                  />
                </div>
              </div>
              <button
                onClick={handleSave}
                disabled={!form.code || !form.value}
                className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-[13px] transition-all ${
                  saved
                    ? "bg-green-500 text-white"
                    : "bg-apple-black hover:bg-neutral-800 text-white disabled:opacity-40 disabled:cursor-not-allowed"
                }`}
              >
                {saved ? (
                  <>
                    <Check className="w-4 h-4" /> Sauvegardé !
                  </>
                ) : editingCoupon ? (
                  "Modifier"
                ) : (
                  "Créer le coupon"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal suppression */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setDeleteConfirm(null)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm text-center">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="font-display font-bold text-lg text-apple-black mb-2">
              Supprimer ce coupon ?
            </h3>
            <p className="text-apple-mid text-sm mb-6">
              Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-3 rounded-2xl bg-black/[0.04] text-apple-black font-semibold text-sm hover:bg-black/[0.07] transition"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
