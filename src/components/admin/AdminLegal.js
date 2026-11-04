"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, FilePlus2, Save, Trash2, X } from "lucide-react";
import { legalApi } from "@/lib/api";
import RichEditor from "@/components/ui/RichEditor";

const emptyDraft = { slug: "", title: "", content: "" };
const toSlug = (value) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
const hasText = (value) => value.replace(/<[^>]*>/g, "").replace(/&nbsp;|&#160;|&#xA0;/gi, " ").trim().length > 0;

export default function AdminLegal() {
  const [pages, setPages] = useState([]);
  const [draft, setDraft] = useState(emptyDraft);
  const [original, setOriginal] = useState(null);
  const [isNew, setIsNew] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const dirty = isNew
    ? Boolean(draft.slug || draft.title || draft.content)
    : JSON.stringify(draft) !== JSON.stringify(original);
  const slugValid = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(draft.slug);
  const canSave = draft.title.trim() && slugValid && hasText(draft.content) && dirty && !saving;

  const notify = (message, error = false) => {
    setToast({ message, error });
    window.setTimeout(() => setToast(null), 3500);
  };

  const choose = (page) => {
    if (dirty && !window.confirm("Abandonner les changements non enregistrés ?")) return;
    const next = { slug: page.slug, title: page.title, content: page.content || "" };
    setDraft(next);
    setOriginal(next);
    setIsNew(false);
    setSlugTouched(true);
  };

  useEffect(() => {
    let active = true;
    legalApi.getAll()
      .then((data) => {
        if (!active) return;
        const list = data.pages || [];
        setPages(list);
        if (list.length) {
          const first = { slug: list[0].slug, title: list[0].title, content: list[0].content || "" };
          setDraft(first);
          setOriginal(first);
          setSlugTouched(true);
        }
      })
      .catch((error) => notify(error.message || "Chargement impossible", true))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const startNew = () => {
    if (dirty && !window.confirm("Abandonner les changements non enregistrés ?")) return;
    setDraft(emptyDraft);
    setOriginal(null);
    setIsNew(true);
    setSlugTouched(false);
  };

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const { page } = await legalApi.upsert(draft.slug, { title: draft.title.trim(), content: draft.content });
      setPages((old) => [page, ...old.filter((item) => item.slug !== page.slug)]);
      const next = { slug: page.slug, title: page.title, content: page.content };
      setDraft(next);
      setOriginal(next);
      setIsNew(false);
      setSlugTouched(true);
      notify("Page publiée sur le site.");
    } catch (error) {
      notify(error.message || "Publication impossible", true);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (isNew || !draft.slug) return;
    if (!window.confirm("Supprimer cette page du site et du panel ?")) return;
    setSaving(true);
    try {
      await legalApi.remove(draft.slug);
      const nextPages = pages.filter((page) => page.slug !== draft.slug);
      setPages(nextPages);
      if (nextPages.length) {
        const next = { slug: nextPages[0].slug, title: nextPages[0].title, content: nextPages[0].content || "" };
        setDraft(next);
        setOriginal(next);
      } else {
        setDraft(emptyDraft);
        setOriginal(null);
      }
      notify("Page supprimée du site.");
    } catch (error) {
      notify(error.message || "Suppression impossible", true);
    } finally {
      setSaving(false);
    }
  };

  const setTitle = (title) => setDraft((value) => ({
    ...value,
    title,
    slug: isNew && !slugTouched ? toSlug(title) : value.slug,
  }));

  return (
    <div className="relative grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
      {toast && (
        <div className={`fixed right-5 top-20 z-50 flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-xl ${toast.error ? "bg-red-600" : "bg-neutral-900"}`}>
          {toast.error ? <X size={16} /> : <Check size={16} />}{toast.message}
        </div>
      )}

      <aside className="rounded-3xl border border-black/5 bg-white p-4 shadow-sm">
        <button type="button" onClick={startNew} className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white">
          <FilePlus2 size={17} /> Nouvelle page
        </button>
        <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-widest text-neutral-400">Pages publiées</p>
        {loading ? <p className="px-1 py-4 text-sm text-neutral-400">Chargement…</p> : pages.length ? (
          <nav className="space-y-1">
            {pages.map((page) => (
              <button key={page.slug} type="button" onClick={() => choose(page)} className={`w-full rounded-xl px-3 py-3 text-left ${draft.slug === page.slug && !isNew ? "bg-neutral-900 text-white" : "text-neutral-700 hover:bg-neutral-100"}`}>
                <span className="block truncate text-sm font-semibold">{page.title}</span>
                <span className={`mt-1 block truncate text-[11px] ${draft.slug === page.slug && !isNew ? "text-white/60" : "text-neutral-400"}`}>/legal/{page.slug}</span>
              </button>
            ))}
          </nav>
        ) : <p className="px-1 py-3 text-sm leading-relaxed text-neutral-500">Aucune page. Crée ta première page légale.</p>}
      </aside>

      <section className="min-w-0 rounded-3xl border border-black/5 bg-white p-5 shadow-sm md:p-7">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">{isNew ? "Créer" : "Modifier"}</p>
            <h2 className="mt-1 text-xl font-black text-neutral-900">{draft.title || (isNew ? "Nouvelle page légale" : "Sélectionne une page")}</h2>
          </div>
          {!isNew && draft.slug && (
            <button type="button" onClick={remove} disabled={saving} className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 disabled:opacity-50">
              <Trash2 size={16} /> Supprimer
            </button>
          )}
        </div>

        {!loading && (isNew || draft.slug) ? (
          <div className="space-y-5">
            <label className="block space-y-2 text-sm font-semibold text-neutral-700">
              Titre de la page
              <input value={draft.title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex. Conditions générales d’utilisation" className="w-full rounded-2xl border border-black/10 bg-neutral-50 px-4 py-3 text-sm outline-none focus:border-black/30" />
            </label>
            <label className="block space-y-2 text-sm font-semibold text-neutral-700">
              Adresse de la page
              <div className="flex items-center overflow-hidden rounded-2xl border border-black/10 bg-neutral-50">
                <span className="whitespace-nowrap pl-4 text-sm text-neutral-400">mtechbenin.com/legal/</span>
                <input value={draft.slug} onChange={(event) => { setSlugTouched(true); setDraft((value) => ({ ...value, slug: toSlug(event.target.value) })); }} disabled={!isNew} placeholder="conditions-generales" className="min-w-0 flex-1 bg-transparent px-2 py-3 text-sm outline-none disabled:text-neutral-500" />
              </div>
              {draft.slug && !slugValid && <span className="text-xs font-normal text-red-600">Utilise des lettres minuscules, chiffres et tirets.</span>}
            </label>
            <div>
              <p className="mb-2 text-sm font-semibold text-neutral-700">Contenu</p>
              <RichEditor content={draft.content} onChange={(content) => setDraft((value) => ({ ...value, content }))} placeholder="Rédige le contenu de cette page…" />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/5 pt-4">
              <p className="text-xs text-neutral-400">Après publication, le lien apparaît dans la rubrique Légal du site.</p>
              <button type="button" onClick={save} disabled={!canSave} className="inline-flex items-center gap-2 rounded-2xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">
                <Save size={16} /> {saving ? "Publication…" : "Publier"}
              </button>
            </div>
          </div>
        ) : (
          !loading && <p className="rounded-2xl bg-neutral-50 p-6 text-sm text-neutral-500">Choisis une page ou crée-en une nouvelle.</p>
        )}
      </section>
    </div>
  );
}
