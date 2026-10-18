"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Reorder, useDragControls, AnimatePresence, motion } from "framer-motion";
import {
  Plus,
  GripVertical,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Check,
  X,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { faqApi } from "@/lib/api";

const CATEGORIES = ["Commandes", "Paiement", "Livraison", "Abonnements Digitaux", "Retours", "Général"];

function FaqItem({ faq, onEdit, onDelete, onTogglePublish }) {
  const controls = useDragControls();
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(faq.id);
  };

  return (
    <Reorder.Item value={faq} dragListener={false} dragControls={controls}>
      <div className={`glass-card rounded-2xl overflow-hidden mb-2 ${!faq.isPublished ? "opacity-60" : ""}`}>
        <div className="flex items-start gap-3 p-4">
          <button
            onPointerDown={(e) => controls.start(e)}
            className="mt-0.5 cursor-grab active:cursor-grabbing text-apple-mid/40 hover:text-apple-mid flex-shrink-0"
          >
            <GripVertical className="w-4 h-4" />
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-apple-gray text-apple-mid">
                {faq.category}
              </span>
              {!faq.isPublished && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">
                  Masqué
                </span>
              )}
            </div>
            <button
              className="text-left w-full"
              onClick={() => setExpanded((v) => !v)}
            >
              <p className="font-medium text-apple-black text-[13px] pr-4">
                {faq.question}
              </p>
            </button>
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <p className="text-apple-mid text-[12px] leading-relaxed mt-2 pr-4">
                    {faq.answer}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => setExpanded((v) => !v)}
              className="p-1.5 rounded-xl text-apple-mid hover:text-apple-black hover:bg-black/[0.04] transition"
            >
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => onTogglePublish(faq)}
              className="p-1.5 rounded-xl text-apple-mid hover:text-apple-black hover:bg-black/[0.04] transition"
              title={faq.isPublished ? "Masquer" : "Publier"}
            >
              {faq.isPublished ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => onEdit(faq)}
              className="p-1.5 rounded-xl text-apple-mid hover:text-apple-black hover:bg-black/[0.04] transition"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-1.5 rounded-xl text-apple-mid hover:text-red-500 hover:bg-red-50 transition disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </Reorder.Item>
  );
}

function FaqForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({
    category: initial?.category || "Général",
    question: initial?.question || "",
    answer: initial?.answer || "",
    isPublished: initial?.isPublished !== false,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.question.trim() || !form.answer.trim()) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="glass-card rounded-2xl p-5 mb-4 ring-1 ring-primary/20"
    >
      <p className="font-semibold text-apple-black text-sm mb-4">
        {initial ? "Modifier l'entrée" : "Nouvelle entrée FAQ"}
      </p>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-apple-mid mb-1 block">Catégorie</label>
          <select
            value={form.category}
            onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
            className="w-full bg-apple-gray rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
            <option value="Autre">Autre (saisir manuellement)</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-apple-mid mb-1 block">Question *</label>
          <input
            value={form.question}
            onChange={(e) => setForm((p) => ({ ...p, question: e.target.value }))}
            placeholder="Ex: Comment passer une commande ?"
            className="w-full bg-apple-gray rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-apple-mid mb-1 block">Réponse *</label>
          <textarea
            value={form.answer}
            onChange={(e) => setForm((p) => ({ ...p, answer: e.target.value }))}
            placeholder="Réponse détaillée..."
            rows={4}
            className="w-full bg-apple-gray rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
          />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isPublished}
            onChange={(e) => setForm((p) => ({ ...p, isPublished: e.target.checked }))}
            className="rounded"
          />
          <span className="text-sm text-apple-black">Publié (visible sur le site)</span>
        </label>
      </div>

      <div className="flex gap-2 mt-4">
        <button
          onClick={handleSave}
          disabled={saving || !form.question.trim() || !form.answer.trim()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-apple-black text-white text-[13px] font-semibold disabled:opacity-50 transition"
        >
          <Check className="w-3.5 h-3.5" />
          {saving ? "Sauvegarde..." : "Sauvegarder"}
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-apple-gray text-apple-mid text-[13px] font-medium hover:text-apple-black transition"
        >
          <X className="w-3.5 h-3.5" /> Annuler
        </button>
      </div>
    </motion.div>
  );
}

export default function AdminFaq() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null); // faq object or "new"
  const [toast, setToast] = useState(null);
  const [reordering, setReordering] = useState(false);
  // Ordre le plus récent en attente d'envoi, si un drag arrive pendant qu'un
  // précédent est déjà en train de se sauvegarder — sinon cet ordre était
  // silencieusement perdu (jamais persisté) sans que l'admin le sache.
  const pendingOrderRef = useRef(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await faqApi.getAll();
      setFaqs(data.faqs || []);
    } catch { showToast("Erreur de chargement", "error"); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const persistOrder = async (order) => {
    setReordering(true);
    try {
      await faqApi.reorder(order.map((f) => f.id));
    } catch { showToast("Erreur lors de la réorganisation", "error"); }
    setReordering(false);

    if (pendingOrderRef.current) {
      const next = pendingOrderRef.current;
      pendingOrderRef.current = null;
      await persistOrder(next);
    }
  };

  const handleReorder = (newOrder) => {
    setFaqs(newOrder);
    if (reordering) {
      // Une sauvegarde précédente est en vol — on mémorise ce nouvel ordre
      // pour l'envoyer juste après, au lieu de l'ignorer silencieusement.
      pendingOrderRef.current = newOrder;
      return;
    }
    persistOrder(newOrder);
  };

  const handleSave = async (form) => {
    try {
      if (editing === "new") {
        const data = await faqApi.create(form);
        setFaqs((prev) => [...prev, data.faq]);
        showToast("FAQ ajoutée !");
      } else {
        const data = await faqApi.update(editing.id, form);
        setFaqs((prev) => prev.map((f) => f.id === editing.id ? data.faq : f));
        showToast("FAQ mise à jour !");
      }
      setEditing(null);
    } catch { showToast("Erreur lors de la sauvegarde", "error"); }
  };

  const handleDelete = async (id) => {
    try {
      await faqApi.delete(id);
      setFaqs((prev) => prev.filter((f) => f.id !== id));
      showToast("FAQ supprimée");
    } catch { showToast("Erreur lors de la suppression", "error"); }
  };

  const handleTogglePublish = async (faq) => {
    try {
      const data = await faqApi.update(faq.id, { isPublished: !faq.isPublished });
      setFaqs((prev) => prev.map((f) => f.id === faq.id ? data.faq : f));
    } catch { showToast("Erreur", "error"); }
  };

  const published = faqs.filter((f) => f.isPublished).length;

  return (
    <div className="space-y-5 relative">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl text-[13px] font-semibold shadow-lg ${
              toast.type === "error" ? "bg-red-500 text-white" : "bg-apple-black text-white"
            }`}
          >
            {toast.type === "error" ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats + actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-4">
          <div className="glass-card rounded-2xl px-5 py-3">
            <p className="text-apple-mid text-xs mb-0.5">Total</p>
            <p className="font-display font-black text-xl text-apple-black">{faqs.length}</p>
          </div>
          <div className="glass-card rounded-2xl px-5 py-3">
            <p className="text-apple-mid text-xs mb-0.5">Publiées</p>
            <p className="font-display font-black text-xl text-green-600">{published}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-medium text-apple-mid hover:text-apple-black bg-apple-gray transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setEditing("new")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-apple-black text-white text-[13px] font-semibold transition hover:bg-apple-black/80"
          >
            <Plus className="w-3.5 h-3.5" /> Ajouter une FAQ
          </button>
        </div>
      </div>

      {/* Formulaire ajout/édition */}
      <AnimatePresence>
        {editing && (
          <FaqForm
            key="form"
            initial={editing === "new" ? null : editing}
            onSave={handleSave}
            onCancel={() => setEditing(null)}
          />
        )}
      </AnimatePresence>

      {/* Aide DnD */}
      {faqs.length > 1 && (
        <p className="text-[11px] text-apple-mid flex items-center gap-1.5">
          <GripVertical className="w-3 h-3" />
          Glissez les entrées pour les réorganiser — l&apos;ordre est sauvegardé automatiquement
        </p>
      )}

      {/* Liste avec DnD */}
      {faqs.length === 0 && !loading ? (
        <div className="text-center py-16">
          <p className="text-apple-mid text-sm">Aucune entrée FAQ — ajoutez-en une ci-dessus</p>
        </div>
      ) : (
        <Reorder.Group axis="y" values={faqs} onReorder={handleReorder} className="space-y-0">
          {faqs.map((faq) => (
            <FaqItem
              key={faq.id}
              faq={faq}
              onEdit={setEditing}
              onDelete={handleDelete}
              onTogglePublish={handleTogglePublish}
            />
          ))}
        </Reorder.Group>
      )}
    </div>
  );
}
