"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  X,
  Check,
  ToggleLeft,
  ToggleRight,
  GripVertical,
  RefreshCw,
} from "lucide-react";
import { categoriesApi } from "@/lib/api";

const emptyForm = { label: "", slug: "", icon: "📦", active: true };
const deviceCategories = [
  { label: "iPhone", name: "iPhone", slug: "iphone", icon: "📱", active: true },
  { label: "Android", name: "Android", slug: "android", icon: "📱", active: true },
];

function generateSlug(label) {
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const iconOptions = [
  "🎧", "🔊", "💨", "💄", "📦", "🎮",
  "📱", "💻", "⌚", "🎵", "📷", "🖥️",
  "🎤", "🎹", "🥁", "🎸", "🎺", "🎻",
  "🕹️", "🃏", "🎲", "🧩", "🏆", "⚽",
  "🏀", "🎾", "🎳", "🎯", "🎪", "🎭",
  "🖨️", "🖱️", "🖲️", "💾", "💿", "📀",
  "📺", "📡", "🔋", "🔌", "💡", "🔦",
  "🧲", "🔧", "🔩", "⚙️", "🛠️", "🔬",
  "🔭", "🧪", "🧬", "🌐", "📡", "🛰️",
  "🚗", "🏍️", "🚲", "✈️", "🚀", "⛵",
  "👟", "👜", "🕶️", "💍", "👑", "🪆",
  "🛍️", "🎁", "🎀", "🧸", "🪅", "🪄",
  "🌸", "🌿", "🌴", "🍎", "🍕", "☕",
  "🧴", "🪥", "🧹", "🪑", "🛋️", "🪴",
  "💎", "🪙", "💰", "🏅", "🥇", "⭐",
];

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [settingUpDevices, setSettingUpDevices] = useState(false);
  const [notice, setNotice] = useState("");

  // ── Charge TOUTES les catégories (actives + inactives) via l'endpoint admin ──
  const loadAll = async () => {
    setLoading(true);
    try {
      const data = await categoriesApi.getAllAdmin();
      setCategories(data.categories || []);
    } catch (err) {
      console.error("Erreur chargement catégories", err.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const updateForm = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const openAdd = () => {
    setEditingCat(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (cat) => {
    setEditingCat(cat);
    setForm({
      label: cat.label || cat.name,
      slug: cat.slug,
      icon: cat.icon || "📦",
      active: cat.active,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.label) return;
    setSaving(true);
    const data = {
      ...form,
      name: form.label,
      slug: form.slug || generateSlug(form.label),
    };
    try {
      if (editingCat) await categoriesApi.update(editingCat.id, data);
      else await categoriesApi.create(data);
      await loadAll();
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setShowModal(false);
      }, 900);
    } catch (err) {
      console.error("Erreur save catégorie", err.message);
    }
    setSaving(false);
  };

  const addDeviceCategories = async () => {
    setSettingUpDevices(true);
    setNotice("");
    try {
      const existingSlugs = new Set(categories.map((category) => category.slug));
      const missingCategories = deviceCategories.filter(
        (category) => !existingSlugs.has(category.slug),
      );
      for (const category of missingCategories) {
        await categoriesApi.create(category);
      }
      await loadAll();
      setNotice(
        missingCategories.length
          ? "Catégories iPhone et Android ajoutées. Tu peux maintenant choisir leur catégorie dans chaque fiche produit."
          : "Les catégories iPhone et Android existent déjà. Tu peux les choisir dans chaque fiche produit.",
      );
    } catch (err) {
      setNotice(err.message || "Impossible de créer les catégories pour le moment.");
    }
    setSettingUpDevices(false);
  };

  const handleDelete = async (id) => {
    try {
      await categoriesApi.delete(id);
      await loadAll();
    } catch (err) {
      console.error("Erreur delete catégorie", err.message);
    }
    setDeleteConfirm(null);
  };

  // ── Toggle optimiste — met à jour localement SANS recharger ──────────────
  const handleToggle = async (cat) => {
    // 1. Mise à jour optimiste immédiate
    setCategories((prev) =>
      prev.map((c) => (c.id === cat.id ? { ...c, active: !c.active } : c)),
    );
    try {
      // 2. Envoi API
      await categoriesApi.update(cat.id, { active: !cat.active });
    } catch (err) {
      console.error("Erreur toggle catégorie", err.message);
      // 3. Rollback si erreur
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, active: cat.active } : c)),
      );
    }
  };

  const sortedCategories = [...categories].sort(
    (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0),
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-black text-2xl text-apple-black">
            Catégories
          </h1>
          <p className="text-apple-mid text-sm mt-1">
            {loading
              ? "Chargement..."
              : `${categories.length} catégories au total`}
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
            className="flex items-center gap-2 bg-cta hover:bg-cta/90 text-white font-semibold px-5 py-2.5 rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-cta/25 text-sm"
          >
            <Plus className="w-4 h-4" /> Ajouter
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-black/[0.07] bg-white p-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
        <div>
          <p className="font-semibold text-apple-black text-sm">Séparer les téléphones</p>
          <p className="text-apple-mid text-xs mt-1">
            Ajoute les catégories iPhone et Android, puis assigne-les dans la fiche de chaque produit.
          </p>
          {notice && <p role="status" className="text-xs mt-2 text-apple-black">{notice}</p>}
        </div>
        <button
          onClick={addDeviceCategories}
          disabled={loading || settingUpDevices}
          className="mt-3 sm:mt-0 shrink-0 rounded-xl bg-apple-black px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50"
        >
          {settingUpDevices ? "Mise en place…" : "Ajouter iPhone et Android"}
        </button>
      </div>

      <div className="glass-card rounded-3xl overflow-hidden">
        <div className="divide-y divide-black/5">
          {loading && categories.length === 0 ? (
            <div className="divide-y divide-black/5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                  <div className="w-9 h-9 bg-black/[0.06] rounded-2xl flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-black/[0.07] rounded-full w-1/3" />
                    <div className="h-2.5 bg-black/[0.04] rounded-full w-1/5" />
                  </div>
                  <div className="flex gap-2">
                    <div className="w-8 h-8 bg-black/[0.04] rounded-xl" />
                    <div className="w-8 h-8 bg-black/[0.04] rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : sortedCategories.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-apple-mid text-sm">Aucune catégorie</p>
            </div>
          ) : (
            sortedCategories.map((cat) => (
              <div
                key={cat.id}
                className={`flex items-center gap-4 px-5 py-4 hover:bg-apple-gray/30 transition ${!cat.active ? "opacity-40" : ""}`}
              >
                <GripVertical className="w-4 h-4 text-apple-mid/40 flex-shrink-0" />
                <span className="text-xl flex-shrink-0">
                  {cat.icon || "📦"}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-apple-black text-sm">
                      {cat.label || cat.name}
                    </p>
                    {/* Badge inactif visible directement dans la ligne */}
                    {!cat.active && (
                      <span className="text-[10px] bg-red-50 text-red-400 px-1.5 py-0.5 rounded-full font-medium">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-apple-mid text-xs font-mono mt-0.5">
                    /{cat.slug}
                  </p>
                </div>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full hidden sm:block ${
                    cat.active
                      ? "bg-green-50 text-green-600"
                      : "bg-apple-gray text-apple-mid"
                  }`}
                >
                  {cat.active ? "Active" : "Inactive"}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggle(cat)}
                    className="p-2 rounded-xl hover:bg-apple-gray transition text-apple-mid hover:text-apple-black"
                    title={cat.active ? "Désactiver" : "Activer"}
                  >
                    {cat.active ? (
                      <ToggleRight className="w-4 h-4 text-green-500" />
                    ) : (
                      <ToggleLeft className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => openEdit(cat)}
                    className="p-2 rounded-xl hover:bg-blue-50 transition text-apple-mid hover:text-blue-600"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(cat.id)}
                    className="p-2 rounded-xl hover:bg-red-50 transition text-apple-mid hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Ajout / Édition */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-5 border-b border-black/5 flex items-center justify-between">
              <h2 className="font-display font-bold text-lg text-apple-black">
                {editingCat ? "Modifier la catégorie" : "Nouvelle catégorie"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-apple-gray rounded-xl transition"
              >
                <X className="w-5 h-5 text-apple-mid" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-apple-mid mb-1.5 block">
                  Nom de la catégorie *
                </label>
                <input
                  value={form.label}
                  onChange={(e) => {
                    updateForm("label", e.target.value);
                    if (!editingCat)
                      updateForm("slug", generateSlug(e.target.value));
                  }}
                  placeholder="Ex: Écouteurs"
                  className="w-full bg-apple-gray rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-apple-mid mb-1.5 block">
                  Slug URL
                </label>
                <input
                  value={form.slug}
                  onChange={(e) => updateForm("slug", e.target.value)}
                  placeholder="ecouteurs"
                  className="w-full bg-apple-gray rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <p className="text-xs text-apple-mid mt-1">
                  Généré automatiquement depuis le nom
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-apple-mid mb-2 block">
                  Icône
                </label>
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
                  {iconOptions.map((icon) => (
                    <button
                      key={icon}
                      onClick={() => updateForm("icon", icon)}
                      className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                        form.icon === icon
                          ? "bg-apple-black ring-2 ring-apple-black ring-offset-2"
                          : "bg-apple-gray hover:bg-black/[0.07]"
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-apple-gray rounded-2xl">
                <div>
                  <p className="font-medium text-apple-black text-sm">
                    Catégorie active
                  </p>
                  <p className="text-apple-mid text-xs">
                    Visible sur le site et dans les filtres
                  </p>
                </div>
                <div
                  onClick={() => updateForm("active", !form.active)}
                  className={`w-11 h-6 rounded-full transition-colors duration-200 relative cursor-pointer ${
                    form.active ? "bg-apple-black" : "bg-apple-mid"
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                      form.active ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </div>
              </div>
              <button
                onClick={handleSave}
                disabled={!form.label || saving}
                className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-sm transition-all ${
                  saved
                    ? "bg-green-500 text-white"
                    : "bg-cta hover:bg-cta/90 text-white shadow-lg shadow-cta/25 disabled:opacity-50 disabled:cursor-not-allowed"
                }`}
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : saved ? (
                  <>
                    <Check className="w-4 h-4" /> Sauvegardé !
                  </>
                ) : editingCat ? (
                  "Modifier la catégorie"
                ) : (
                  "Créer la catégorie"
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
              Supprimer cette catégorie ?
            </h3>
            <p className="text-apple-mid text-sm mb-6">
              Les produits associés ne seront pas supprimés.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-3 rounded-2xl glass-card text-apple-black font-semibold text-sm hover:bg-apple-gray transition"
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
