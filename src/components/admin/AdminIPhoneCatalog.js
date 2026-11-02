"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Check, CirclePlus, ImagePlus, LoaderCircle, Pencil, Plus, Smartphone, Trash2, X } from "lucide-react";
import { productsApi, uploadApi, variantsApi } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { compareIPhoneGeneration, isIPhoneProduct } from "@/lib/iphoneProducts";

const emptyForm = {
  id: null,
  name: "",
  slug: "",
  image: "",
  stock: "1",
  active: true,
  storages: [{ value: "", supplement: "" }],
  states: [{ value: "Scellé", price: "" }, { value: "Venu", price: "" }],
  colors: [{ value: "", delta: "0", imageUrl: "" }],
};
const fieldClass = "w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-black/40";
const COLOR_IMAGES_SPEC = "__mtech_variant_color_images";
const IPHONE_PRICING_SPEC = "__mtech_iphone_pricing";
const isIPhone = isIPhoneProduct;
const slugify = (value) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function variantByName(types, name) {
  return types.find((type) => type.name.trim().toLowerCase() === name.toLowerCase());
}

function parseColorImages(raw) {
  let specs = raw;
  if (typeof specs === "string") {
    try { specs = JSON.parse(specs); } catch { return []; }
  }
  if (!Array.isArray(specs)) return [];
  const metadata = specs.find((spec) => spec.label === COLOR_IMAGES_SPEC || spec.label === "__mtech_iphone_color_images");
  if (!metadata?.value) return [];
  try {
    const images = JSON.parse(metadata.value);
    return Array.isArray(images) ? images : [];
  } catch { return []; }
}

function parseIPhonePricing(raw) {
  let specs = raw;
  if (typeof specs === "string") {
    try { specs = JSON.parse(specs); } catch { return {}; }
  }
  const metadata = Array.isArray(specs) ? specs.find((spec) => spec.label === IPHONE_PRICING_SPEC) : null;
  if (!metadata?.value) return {};
  try { return JSON.parse(metadata.value) || {}; } catch { return {}; }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function ColorImageInput({ value, onChange, color }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const upload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Choisissez un fichier image.");
    if (file.size > 25 * 1024 * 1024) return setError("L’image doit faire moins de 25 Mo.");
    setUploading(true);
    setError("");
    try {
      const result = await uploadApi.upload(await fileToBase64(file), "mtechbenin/products/iphone-colors");
      onChange(result.url);
    } catch (err) {
      setError(err.message || "Envoi de l’image impossible.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(event) => upload(event.target.files?.[0])} />
      {value && <img src={value} alt={`Couleur ${color || ""}`} className="h-12 w-12 rounded-lg border border-black/10 bg-white object-contain p-0.5" />}
      <button type="button" disabled={uploading} onClick={() => inputRef.current?.click()} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3 text-xs font-semibold hover:bg-neutral-100 disabled:opacity-50">
        {uploading ? <LoaderCircle size={14} className="animate-spin" /> : <ImagePlus size={14} />}{value ? "Changer l’image" : "Ajouter l’image"}
      </button>
      {value && <button type="button" aria-label={`Retirer l’image de ${color}`} onClick={() => onChange("")} className="rounded-lg p-2 text-neutral-400 hover:bg-red-50 hover:text-red-600"><X size={15} /></button>}
      {error && <span role="alert" className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

function PhoneImageInput({ value, onChange, name }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const upload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Choisissez un fichier image.");
    if (file.size > 25 * 1024 * 1024) return setError("L’image doit faire moins de 25 Mo.");
    setUploading(true);
    setError("");
    try {
      const result = await uploadApi.upload(await fileToBase64(file), "mtechbenin/products/iphones");
      onChange(result.url);
    } catch (err) {
      setError(err.message || "Envoi de l’image impossible.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-black/[.06] bg-neutral-50 p-3">
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(event) => upload(event.target.files?.[0])} />
      {value ? (
        <img src={value} alt={`Aperçu ${name || "du téléphone"}`} className="h-20 w-20 rounded-xl border border-black/10 bg-white object-contain p-1" />
      ) : (
        <div className="grid h-20 w-20 place-items-center rounded-xl border border-dashed border-black/15 bg-white text-neutral-400"><Smartphone size={24} /></div>
      )}
      <div className="min-w-[180px] flex-1">
        <p className="text-sm font-semibold">{value ? "Image prête pour la boutique" : "Aucune image ajoutée"}</p>
        <p className="mt-1 text-xs text-neutral-500">Choisissez une photo nette du modèle (JPG, PNG ou WebP).</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" disabled={uploading} onClick={() => inputRef.current?.click()} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-neutral-950 px-3 text-xs font-semibold text-white hover:bg-neutral-800 disabled:opacity-50">
            {uploading ? <LoaderCircle size={14} className="animate-spin" /> : <ImagePlus size={14} />}{value ? "Changer l’image" : "Importer une image"}
          </button>
          {value && <button type="button" onClick={() => onChange("")} className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-black/10 bg-white px-3 text-xs font-semibold text-neutral-600 hover:bg-neutral-100"><X size={14} /> Retirer</button>}
        </div>
        {error && <p role="alert" className="mt-2 text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}

export default function AdminIPhoneCatalog() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { products: list = [] } = await productsApi.getAll({ limit: 500, includeInactive: true });
      setProducts(list.filter(isIPhone).sort(compareIPhoneGeneration));
    } catch (err) {
      setError(err.status !== undefined ? err.message : "Connexion au serveur impossible.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const reset = () => { setForm(emptyForm); setError(""); setSuccess(""); };

  const edit = async (product) => {
    setError(""); setSuccess("");
    try {
      const { variantTypes = [] } = await variantsApi.getAll(product.id);
      const storage = variantByName(variantTypes, "Stockage");
      const color = variantByName(variantTypes, "Couleur");
      const phoneState = variantTypes.find((type) => /^(état|etat|condition)$/i.test(type.name.trim()));
      const pricingMetadata = parseIPhonePricing(product.specs);
      const storageOffset = storage?.options?.length
        ? Number(pricingMetadata.minStorageSupplement ?? Math.min(...storage.options.map((option) => Number(option.priceDelta || 0))))
        : 0;
      const colorImages = parseColorImages(product.specs);
      setForm({
        id: product.id,
        name: product.name || "",
        slug: product.slug || "",
        image: product.image || (Array.isArray(product.images) ? product.images[0] : "") || "",
        stock: String(product.stock ?? 0),
        active: product.active !== false,
        storages: storage?.options?.length
          ? storage.options.map((option) => ({ value: option.value, supplement: String(Number(option.priceDelta || 0) + storageOffset) }))
          : [{ value: "", supplement: "0" }],
        states: phoneState?.options?.length
          ? phoneState.options.map((option) => ({ value: option.value, price: String(Number(product.price || 0) - storageOffset + Number(option.priceDelta || 0)) }))
          : [{ value: "Scellé", price: String(Number(product.price || 0) - storageOffset) }, { value: "Venu", price: String(Number(product.price || 0) - storageOffset) }],
        colors: color?.options?.length
          ? color.options.map((option) => ({ value: option.value, delta: String(option.priceDelta || 0), imageUrl: colorImages.find((item) => (item.value || item.color) === option.value)?.imageUrl || "" }))
          : [{ value: "", delta: "0", imageUrl: "" }],
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err.status !== undefined ? err.message : "Impossible de charger les options de ce modèle.");
    }
  };

  const updateRow = (key, index, field, value) => setForm((current) => ({
    ...current,
    [key]: current[key].map((row, rowIndex) => rowIndex === index ? { ...row, [field]: value } : row),
  }));
  const addRow = (key, row) => setForm((current) => ({ ...current, [key]: [...current[key], row] }));
  const removeRow = (key, index) => setForm((current) => ({ ...current, [key]: current[key].filter((_, rowIndex) => rowIndex !== index) }));

  const syncType = async (productId, currentTypes, typeName, rows, getDelta) => {
    let type = variantByName(currentTypes, typeName);
    if (!rows.length && !type) return;
    if (!type) {
      const result = await variantsApi.createType(productId, { name: typeName, required: true, sortOrder: currentTypes.length });
      type = result.variantType;
      currentTypes.push(type);
    } else if (!type.required) {
      const result = await variantsApi.updateType(productId, type.id, { required: true });
      type = result.variantType;
    }
    const currentOptions = [...(type.options || [])];
    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      const value = row.value.trim();
      if (!value) continue;
      const priceDelta = getDelta(row);
      const existing = currentOptions.find((option) => option.value.trim().toLowerCase() === value.toLowerCase());
      if (existing) {
        if (Number(existing.priceDelta || 0) !== priceDelta || existing.sortOrder !== index) {
          await variantsApi.updateOption(productId, existing.id, { priceDelta, sortOrder: index });
        }
        currentOptions.splice(currentOptions.indexOf(existing), 1);
      } else {
        await variantsApi.createOption(productId, type.id, { value, priceDelta, sortOrder: index });
      }
    }
    for (const removedOption of currentOptions) await variantsApi.deleteOption(productId, removedOption.id);
  };

  const save = async (event) => {
    event.preventDefault();
    setError(""); setSuccess("");
    const cleanStorages = form.storages.filter((row) => row.value.trim());
    const cleanStates = form.states.filter((row) => row.value.trim());
    const cleanColors = form.colors.filter((row) => row.value.trim());
    if (!form.name.trim() || !isIPhone({ name: form.name })) return setError("Saisissez le nom complet du modèle, par exemple iPhone 17 Pro.");
    if (!form.image.trim()) return setError("Ajoutez l’adresse de l’image du téléphone.");
    if (!cleanStorages.length || cleanStorages.some((row) => !/^\d+$/.test(row.supplement) || Number(row.supplement) < 0)) return setError("Ajoutez au moins un stockage avec son complément de prix en FCFA (0 ou plus).");
    if (cleanStates.length < 2 || cleanStates.some((row) => !/^\d+$/.test(row.price) || Number(row.price) <= 0)) return setError("Ajoutez les prix de base pour les deux états du téléphone.");
    if (cleanColors.some((row) => !/^-?\d+$/.test(row.delta.trim()))) return setError("Le supplément de couleur doit être un nombre entier en FCFA (0 si le prix ne change pas).");
    if (!/^\d+$/.test(String(form.stock)) || Number(form.stock) < 0) return setError("Le stock doit être un nombre entier positif ou nul.");

    setSaving(true);
    let savedProduct = null;
    try {
      const minStatePrice = Math.min(...cleanStates.map((row) => Number(row.price)));
      const minStorageSupplement = Math.min(...cleanStorages.map((row) => Number(row.supplement)));
      const basePrice = minStatePrice + minStorageSupplement;
      const slug = (form.slug.trim() || slugify(form.name)).toLowerCase();
      const colorImages = cleanColors
        .filter((row) => row.imageUrl)
    .map((row) => ({ typeName: "Couleur", value: row.value.trim(), imageUrl: row.imageUrl }));
      const payload = {
        name: form.name.trim(), slug, categorySlug: "smartphone-tablette", price: basePrice,
        stock: Number(form.stock), status: Number(form.stock) > 0 ? "En stock" : "Rupture",
        description: `Achetez ${form.name.trim()} chez MTECHBENIN. Choisissez l’état et le stockage.`,
        active: form.active, featured: false, images: JSON.stringify([form.image.trim()]), videoUrl: null,
        specs: [
          { label: COLOR_IMAGES_SPEC, value: JSON.stringify(colorImages) },
          { label: IPHONE_PRICING_SPEC, value: JSON.stringify({ minStorageSupplement }) },
        ],
      };
      if (form.id) {
        const result = await productsApi.update(form.id, payload);
        savedProduct = result.product || result;
      } else {
        const result = await productsApi.create(payload);
        savedProduct = result.product || result;
      }
      const productId = savedProduct.id || form.id;
      const { variantTypes = [] } = await variantsApi.getAll(productId);
      await syncType(productId, variantTypes, "Stockage", cleanStorages, (row) => Number(row.supplement) - minStorageSupplement);
      await syncType(productId, variantTypes, "État", cleanStates, (row) => Number(row.price) - minStatePrice);
      await syncType(productId, variantTypes, "Couleur", cleanColors, (row) => Number(row.delta));
      setSuccess("Modèle enregistré. Les options sont disponibles sur la boutique.");
      setForm(emptyForm);
      await load();
    } catch (err) {
      setError(err.status !== undefined ? err.message : savedProduct
        ? "Le produit est enregistré, mais les options n’ont pas toutes été enregistrées. Ouvrez le modèle et réessayez."
        : "Connexion au serveur impossible — le modèle n’a pas été enregistré.");
      if (savedProduct) await load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-neutral-500">Boutique · Smartphones</p>
        <h1 className="text-3xl font-black tracking-tight text-neutral-950">Catalogue iPhone</h1>
        <p className="mt-2 max-w-2xl text-sm text-neutral-600">Gérez les modèles, les images, les stockages et le choix entre téléphone scellé ou venu, avec un ajustement de prix pour chaque état.</p>
      </header>

      <form onSubmit={save} className="space-y-5 rounded-3xl border border-black/[.06] bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">{form.id ? `Modifier ${form.name}` : "Ajouter un iPhone"}</h2>
          {form.id && <button type="button" onClick={reset} className="text-sm font-semibold text-neutral-500 hover:text-black">Annuler</button>}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1.5 text-sm font-semibold">Nom du modèle
            <input className={fieldClass} placeholder="iPhone 17 Pro" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: form.id ? form.slug : slugify(e.target.value) })} />
          </label>
          <div className="space-y-2 md:col-span-2">
            <p className="text-sm font-semibold">Image principale du téléphone</p>
            <PhoneImageInput name={form.name} value={form.image} onChange={(image) => setForm((current) => ({ ...current, image }))} />
            <label className="block space-y-1.5 text-xs font-medium text-neutral-500">Ou collez une adresse d’image
              <input className={fieldClass} type="url" placeholder="https://…" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
            </label>
          </div>
          <label className="space-y-1.5 text-sm font-semibold">Stock total
            <input className={fieldClass} type="number" min="0" step="1" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
          </label>
          <label className="flex items-center gap-3 self-end pb-2 text-sm font-semibold">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-4 w-4 accent-black" /> Publier dans la boutique
          </label>
        </div>

        <section className="rounded-2xl bg-neutral-50 p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-3"><div><h3 className="font-bold">État du téléphone</h3><p className="text-xs text-neutral-500">Définissez le prix de base pour chaque état. Le complément du stockage sera ajouté ensuite.</p></div><button type="button" onClick={() => addRow("states", { value: "", price: "" })} className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-bold"><Plus size={14} /> État</button></div>
          <div className="space-y-2">
            {form.states.map((row, index) => <div key={`state-${index}`} className="grid grid-cols-[1fr_1fr_auto] gap-2"><input className={fieldClass} aria-label="État du téléphone" placeholder={index === 0 ? "Scellé" : "Venu"} value={row.value} onChange={(e) => updateRow("states", index, "value", e.target.value)} /><input className={fieldClass} aria-label="Prix de base de cet état en FCFA" type="number" min="1" step="1" placeholder="Prix de base FCFA" value={row.price} onChange={(e) => updateRow("states", index, "price", e.target.value)} /><button type="button" aria-label="Supprimer cet état" onClick={() => removeRow("states", index)} className="rounded-xl px-2 text-neutral-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={17} /></button></div>)}
          </div>
        </section>

        <section className="rounded-2xl bg-neutral-50 p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-3"><div><h3 className="font-bold">Compléments de stockage</h3><p className="text-xs text-neutral-500">Ce montant s’ajoute au prix de base de l’état choisi.</p></div><button type="button" onClick={() => addRow("storages", { value: "", supplement: "0" })} className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-bold"><Plus size={14} /> Capacité</button></div>
          <div className="space-y-2">
            {form.storages.map((row, index) => <div key={`storage-${index}`} className="grid grid-cols-[1fr_1fr_auto] gap-2"><input className={fieldClass} aria-label="Capacité" placeholder="128 Go" value={row.value} onChange={(e) => updateRow("storages", index, "value", e.target.value)} /><input className={fieldClass} aria-label="Complément de stockage en FCFA" type="number" min="0" step="1" placeholder="Complément FCFA" value={row.supplement} onChange={(e) => updateRow("storages", index, "supplement", e.target.value)} /><button type="button" aria-label="Supprimer cette capacité" onClick={() => removeRow("storages", index)} className="rounded-xl px-2 text-neutral-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={17} /></button></div>)}
          </div>
        </section>

        <section className="rounded-2xl bg-neutral-50 p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-3"><div><h3 className="font-bold">Couleurs (facultatif)</h3><p className="text-xs text-neutral-500">Ajoutez un supplément en FCFA si une couleur coûte plus cher, sinon laissez 0. Vous pouvez aussi ajouter une photo à chaque couleur.</p></div><button type="button" onClick={() => addRow("colors", { value: "", delta: "0", imageUrl: "" })} className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-bold"><Plus size={14} /> Couleur</button></div>
          <div className="space-y-2">
            {form.colors.map((row, index) => <div key={`color-${index}`} className="space-y-2 rounded-xl border border-black/[.06] bg-white p-3"><div className="grid grid-cols-[1fr_1fr_auto] gap-2"><input className={fieldClass} aria-label="Couleur" placeholder="Titane naturel" value={row.value} onChange={(e) => updateRow("colors", index, "value", e.target.value)} /><input className={fieldClass} aria-label="Supplément de prix couleur en FCFA" type="number" step="1" placeholder="Supplément FCFA" value={row.delta} onChange={(e) => updateRow("colors", index, "delta", e.target.value)} /><button type="button" aria-label="Supprimer cette couleur" onClick={() => removeRow("colors", index)} className="rounded-xl px-2 text-neutral-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={17} /></button></div><ColorImageInput color={row.value} value={row.imageUrl} onChange={(imageUrl) => updateRow("colors", index, "imageUrl", imageUrl)} /></div>)}
          </div>
        </section>

        {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {success && <p role="status" className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800"><Check className="mr-2 inline h-4 w-4" />{success}</p>}
        <button disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-black px-5 py-3.5 text-sm font-bold text-white transition hover:bg-neutral-800 disabled:opacity-60 sm:w-auto">
          {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Check size={17} />}{saving ? "Enregistrement…" : "Enregistrer le modèle"}
        </button>
      </form>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">Modèles iPhone ({products.length})</h2>
        {loading ? <p className="text-sm text-neutral-500">Chargement…</p> : products.length === 0 ? <div className="rounded-2xl bg-neutral-50 p-8 text-center text-sm text-neutral-500"><Smartphone className="mx-auto mb-2 h-6 w-6" />Aucun modèle iPhone enregistré.</div> : (
          <div className="grid gap-3 md:grid-cols-2">
            {products.map((product) => {
              const image = product.image || (Array.isArray(product.images) ? product.images[0] : "");
              return <article key={product.id} className="flex items-center gap-4 rounded-2xl border border-black/[.06] bg-white p-3 shadow-sm">
                <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-neutral-50">{image && <Image src={image} alt="" fill unoptimized className="object-contain p-1" sizes="80px" />}</div>
                <div className="min-w-0 flex-1"><h3 className="truncate font-bold">{product.name}</h3><p className="text-sm text-neutral-600">Dès {formatPrice(product.price)} · Stock {product.stock ?? 0}</p><p className={`mt-1 text-xs font-semibold ${product.active === false ? "text-neutral-400" : "text-green-700"}`}>{product.active === false ? "Non publié" : "Publié"}</p></div>
                <button type="button" onClick={() => edit(product)} className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 px-3 py-2 text-xs font-bold hover:bg-neutral-50"><Pencil size={14} /> Modifier</button>
              </article>;
            })}
          </div>
        )}
        {error && !form.id && <button type="button" onClick={load} className="inline-flex items-center gap-1 text-sm font-semibold"><CirclePlus size={15} /> Recharger la liste</button>}
      </section>
    </div>
  );
}
