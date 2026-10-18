"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Plus, Pencil, Trash2, Eye, EyeOff, ArrowUp, ArrowDown, X, RefreshCw, Video,
} from "lucide-react";
import { clientMediaApi } from "@/lib/api";
import MediaUploader from "@/components/admin/MediaUploader";
import { urlVideoJouable } from "@/lib/media";

const emptyForm = { url: "", type: "image", caption: "" };

export default function AdminClientMedia() {
  const [medias, setMedias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  // Média en cours de modification, ou null si la fenêtre sert à en ajouter un.
  // C'est ce qui distingue les deux usages d'une même fenêtre.
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await clientMediaApi.getAll();
      setMedias(data.medias || []);
    } catch (err) {
      setError("Chargement impossible — " + (err.message || "réessayez"));
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setShowModal(true);
  };

  // Referme en remettant l'état à zéro : sans ça, un média resté « en édition »
  // après une fermeture pourrait être écrasé à la réouverture de la fenêtre.
  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const openEdit = (media) => {
    setEditing(media);
    setForm({
      url: media.url,
      type: media.type || "image",
      caption: media.caption || "",
    });
    setError("");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.url) return;
    setSaving(true);
    setError("");
    try {
      // Même fenêtre pour les deux cas : on crée, ou on met à jour le média
      // ouvert en édition. `order` et `active` ne sont pas envoyés — ils se
      // pilotent depuis les flèches et l'œil, pas depuis ce formulaire.
      if (editing) {
        await clientMediaApi.update(editing.id, form);
      } else {
        await clientMediaApi.create(form);
      }
      closeModal();
      await load();
    } catch (err) {
      setError("Enregistrement impossible — " + (err.message || "réessayez"));
    }
    setSaving(false);
  };

  const handleToggle = async (id) => {
    try {
      await clientMediaApi.toggle(id);
      await load();
    } catch (err) {
      setError("Modification impossible — " + (err.message || "réessayez"));
    }
  };

  const handleDelete = async (id) => {
    try {
      await clientMediaApi.delete(id);
      setDeleteConfirm(null);
      await load();
    } catch (err) {
      setError("Suppression impossible — " + (err.message || "réessayez"));
      setDeleteConfirm(null);
    }
  };

  // Échange les valeurs `order` des deux voisins, puis recharge.
  const handleMove = async (id, direction) => {
    const sorted = [...medias].sort((a, b) => a.order - b.order);
    const i = sorted.findIndex((m) => m.id === id);
    const j = direction === "up" ? i - 1 : i + 1;
    if (j < 0 || j >= sorted.length) return;
    try {
      await clientMediaApi.update(sorted[i].id, { order: sorted[j].order });
      await clientMediaApi.update(sorted[j].id, { order: sorted[i].order });
      await load();
    } catch (err) {
      setError("Réorganisation impossible — " + (err.message || "réessayez"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display font-black text-2xl text-apple-black tracking-tight">
            Clients satisfaits
          </h1>
          <p className="text-apple-mid text-[13px] mt-1">
            Photos et vidéos affichées sur la page d&apos;accueil.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-medium text-apple-mid hover:text-apple-black bg-apple-gray transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold bg-apple-black text-white hover:bg-neutral-800 transition"
          >
            <Plus className="w-4 h-4" /> Ajouter
          </button>
        </div>
      </div>

      {error && (
        <p className="text-red-600 text-[13px] bg-red-50 rounded-xl px-4 py-3">{error}</p>
      )}

      {medias.length === 0 && !loading ? (
        <div className="text-center py-16 glass-card rounded-3xl">
          <p className="text-apple-mid text-sm">
            Aucun média — la section n&apos;apparaît pas sur l&apos;accueil.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...medias].sort((a, b) => a.order - b.order).map((m, i, arr) => (
            <div
              key={m.id}
              className={`glass-card rounded-3xl overflow-hidden ${m.active ? "" : "opacity-50"}`}
            >
              <div className="relative aspect-[3/4] bg-black/[0.04]">
                {m.type === "video" ? (
                  // `#t=0.1` demande la vignette à 0,1 s : sans ça, Safari et
                  // iOS affichent un cadre gris au lieu de la première image.
                  // On ne l'ajoute que si l'URL n'a pas déjà une ancre, sinon le
                  // fragment devient invalide et le navigateur l'ignore.
                  <video
                    src={(() => { const u = urlVideoJouable(m.url); return u.includes("#") ? u : `${u}#t=0.1`; })()}
                    muted
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Image src={m.url} alt={m.caption || ""} fill className="object-cover" sizes="25vw" />
                )}
                {m.type === "video" && (
                  <span className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center">
                    <Video className="w-3 h-3 text-white" />
                  </span>
                )}
              </div>
              <div className="p-3 space-y-2">
                <p className="text-[12px] text-apple-black line-clamp-2 min-h-[2rem]">
                  {m.caption || <span className="text-apple-mid/60">Sans légende</span>}
                </p>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleMove(m.id, "up")} disabled={i === 0}
                    aria-label="Monter"
                    className="p-1.5 rounded-lg hover:bg-black/[0.05] disabled:opacity-30 transition">
                    <ArrowUp className="w-3.5 h-3.5 text-apple-mid" />
                  </button>
                  <button onClick={() => handleMove(m.id, "down")} disabled={i === arr.length - 1}
                    aria-label="Descendre"
                    className="p-1.5 rounded-lg hover:bg-black/[0.05] disabled:opacity-30 transition">
                    <ArrowDown className="w-3.5 h-3.5 text-apple-mid" />
                  </button>
                  <button onClick={() => handleToggle(m.id)}
                    aria-label={m.active ? "Masquer" : "Afficher"}
                    className="p-1.5 rounded-lg hover:bg-black/[0.05] transition">
                    {m.active
                      ? <Eye className="w-3.5 h-3.5 text-green-600" />
                      : <EyeOff className="w-3.5 h-3.5 text-apple-mid" />}
                  </button>
                  <button onClick={() => openEdit(m)}
                    aria-label="Modifier"
                    className="p-1.5 rounded-lg hover:bg-black/[0.05] transition">
                    <Pencil className="w-3.5 h-3.5 text-apple-mid" />
                  </button>
                  <button onClick={() => setDeleteConfirm(m.id)}
                    aria-label="Supprimer"
                    className="p-1.5 rounded-lg hover:bg-red-50 transition ml-auto">
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-5 border-b border-black/[0.06] flex items-center justify-between rounded-t-3xl">
              <h2 className="font-display font-bold text-lg text-apple-black">
                {editing ? "Modifier le média" : "Ajouter un média"}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-black/[0.05] rounded-xl transition">
                <X className="w-5 h-5 text-apple-mid" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <MediaUploader
                value={form.url}
                onChange={(url, type) =>
                  setForm((p) => ({ ...p, url, type: type || "image" }))
                }
                folder="mtechbenin/clients"
                accept="image/*,video/*"
                label="Photo ou vidéo du client"
              />
              <div>
                <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1.5 block">
                  Légende (optionnelle)
                </label>
                <input
                  value={form.caption}
                  onChange={(e) => setForm((p) => ({ ...p, caption: e.target.value }))}
                  maxLength={140}
                  placeholder="Ex : Fatou · Cotonou — ses AirPods reçus en 2h"
                  className="w-full bg-black/[0.03] text-apple-black text-[14px] placeholder-apple-mid/50 rounded-2xl px-4 py-3 border border-black/[0.07] focus:outline-none focus:border-black/20 transition"
                />
                <p className="text-[11px] text-apple-mid mt-1.5">
                  Laisser vide pour n&apos;afficher que le média.
                </p>
              </div>
              <button
                onClick={handleSave}
                disabled={!form.url || saving}
                className="w-full py-3 rounded-2xl bg-apple-black text-white font-semibold text-[13px] hover:bg-neutral-800 transition disabled:opacity-40"
              >
                {saving
                  ? "Enregistrement..."
                  : editing
                    ? "Enregistrer les modifications"
                    : "Ajouter à l'accueil"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm text-center">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="font-display font-bold text-lg text-apple-black mb-2">
              Supprimer ce média ?
            </h3>
            <p className="text-apple-mid text-sm mb-6">Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-3 rounded-2xl glass-card text-apple-black font-semibold text-sm hover:bg-apple-gray transition">
                Annuler
              </button>
              <button onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
