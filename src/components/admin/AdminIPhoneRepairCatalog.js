"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Eye, EyeOff, ImagePlus, LoaderCircle, Pencil, Plus, Search, Smartphone, Wrench, X } from "lucide-react";
import { reparationAdminApi, uploadApi } from "@/lib/api";
import { compareIPhoneGeneration } from "@/lib/iphoneProducts";
import { formatPrice } from "@/lib/format";

const inputClass = "w-full rounded-xl border border-black/10 bg-white px-3.5 py-3 text-sm outline-none focus:border-black/40";
const emptyModel = { id: null, familyId: "", name: "", image: "", active: true };
const emptyJob = { id: null, modelId: "", name: "", delay: "", optionId: "", price: "" };

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function PhoneImageField({ value, onChange, name }) {
  const input = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const choose = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Choisissez un fichier image.");
    if (file.size > 25 * 1024 * 1024) return setError("L’image doit faire moins de 25 Mo.");
    setUploading(true); setError("");
    try {
      const result = await uploadApi.upload(await fileToBase64(file), "mtechbenin/repairs/iphones");
      onChange(result.url);
    } catch (err) {
      setError(err.message || "Envoi de l’image impossible.");
    } finally {
      setUploading(false);
      if (input.current) input.current.value = "";
    }
  };
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-black/[.06] bg-neutral-50 p-3">
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={(event) => choose(event.target.files?.[0])} />
      {value ? <img src={value} alt={`Aperçu ${name || "de l’iPhone"}`} className="h-24 w-20 rounded-xl border border-black/10 bg-white object-contain p-1" /> : <div className="grid h-24 w-20 place-items-center rounded-xl border border-dashed border-black/15 bg-white text-neutral-400"><Smartphone size={27} /></div>}
      <div className="min-w-[190px] flex-1">
        <p className="text-sm font-semibold">{value ? "Photo du modèle ajoutée" : "Ajouter une photo du modèle"}</p>
        <p className="mt-1 text-xs text-neutral-500">La photo apparaîtra sur le choix du modèle dans la réparation.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" disabled={uploading} onClick={() => input.current?.click()} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-neutral-950 px-3 text-xs font-semibold text-white disabled:opacity-50">
            {uploading ? <LoaderCircle size={14} className="animate-spin" /> : <ImagePlus size={14} />}{value ? "Changer la photo" : "Importer une photo"}
          </button>
          {value && <button type="button" onClick={() => onChange("")} className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-black/10 bg-white px-3 text-xs font-semibold text-neutral-600"><X size={14} /> Retirer</button>}
        </div>
        {error && <p role="alert" className="mt-2 text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}

export default function AdminIPhoneRepairCatalog() {
  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [modelForm, setModelForm] = useState(emptyModel);
  const [modelModal, setModelModal] = useState(false);
  const [jobForm, setJobForm] = useState(emptyJob);
  const [jobModal, setJobModal] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const data = await reparationAdminApi.catalogue("APPLE");
      setFamilies(data.familles || []);
    } catch (err) {
      setError(err.message || "Impossible de charger le catalogue iPhone.");
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const models = useMemo(() => families.flatMap((family) => (family.models || [])
    .filter((model) => /iphone/i.test(model.name))
    .map((model) => ({ ...model, family })))
    .sort(compareIPhoneGeneration), [families]);
  const visibleModels = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("fr");
    return term ? models.filter((model) => model.name.toLocaleLowerCase("fr").includes(term)) : models;
  }, [models, query]);

  const beginAddModel = () => {
    const preferredFamily = families.find((family) => /iphone/i.test(family.name)) || families[0];
    setModelForm({ ...emptyModel, familyId: preferredFamily?.id || "" });
    setError(""); setSuccess(""); setModelModal(true);
  };
  const beginEditModel = (model) => {
    setModelForm({ id: model.id, familyId: model.familyId, name: model.name || "", image: model.image || "", active: model.active !== false });
    setError(""); setSuccess(""); setModelModal(true);
  };
  const saveModel = async (event) => {
    event.preventDefault();
    if (!modelForm.name.trim()) return setError("Saisissez le nom du modèle.");
    setSaving(true); setError(""); setSuccess("");
    try {
      let familyId = modelForm.familyId;
      if (!familyId) {
        const familyResult = await reparationAdminApi.creerFamille({ space: "APPLE", name: "iPhone" });
        familyId = familyResult.famille.id;
      }
      if (modelForm.id) await reparationAdminApi.modifierModele(modelForm.id, { name: modelForm.name.trim(), image: modelForm.image.trim() });
      else await reparationAdminApi.creerModele({ familyId, name: modelForm.name.trim(), image: modelForm.image.trim(), sortOrder: 0 });
      setModelModal(false); setSuccess("Modèle et photo enregistrés."); await load();
    } catch (err) { setError(err.message || "Enregistrement du modèle impossible."); }
    finally { setSaving(false); }
  };

  const toggleModel = async (model) => {
    setError(""); setSuccess("");
    try { await reparationAdminApi.modifierModele(model.id, { active: !model.active }); setSuccess(`${model.name} ${model.active ? "désactivé" : "activé"}.`); await load(); }
    catch (err) { setError(err.message || "Impossible de modifier le modèle."); }
  };
  const beginAddJob = (model) => { setJobForm({ ...emptyJob, modelId: model.id }); setError(""); setJobModal(true); };
  const beginEditJob = (model, job) => {
    const option = (job.options || [])[0];
    setJobForm({ id: job.id, modelId: model.id, name: job.name || "", delay: job.delay || "", optionId: option?.id || "", price: String(option?.price ?? "") });
    setError(""); setJobModal(true);
  };
  const saveJob = async (event) => {
    event.preventDefault();
    if (!jobForm.name.trim()) return setError("Saisissez le type de réparation.");
    if (!/^\d+$/.test(String(jobForm.price)) || Number(jobForm.price) < 0) return setError("Saisissez un prix valide en FCFA.");
    setSaving(true); setError("");
    try {
      if (jobForm.id) {
        await reparationAdminApi.modifierReparation(jobForm.id, { name: jobForm.name.trim(), delay: jobForm.delay.trim() || null });
        if (jobForm.optionId) await reparationAdminApi.modifierOption(jobForm.optionId, { price: Number(jobForm.price) });
        else await reparationAdminApi.creerOption({ jobId: jobForm.id, label: "Standard", price: Number(jobForm.price) });
      } else {
        await reparationAdminApi.creerReparation({ modelId: jobForm.modelId, name: jobForm.name.trim(), delay: jobForm.delay.trim() || undefined, price: Number(jobForm.price) });
      }
      setJobModal(false); setSuccess("Réparation et tarif enregistrés."); await load();
    } catch (err) { setError(err.message || "Enregistrement de la réparation impossible."); }
    finally { setSaving(false); }
  };
  const toggleJob = async (job) => {
    setError("");
    try { await reparationAdminApi.modifierReparation(job.id, { active: !job.active }); await load(); }
    catch (err) { setError(err.message || "Impossible de modifier la réparation."); }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-neutral-500">Atelier · Apple</p><h2 className="text-3xl font-black tracking-tight text-neutral-950">Réparations iPhone</h2><p className="mt-2 max-w-2xl text-sm text-neutral-600">Ajoutez les modèles, leurs photos et les tarifs des prestations. Les tarifs enregistrés sont proposés dans la boutique.</p></div>
        <button type="button" onClick={beginAddModel} className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-neutral-950 px-5 text-sm font-bold text-white hover:bg-neutral-800"><Plus size={18} /> Ajouter un iPhone</button>
      </header>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-black/[.06] bg-white p-3 shadow-sm">
        <label className="flex min-h-11 min-w-[220px] flex-1 items-center gap-2 rounded-xl bg-neutral-50 px-3"><Search size={17} className="text-neutral-400"/><input className="w-full bg-transparent text-sm outline-none" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un modèle iPhone" aria-label="Rechercher un modèle iPhone"/></label>
        <span className="px-2 text-sm text-neutral-500">{models.length} modèle{models.length === 1 ? "" : "s"}</span>
      </div>
      {error && !modelModal && !jobModal && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {success && !modelModal && !jobModal && <p role="status" className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800"><Check size={16} className="mr-2 inline"/>{success}</p>}

      {loading ? <p className="py-10 text-center text-sm text-neutral-500">Chargement du catalogue…</p> : visibleModels.length === 0 ? <div className="rounded-3xl border border-dashed border-black/10 bg-white p-10 text-center"><Smartphone size={30} className="mx-auto mb-3 text-neutral-400"/><p className="font-semibold">Aucun modèle iPhone dans le catalogue de réparation.</p><p className="mt-1 text-sm text-neutral-500">Ajoutez un modèle pour commencer à saisir ses tarifs.</p></div> : (
        <div className="grid gap-4 lg:grid-cols-2">
          {visibleModels.map((model) => {
            const image = model.image || "";
            return <article key={model.id} className={`overflow-hidden rounded-3xl border border-black/[.06] bg-white shadow-sm ${model.active === false ? "opacity-65" : ""}`}>
              <div className="flex gap-4 p-4 sm:p-5">
                <div className="grid h-28 w-24 flex-shrink-0 place-items-center overflow-hidden rounded-2xl bg-neutral-50">{image ? <img src={image} alt={model.name} className="h-full w-full object-contain p-2"/> : <Smartphone size={30} className="text-neutral-300"/>}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">{model.family?.name || "iPhone"}</p><h3 className="mt-1 text-lg font-extrabold text-neutral-950">{model.name}</h3><p className={`mt-1 text-xs font-semibold ${model.active === false ? "text-neutral-400" : "text-green-700"}`}>{model.active === false ? "Désactivé" : "Actif"}</p></div><div className="flex gap-1"><button type="button" title="Modifier le nom et la photo" onClick={() => beginEditModel(model)} className="rounded-xl p-2 text-neutral-500 hover:bg-neutral-100 hover:text-black"><Pencil size={17}/></button><button type="button" title={model.active === false ? "Activer" : "Désactiver"} onClick={() => toggleModel(model)} className="rounded-xl p-2 text-neutral-500 hover:bg-neutral-100 hover:text-black">{model.active === false ? <Eye size={17}/> : <EyeOff size={17}/>}</button></div></div>
                  <div className="mt-3 space-y-2 border-t border-black/[.06] pt-3">
                    <div className="flex items-center justify-between gap-2"><p className="text-xs font-bold uppercase tracking-wider text-neutral-500">Réparations et tarifs</p><button type="button" onClick={() => beginAddJob(model)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold hover:bg-neutral-100"><Plus size={14}/> Ajouter</button></div>
                    {(model.jobs || []).length === 0 ? <p className="text-xs text-neutral-400">Aucun tarif enregistré.</p> : (model.jobs || []).map((job) => <div key={job.id} className={`flex items-start gap-2 rounded-xl bg-neutral-50 px-3 py-2 ${job.active === false ? "opacity-50" : ""}`}><Wrench size={14} className="mt-0.5 flex-shrink-0 text-neutral-500"/><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{job.name}</p><div className="flex flex-wrap gap-x-2 text-xs text-neutral-500">{(job.options || []).map((option) => <span key={option.id}>{(job.options || []).length > 1 ? `${option.label} · ` : ""}{formatPrice(option.price)}</span>)}{!job.options?.length && <span>Tarif à saisir</span>}</div></div><button type="button" title="Modifier le type ou le tarif" onClick={() => beginEditJob(model, job)} className="rounded-lg p-1.5 text-neutral-500 hover:bg-white"><Pencil size={14}/></button><button type="button" title={job.active === false ? "Activer" : "Désactiver"} onClick={() => toggleJob(job)} className="rounded-lg p-1.5 text-neutral-500 hover:bg-white">{job.active === false ? <Eye size={14}/> : <EyeOff size={14}/>}</button></div>)}
                  </div>
                </div>
              </div>
            </article>;
          })}
        </div>
      )}

      {(modelModal || jobModal) && <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) { setModelModal(false); setJobModal(false); } }}>
        {modelModal ? <form onSubmit={saveModel} className="max-h-[92vh] w-full max-w-xl space-y-4 overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-7">
          <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-neutral-400">Catalogue réparation</p><h3 className="mt-1 text-xl font-black">{modelForm.id ? "Modifier le modèle iPhone" : "Ajouter un modèle iPhone"}</h3></div><button type="button" onClick={() => setModelModal(false)} className="rounded-xl p-2 hover:bg-neutral-100"><X size={19}/></button></div>
          <label className="block space-y-1.5 text-sm font-semibold">Nom du modèle<input className={inputClass} placeholder="iPhone 18 Pro Max" value={modelForm.name} onChange={(event) => setModelForm((form) => ({ ...form, name: event.target.value }))}/></label>
          {!modelForm.id && families.length > 1 && <label className="block space-y-1.5 text-sm font-semibold">Famille<select className={inputClass} value={modelForm.familyId} onChange={(event) => setModelForm((form) => ({ ...form, familyId: event.target.value }))}>{families.map((family) => <option key={family.id} value={family.id}>{family.name}</option>)}</select></label>}
          <PhoneImageField name={modelForm.name} value={modelForm.image} onChange={(image) => setModelForm((form) => ({ ...form, image }))}/>
          <label className="block space-y-1.5 text-xs font-medium text-neutral-500">Ou collez une adresse d’image<input className={inputClass} type="url" placeholder="https://…" value={modelForm.image} onChange={(event) => setModelForm((form) => ({ ...form, image: event.target.value }))}/></label>
          {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button disabled={saving} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 text-sm font-bold text-white disabled:opacity-50">{saving ? <LoaderCircle size={17} className="animate-spin"/> : <Check size={17}/>} {saving ? "Enregistrement…" : "Enregistrer le modèle"}</button>
        </form> : <form onSubmit={saveJob} className="w-full max-w-lg space-y-4 rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-7">
          <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-neutral-400">Modèle iPhone</p><h3 className="mt-1 text-xl font-black">{jobForm.id ? "Modifier le tarif" : "Ajouter une réparation"}</h3></div><button type="button" onClick={() => setJobModal(false)} className="rounded-xl p-2 hover:bg-neutral-100"><X size={19}/></button></div>
          <label className="block space-y-1.5 text-sm font-semibold">Type de réparation<input className={inputClass} placeholder="Écran, batterie, connecteur…" value={jobForm.name} onChange={(event) => setJobForm((form) => ({ ...form, name: event.target.value }))}/></label>
          <label className="block space-y-1.5 text-sm font-semibold">Prix (FCFA)<input className={inputClass} type="number" min="0" step="1" placeholder="25000" value={jobForm.price} onChange={(event) => setJobForm((form) => ({ ...form, price: event.target.value }))}/></label>
          <label className="block space-y-1.5 text-sm font-semibold">Délai indicatif (facultatif)<input className={inputClass} placeholder="24 h" value={jobForm.delay} onChange={(event) => setJobForm((form) => ({ ...form, delay: event.target.value }))}/></label>
          {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button disabled={saving} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 text-sm font-bold text-white disabled:opacity-50">{saving ? <LoaderCircle size={17} className="animate-spin"/> : <Check size={17}/>} {saving ? "Enregistrement…" : "Enregistrer le tarif"}</button>
        </form>}
      </div>}
    </div>
  );
}
