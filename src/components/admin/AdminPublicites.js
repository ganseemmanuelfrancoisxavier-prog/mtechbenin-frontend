"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Plus, Pencil, Trash2, Eye, EyeOff, ArrowUp, ArrowDown, X, RefreshCw, Video, Link2,
} from "lucide-react";
import { adsApi } from "@/lib/api";
import MediaUploader from "@/components/admin/MediaUploader";
import { urlVideoJouable } from "@/lib/media";

const emptyForm = { advertiser: "", caption: "", href: "", url: "", type: "image" };

export default function AdminPublicites() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  // Annonce en cours de modification, ou null si la fenêtre sert à en ajouter une.
  // C'est ce qui distingue les deux usages d'une même fenêtre.
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [error, setError] = useState("");
  // Identifiants des annonces dont le visuel a échoué au chargement dans la
  // vignette — sans ce suivi, une image cassée resterait un blanc silencieux.
  const [imageErrorIds, setImageErrorIds] = useState(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adsApi.getAll();
      setAds(data.ads || []);
      setImageErrorIds(new Set());
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

  // Referme en remettant l'état à zéro : sans ça, une annonce restée « en
  // édition » après une fermeture pourrait être écrasée à la réouverture de
  // la fenêtre.
  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const openEdit = (ad) => {
    setEditing(ad);
    setForm({
      advertiser: ad.advertiser || "",
      caption: ad.caption || "",
      href: ad.href || "",
      url: ad.url,
      type: ad.type || "image",
    });
    setError("");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.advertiser || !form.url) return;
    setSaving(true);
    setError("");
    try {
      // Même fenêtre pour les deux cas : on crée, ou on met à jour l'annonce
      // ouverte en édition. `order` et `active` ne sont pas envoyés — ils se
      // pilotent depuis les flèches et l'œil, pas depuis ce formulaire. La
      // validation du lien (adresse http/https) est faite par le serveur ;
      // son message d'erreur, s'il y en a un, est affiché tel quel.
      if (editing) {
        await adsApi.update(editing.id, form);
      } else {
        await adsApi.create(form);
      }
      closeModal();
      await load();
    } catch (err) {
      setError(err.message || "Enregistrement impossible — réessayez");
    }
    setSaving(false);
  };

  // Le rechargement est dans `finally` : si l'écriture échoue, l'écran doit
  // quand même refléter l'état réel du serveur plutôt que de garder l'état
  // d'avant le clic. Sinon un propriétaire qui voit un message d'échec et une
  // annonce toujours « allumée » pourrait recliquer et la rallumer sans le
  // vouloir.
  //
  // `load()` efface l'erreur à son tout début (pour repartir propre à chaque
  // rafraîchissement normal) : l'appeler depuis ce `finally` effacerait donc
  // silencieusement le message qu'on vient de poser. On le repose après coup,
  // une fois le rechargement terminé, pour qu'il reste réellement affiché.
  const handleToggle = async (id) => {
    let echec = null;
    try {
      await adsApi.toggle(id);
    } catch (err) {
      echec = "Modification impossible — " + (err.message || "réessayez");
    } finally {
      await load();
      if (echec) setError(echec);
    }
  };

  const handleDelete = async (id) => {
    let echec = null;
    try {
      await adsApi.delete(id);
    } catch (err) {
      echec = "Suppression impossible — " + (err.message || "réessayez");
    } finally {
      setDeleteConfirm(null);
      await load();
      if (echec) setError(echec);
    }
  };

  // Échange les valeurs `order` des deux voisins, puis recharge — dans tous
  // les cas, succès comme échec (voir handleToggle).
  //
  // Si les deux voisins partagent déjà le même rang (résidu d'un échange
  // précédemment interrompu entre la première et la seconde écriture), les
  // échanger ne changerait rien : le clic suivant lirait à nouveau la même
  // valeur des deux côtés et resterait sans effet, silencieusement, pour
  // toujours sur cette paire. On le détecte et on le dit plutôt que de
  // tenter une écriture inutile.
  const handleMove = async (id, direction) => {
    const sorted = [...ads].sort((a, b) => a.order - b.order);
    const i = sorted.findIndex((a) => a.id === id);
    const j = direction === "up" ? i - 1 : i + 1;
    if (j < 0 || j >= sorted.length) return;
    if (sorted[i].order === sorted[j].order) {
      setError(
        "Deux annonces partagent le même rang — l'ordre doit être réparé avant de pouvoir les déplacer.",
      );
      return;
    }
    let echec = null;
    try {
      await adsApi.update(sorted[i].id, { order: sorted[j].order });
      await adsApi.update(sorted[j].id, { order: sorted[i].order });
    } catch (err) {
      echec = "Réorganisation impossible — " + (err.message || "réessayez");
    } finally {
      await load();
      if (echec) setError(echec);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display font-black text-2xl text-apple-black tracking-tight">
            Publicités
          </h1>
          <p className="text-apple-mid text-[13px] mt-1">
            Emplacement publicitaire affiché sur la page d&apos;accueil.
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

      {ads.length === 0 && !loading ? (
        <div className="text-center py-16 glass-card rounded-3xl">
          <p className="text-apple-mid text-sm">
            Aucune publicité — la section n&apos;apparaît pas sur l&apos;accueil.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...ads].sort((a, b) => a.order - b.order).map((a, i, arr) => (
            <div
              key={a.id}
              className={`glass-card rounded-3xl overflow-hidden ${a.active ? "" : "opacity-50"}`}
            >
              {/* Même rapport que le bandeau de l'accueil (16/9) : une
                  vignette d'un autre format validerait un visuel que l'accueil
                  recadrerait ensuite différemment. Les deux doivent changer
                  ensemble. */}
              <div className="relative bg-black/[0.04]" style={{ aspectRatio: "16 / 9" }}>
                {a.type === "video" ? (
                  // `#t=0.1` demande la vignette à 0,1 s : sans ça, Safari et
                  // iOS affichent un cadre gris au lieu de la première image.
                  // On ne l'ajoute que si l'URL n'a pas déjà une ancre, sinon le
                  // fragment devient invalide et le navigateur l'ignore.
                  <video
                    src={(() => { const u = urlVideoJouable(a.url); return u.includes("#") ? u : `${u}#t=0.1`; })()}
                    muted
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Image
                    src={a.url}
                    alt={a.advertiser || ""}
                    fill
                    className="object-cover"
                    sizes="25vw"
                    onError={() => setImageErrorIds((p) => new Set(p).add(a.id))}
                  />
                )}
                {a.type !== "video" && imageErrorIds.has(a.id) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/[0.04] text-apple-mid text-[11px] gap-1 px-2 text-center">
                    Visuel introuvable
                  </div>
                )}
                {a.type === "video" && (
                  <span className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center">
                    <Video className="w-3 h-3 text-white" />
                  </span>
                )}
              </div>
              <div className="p-3 space-y-2">
                <p className="text-[13px] font-semibold text-apple-black truncate">
                  {a.advertiser}
                </p>
                <p className="text-[12px] text-apple-mid line-clamp-2 min-h-[2rem]">
                  {a.caption || <span className="text-apple-mid/60">Sans accroche</span>}
                </p>
                {a.href && (
                  <div className="flex items-center gap-1">
                    <Link2 className="w-3 h-3 text-apple-mid/40 flex-shrink-0" />
                    <span className="text-[11px] text-apple-mid/60 font-mono truncate">
                      {a.href}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <button onClick={() => handleMove(a.id, "up")} disabled={i === 0}
                    aria-label="Monter"
                    className="p-1.5 rounded-lg hover:bg-black/[0.05] disabled:opacity-30 transition">
                    <ArrowUp className="w-3.5 h-3.5 text-apple-mid" />
                  </button>
                  <button onClick={() => handleMove(a.id, "down")} disabled={i === arr.length - 1}
                    aria-label="Descendre"
                    className="p-1.5 rounded-lg hover:bg-black/[0.05] disabled:opacity-30 transition">
                    <ArrowDown className="w-3.5 h-3.5 text-apple-mid" />
                  </button>
                  <button onClick={() => handleToggle(a.id)}
                    aria-label={a.active ? "Masquer" : "Afficher"}
                    className="p-1.5 rounded-lg hover:bg-black/[0.05] transition">
                    {a.active
                      ? <Eye className="w-3.5 h-3.5 text-green-600" />
                      : <EyeOff className="w-3.5 h-3.5 text-apple-mid" />}
                  </button>
                  <button onClick={() => openEdit(a)}
                    aria-label="Modifier"
                    className="p-1.5 rounded-lg hover:bg-black/[0.05] transition">
                    <Pencil className="w-3.5 h-3.5 text-apple-mid" />
                  </button>
                  <button onClick={() => setDeleteConfirm(a.id)}
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
                {editing ? "Modifier la publicité" : "Ajouter une publicité"}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-black/[0.05] rounded-xl transition">
                <X className="w-5 h-5 text-apple-mid" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1.5 block">
                  Annonceur
                </label>
                <input
                  value={form.advertiser}
                  onChange={(e) => setForm((p) => ({ ...p, advertiser: e.target.value }))}
                  placeholder="Ex : Boutique Partenaire"
                  className="w-full bg-black/[0.03] text-apple-black text-[14px] placeholder-apple-mid/50 rounded-2xl px-4 py-3 border border-black/[0.07] focus:outline-none focus:border-black/20 transition"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1.5 block">
                  Accroche (optionnelle)
                </label>
                <input
                  value={form.caption}
                  onChange={(e) => setForm((p) => ({ ...p, caption: e.target.value }))}
                  maxLength={140}
                  placeholder="Ex : -20% sur toute la boutique cette semaine"
                  className="w-full bg-black/[0.03] text-apple-black text-[14px] placeholder-apple-mid/50 rounded-2xl px-4 py-3 border border-black/[0.07] focus:outline-none focus:border-black/20 transition"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1.5 block">
                  Lien (optionnel)
                </label>
                <input
                  value={form.href}
                  onChange={(e) => setForm((p) => ({ ...p, href: e.target.value }))}
                  placeholder="https://boutique-partenaire.com"
                  className="w-full bg-black/[0.03] text-apple-black text-[14px] font-mono placeholder-apple-mid/50 rounded-2xl px-4 py-3 border border-black/[0.07] focus:outline-none focus:border-black/20 transition"
                />
                <p className="text-[11px] text-apple-mid mt-1.5">
                  Laisser vide pour une annonce non cliquable.
                </p>
              </div>
              <MediaUploader
                value={form.url}
                onChange={(url, type) =>
                  setForm((p) => ({ ...p, url, type: type || "image" }))
                }
                folder="mtechbenin/ads"
                accept="image/*,video/*"
                label="Visuel de l'annonce"
                hideUrlTab
              />
              <p className="text-[11px] text-apple-mid -mt-3">
                Format attendu : 16/9, le format vidéo courant, comme sur
                l&apos;accueil. Ce qui déborde en haut et en bas sera coupé.
              </p>
              <button
                onClick={handleSave}
                disabled={!form.advertiser || !form.url || saving}
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
              Supprimer cette publicité ?
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
