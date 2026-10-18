"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, X, Save, FileText, Clock } from "lucide-react";
import { legalApi } from "@/lib/api";
import RichEditor from "@/components/ui/RichEditor";

const PAGE_ICONS = {
  "politique-confidentialite": "🔒",
  cgv: "📋",
  "politique-cookies": "🍪",
  retours: "↩️",
  livraison: "🚚",
};

function formatDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminLegal() {
  const [pages, setPages] = useState([]);
  const [selected, setSelected] = useState(null);
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await legalApi.getAll();
      setPages(data.pages || []);
      if (!selected && data.pages?.length > 0) {
        setSelected(data.pages[0]);
        setContent(data.pages[0].content || "");
      }
    } catch { showToast("Erreur de chargement", "error"); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const selectPage = (page) => {
    if (hasChanges && !window.confirm("Modifications non sauvegardées — les abandonner et changer de page ?")) {
      return;
    }
    setSelected(page);
    setContent(page.content || "");
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const data = await legalApi.upsert(selected.slug, {
        title: selected.title,
        content,
      });
      setPages((prev) =>
        prev.map((p) => p.slug === selected.slug ? { ...p, ...data.page } : p)
      );
      setSelected((prev) => ({ ...prev, ...data.page }));
      showToast("Page sauvegardée !");
    } catch { showToast("Erreur lors de la sauvegarde", "error"); }
    setSaving(false);
  };

  const hasChanges = selected && content !== (selected.content || "");

  return (
    <div className="flex gap-5 h-full relative">
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

      {/* Sidebar pages */}
      <aside className="w-52 flex-shrink-0">
        <p className="text-[10px] font-semibold text-apple-mid uppercase tracking-widest mb-3 px-1">
          Pages
        </p>
        <nav className="space-y-1">
          {pages.map((page) => (
            <button
              key={page.slug}
              onClick={() => selectPage(page)}
              className={`w-full flex items-start gap-3 px-3 py-3 rounded-2xl text-left transition-all ${
                selected?.slug === page.slug
                  ? "bg-apple-black text-white"
                  : "text-apple-mid hover:text-apple-black hover:bg-black/[0.04]"
              }`}
            >
              <span className="text-base leading-none mt-0.5 flex-shrink-0">
                {PAGE_ICONS[page.slug] || "📄"}
              </span>
              <div className="min-w-0">
                <p className="text-[12px] font-semibold truncate">{page.title}</p>
                {page.updatedAt ? (
                  <p className={`text-[10px] mt-0.5 ${selected?.slug === page.slug ? "text-white/50" : "text-apple-mid/60"}`}>
                    Modifié
                  </p>
                ) : (
                  <p className={`text-[10px] mt-0.5 ${selected?.slug === page.slug ? "text-white/50" : "text-amber-500"}`}>
                    Non configuré
                  </p>
                )}
              </div>
            </button>
          ))}
        </nav>
      </aside>

      {/* Éditeur */}
      <div className="flex-1 min-w-0">
        {selected ? (
          <div className="space-y-4">
            {/* Header page */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{PAGE_ICONS[selected.slug] || "📄"}</span>
                  <h2 className="font-display font-bold text-xl text-apple-black">
                    {selected.title}
                  </h2>
                </div>
                {selected.updatedAt && (
                  <p className="flex items-center gap-1 text-[11px] text-apple-mid">
                    <Clock className="w-3 h-3" />
                    Dernière sauvegarde : {formatDate(selected.updatedAt)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {hasChanges && (
                  <span className="text-[11px] text-amber-600 font-medium px-2 py-1 rounded-lg bg-amber-50">
                    Modifications non sauvegardées
                  </span>
                )}
                <button
                  onClick={handleSave}
                  disabled={saving || !hasChanges}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-apple-black text-white text-[13px] font-semibold disabled:opacity-50 transition hover:bg-apple-black/80"
                >
                  {saving ? (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  {saving ? "Sauvegarde..." : "Sauvegarder & Publier"}
                </button>
              </div>
            </div>

            {/* Éditeur TipTap */}
            <RichEditor
              key={selected.slug}
              content={content}
              onChange={setContent}
              placeholder={`Commencez à rédiger la page "${selected.title}"...`}
            />

            {/* URL publique */}
            <p className="text-[11px] text-apple-mid">
              URL publique :{" "}
              <a
                href={`/${selected.slug}`}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline"
              >
                /{selected.slug}
              </a>
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileText className="w-10 h-10 text-apple-mid/30 mb-3" />
            <p className="text-apple-mid text-sm">Sélectionnez une page à modifier</p>
          </div>
        )}
      </div>
    </div>
  );
}
