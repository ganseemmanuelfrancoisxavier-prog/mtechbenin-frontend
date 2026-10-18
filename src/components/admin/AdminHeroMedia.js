"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  X,
  Check,
  ChevronUp,
  ChevronDown,
  Image as ImageIcon,
  Video,
  Layers,
  GripVertical,
  ArrowUpRight,
  Link2,
} from "lucide-react";
import { heroApi } from "@/lib/api";
import MediaUploader from "@/components/admin/MediaUploader";

const typeOptions = [
  { value: "gradient", label: "Dégradé", icon: Layers },
  { value: "image", label: "Image", icon: ImageIcon },
  { value: "video", label: "Vidéo", icon: Video },
];

const gradients = [
  { label: "Nuit bleue", value: "from-[#0A0A0A] via-[#1a1a2e] to-[#0f3460]" },
  { label: "Noir pur", value: "from-[#0f0f0f] via-[#1a1a1a] to-[#2d2d2d]" },
  { label: "Océan", value: "from-[#0a0a2e] via-[#0f1a3d] to-[#1D72B8]" },
  { label: "Forêt", value: "from-[#0a1a0a] via-[#0d2b0d] to-[#1a4a1a]" },
  { label: "Bordeaux", value: "from-[#1a0a0a] via-[#2b0d0d] to-[#4a1a1a]" },
  { label: "Violet", value: "from-[#0f0a1a] via-[#1a0d2b] to-[#2d1a4a]" },
];

const emptyForm = {
  type: "gradient",
  active: true,
  tag: "",
  title: "",
  subtitle: "",
  description: "",
  cta: "Découvrir",
  href: "/catalogue",
  badge: "",
  bg: gradients[0].value,
  url: "",
  categoryKey: "",
};

export default function AdminHeroMedia() {
  const [medias, setMedias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingMedia, setEditingMedia] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saved, setSaved] = useState(false);

  // ── Charge tous les slides depuis l'API ───────────────────────────────────
  const loadAll = async () => {
    setLoading(true);
    try {
      const data = await heroApi.getAll();
      setMedias(data.medias || []);
    } catch (err) {
      console.error("Erreur chargement hero", err.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const sortedMedias = [...medias].sort((a, b) => a.order - b.order);
  const updateForm = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const openAdd = () => {
    setEditingMedia(null);
    setForm({ ...emptyForm, order: medias.length + 1 });
    setShowModal(true);
  };

  const openEdit = (media) => {
    setEditingMedia(media);
    setForm({
      type: media.type,
      active: media.active,
      tag: media.tag || "",
      title: media.title || "",
      subtitle: media.subtitle || "",
      description: media.description || "",
      cta: media.cta || "Découvrir",
      href: media.href || "/catalogue",
      badge: media.badge || "",
      bg: media.bg || gradients[0].value,
      url: media.url || "",
      categoryKey: media.categoryKey || "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title) return;
    try {
      if (editingMedia) await heroApi.update(editingMedia.id, form);
      else await heroApi.create({ ...form, order: medias.length + 1 });
      await loadAll();
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setShowModal(false);
      }, 900);
    } catch (err) {
      console.error("Erreur save hero", err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await heroApi.delete(id);
      await loadAll();
    } catch (err) {
      console.error("Erreur delete hero", err.message);
    }
    setDeleteConfirm(null);
  };

  const handleToggle = async (media) => {
    try {
      await heroApi.toggle(media.id);
      await loadAll();
    } catch (err) {
      console.error("Erreur toggle hero", err.message);
    }
  };

  const handleMove = async (media, direction) => {
    const sorted = [...medias].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex((m) => m.id === media.id);
    const swapIdx = direction === "up" ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    try {
      await heroApi.update(media.id, { order: sorted[swapIdx].order });
      await heroApi.update(sorted[swapIdx].id, { order: media.order });
      await loadAll();
    } catch (err) {
      console.error("Erreur move hero", err.message);
    }
  };

  const TypeIcon = ({ type }) => {
    const opt = typeOptions.find((t) => t.value === type);
    if (!opt) return null;
    const Icon = opt.icon;
    return <Icon className="w-3.5 h-3.5" />;
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-black text-2xl text-apple-black">
            Hero Médias
          </h1>
          <p className="text-apple-mid text-sm mt-1">
            {loading
              ? "Chargement..."
              : `${sortedMedias.length} slide${sortedMedias.length > 1 ? "s" : ""} configuré${sortedMedias.length > 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-[13px] text-apple-mid hover:text-apple-black transition-colors"
          >
            Prévisualiser <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-apple-black hover:bg-neutral-800 text-white font-semibold px-4 py-2.5 rounded-2xl transition-all text-sm"
          >
            <Plus className="w-4 h-4" /> Ajouter
          </button>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-4 flex items-start gap-3">
        <Layers
          className="w-4 h-4 text-apple-mid flex-shrink-0 mt-0.5"
          strokeWidth={1.6}
        />
        <p className="text-[13px] text-apple-mid leading-relaxed">
          Les slides s&apos;affichent dans l&apos;ordre défini. Les slides
          inactifs ne s&apos;affichent pas sur le site. Si tous les slides sont
          inactifs, les dégradés par défaut sont utilisés comme fallback.
        </p>
      </div>

      <div className="glass-card rounded-3xl overflow-hidden">
        {loading ? (
          <div className="text-center py-16">
            <div className="w-6 h-6 border-2 border-black/20 border-t-black/70 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-apple-mid text-sm">Chargement des slides...</p>
          </div>
        ) : sortedMedias.length === 0 ? (
          <div className="text-center py-16">
            <Layers
              className="w-10 h-10 text-apple-mid/40 mx-auto mb-3"
              strokeWidth={1}
            />
            <p className="text-apple-mid text-sm">Aucun slide configuré</p>
            <p className="text-apple-mid/60 text-xs mt-1">
              Les dégradés par défaut seront utilisés
            </p>
          </div>
        ) : (
          <div className="divide-y divide-black/[0.05]">
            {sortedMedias.map((media, index) => (
              <div
                key={media.id}
                className={`flex items-center gap-4 px-5 py-4 hover:bg-black/[0.02] transition-all ${!media.active ? "opacity-45" : ""}`}
              >
                <GripVertical className="w-4 h-4 text-apple-mid/30 flex-shrink-0" />
                <div
                  className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center bg-gradient-to-br ${media.type === "gradient" ? media.bg : "from-black/10 to-black/20"}`}
                >
                  <TypeIcon type={media.type} />
                  {media.type !== "gradient" && (
                    <span className="text-white/60 text-[10px]">
                      {media.type === "image" ? "IMG" : "VID"}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-apple-black text-[13px] truncate">
                      {media.title}
                    </p>
                    <span className="text-[10px] bg-black/[0.05] text-apple-mid px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                      {typeOptions.find((t) => t.value === media.type)?.label}
                    </span>
                  </div>
                  <p className="text-apple-mid text-[12px] truncate">
                    {media.subtitle}
                  </p>
                  {media.href && (
                    <div className="flex items-center gap-1 mt-1">
                      <Link2 className="w-3 h-3 text-apple-mid/40" />
                      <span className="text-[11px] text-apple-mid/50 font-mono">
                        {media.href}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-0.5 flex-shrink-0">
                  <button
                    onClick={() => handleMove(media, "up")}
                    disabled={index === 0}
                    className="p-1 rounded-lg hover:bg-black/[0.05] transition disabled:opacity-20"
                  >
                    <ChevronUp className="w-3.5 h-3.5 text-apple-mid" />
                  </button>
                  <button
                    onClick={() => handleMove(media, "down")}
                    disabled={index === sortedMedias.length - 1}
                    className="p-1 rounded-lg hover:bg-black/[0.05] transition disabled:opacity-20"
                  >
                    <ChevronDown className="w-3.5 h-3.5 text-apple-mid" />
                  </button>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleToggle(media)}
                    className="p-2 rounded-xl hover:bg-black/[0.05] transition text-apple-mid hover:text-apple-black"
                    title={media.active ? "Désactiver" : "Activer"}
                  >
                    {media.active ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => openEdit(media)}
                    className="p-2 rounded-xl hover:bg-blue-50 transition text-apple-mid hover:text-blue-600"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(media.id)}
                    className="p-2 rounded-xl hover:bg-red-50 transition text-apple-mid hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Ajout/Édition */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-5 border-b border-black/[0.06] flex items-center justify-between rounded-t-3xl z-10">
              <h2 className="font-display font-bold text-lg text-apple-black">
                {editingMedia ? "Modifier le slide" : "Nouveau slide"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-apple-gray rounded-xl transition"
              >
                <X className="w-5 h-5 text-apple-mid" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              {/* Type de fond */}
              <div>
                <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-2 block">
                  Type de fond
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {typeOptions.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => updateForm("type", opt.value)}
                        className={`flex flex-col items-center gap-2 py-3 rounded-2xl text-[12px] font-medium transition-all ${form.type === opt.value ? "bg-apple-black text-white" : "bg-black/[0.04] text-apple-mid hover:bg-black/[0.07]"}`}
                      >
                        <Icon className="w-4 h-4" strokeWidth={1.6} />{" "}
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* MediaUploader */}
              {(form.type === "image" || form.type === "video") && (
                <MediaUploader
                  value={form.url}
                  onChange={(url) => updateForm("url", url)}
                  folder="mtechbenin/hero"
                  accept={form.type === "video" ? "video/*" : "image/*"}
                  label={
                    form.type === "image" ? "Image du slide" : "Vidéo du slide"
                  }
                />
              )}

              {/* Dégradé */}
              {form.type === "gradient" && (
                <div>
                  <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-2 block">
                    Dégradé
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {gradients.map((g) => (
                      <button
                        key={g.value}
                        onClick={() => updateForm("bg", g.value)}
                        title={g.label}
                        className={`relative h-12 rounded-2xl bg-gradient-to-br ${g.value} transition-all ${form.bg === g.value ? "ring-2 ring-apple-black ring-offset-2" : "opacity-70 hover:opacity-100"}`}
                      >
                        {form.bg === g.value && (
                          <Check className="w-4 h-4 text-white absolute inset-0 m-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="h-px bg-black/[0.06]" />

              {/* Champs texte */}
              {[
                {
                  key: "tag",
                  label: "Tag (badge en haut)",
                  placeholder: "Nouveauté, Best Seller...",
                },
                { key: "title", label: "Titre *", placeholder: "AirPods Pro" },
                {
                  key: "subtitle",
                  label: "Sous-titre",
                  placeholder: "2ème Génération",
                },
                {
                  key: "badge",
                  label: "Badge prix",
                  placeholder: "À partir de 9 750 FCFA",
                },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1.5 block">
                    {label}
                  </label>
                  <input
                    value={form[key]}
                    onChange={(e) => updateForm(key, e.target.value)}
                    placeholder={placeholder}
                    className="w-full bg-black/[0.03] rounded-xl px-4 py-3 text-sm border border-black/[0.07] focus:outline-none focus:border-black/20 transition"
                  />
                </div>
              ))}

              {/* Description */}
              <div>
                <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1.5 block">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => updateForm("description", e.target.value)}
                  placeholder="Description courte du slide..."
                  rows={2}
                  className="w-full bg-black/[0.03] rounded-xl px-4 py-3 text-sm border border-black/[0.07] focus:outline-none focus:border-black/20 transition resize-none"
                />
              </div>

              {/* CTA + lien */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1.5 block">
                    Texte bouton
                  </label>
                  <input
                    value={form.cta}
                    onChange={(e) => updateForm("cta", e.target.value)}
                    placeholder="Découvrir"
                    className="w-full bg-black/[0.03] rounded-xl px-4 py-3 text-sm border border-black/[0.07] focus:outline-none focus:border-black/20 transition"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1.5 block">
                    Lien URL
                  </label>
                  <input
                    value={form.href}
                    onChange={(e) => updateForm("href", e.target.value)}
                    placeholder="/catalogue/ecouteurs"
                    className="w-full bg-black/[0.03] rounded-xl px-4 py-3 text-sm font-mono border border-black/[0.07] focus:outline-none focus:border-black/20 transition"
                  />
                </div>
              </div>

              {/* Toggle actif */}
              <div className="flex items-center justify-between p-4 bg-black/[0.03] rounded-2xl">
                <div>
                  <p className="font-medium text-apple-black text-sm">
                    Slide actif
                  </p>
                  <p className="text-apple-mid text-xs mt-0.5">
                    Visible sur le site
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
                disabled={!form.title}
                className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-sm transition-all ${saved ? "bg-green-500 text-white" : "bg-apple-black hover:bg-neutral-800 text-white disabled:opacity-40 disabled:cursor-not-allowed"}`}
              >
                {saved ? (
                  <>
                    <Check className="w-4 h-4" /> Sauvegardé !
                  </>
                ) : editingMedia ? (
                  "Modifier le slide"
                ) : (
                  "Créer le slide"
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
              Supprimer ce slide ?
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
