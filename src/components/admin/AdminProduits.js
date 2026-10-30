"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  X,
  Check,
  ChevronDown,
  AlertCircle,
  RefreshCw,
  ImagePlus,
  LoaderCircle,
} from "lucide-react";
import { formatPrice } from "@/lib/format";
import { productsApi, categoriesApi, variantsApi, characteristicsApi, uploadApi } from "@/lib/api";
import MediaUploader from "@/components/admin/MediaUploader";

const statusOptions = ["En stock", "Stock limité", "Rupture"];

// Deux emplacements de média libres — chacun peut être une image OU une
// vidéo (type auto-détecté par MediaUploader), à la place des anciens champs
// fixes "image" + "videoUrl". Au moment de la sauvegarde, les emplacements de
// type "image" alimentent le tableau `images[]` et le premier emplacement de
// type "video" alimente `videoUrl` — le schéma backend ne change pas.
const emptyMediaSlots = [
  { type: "image", url: "" },
  { type: "image", url: "" },
];

const emptyForm = {
  name: "",
  slug: "",
  category: "ecouteurs",
  price: "",
  comparePrice: "",
  stock: "",
  status: "En stock",
  description: "",
  active: true,
  featured: false,
  media: emptyMediaSlots,
  specs: [],
};

const inputClass =
  "w-full bg-black/[0.03] text-apple-black text-[14px] placeholder-apple-mid/50 rounded-2xl px-4 py-3 border border-black/[0.07] focus:outline-none focus:border-black/20 transition";

function generateSlug(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function getFirstImage(product) {
  if (!product) return null;
  if (product.image) return product.image;
  try {
    const imgs =
      typeof product.images === "string"
        ? JSON.parse(product.images)
        : product.images;
    if (Array.isArray(imgs) && imgs.length > 0) return imgs[0];
  } catch {}
  return null;
}

function getAllImages(product) {
  if (!product) return [];
  try {
    const imgs =
      typeof product.images === "string"
        ? JSON.parse(product.images)
        : product.images;
    if (Array.isArray(imgs)) return imgs.filter(Boolean);
  } catch {}
  return product.image ? [product.image] : [];
}

// Reconstruit les 2 emplacements de média à partir des données existantes du
// produit (images[] + videoUrl) pour préremplir le formulaire d'édition.
function buildMediaSlots(product) {
  const images = getAllImages(product);
  const slots = [];
  if (images[0]) slots.push({ type: "image", url: images[0] });
  if (product?.videoUrl) {
    slots.push({ type: "video", url: product.videoUrl });
  } else if (images[1]) {
    slots.push({ type: "image", url: images[1] });
  }
  while (slots.length < 2) slots.push({ type: "image", url: "" });
  return slots.slice(0, 2);
}

function parseSpecs(raw) {
  if (!raw) return [];
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(parsed)
      ? parsed.filter((spec) => !spec.label?.startsWith("__mtech_"))
      : [];
  } catch {
    return [];
  }
}

function getInternalSpecs(raw) {
  if (!raw) return [];
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(parsed)
      ? parsed.filter((spec) => spec.label?.startsWith("__mtech_"))
      : [];
  } catch {
    return [];
  }
}

function parseVariantColorImages(raw) {
  const metadata = getInternalSpecs(raw).find((spec) => spec.label === "__mtech_variant_color_images" || spec.label === "__mtech_iphone_color_images");
  if (!metadata?.value) return [];
  try {
    const images = JSON.parse(metadata.value);
    return Array.isArray(images) ? images : [];
  } catch { return []; }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function VariantColorImageField({ value, label, onChange }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Choisissez une image.");
    if (file.size > 25 * 1024 * 1024) return setError("Image limitée à 25 Mo.");
    setUploading(true);
    setError("");
    try {
      const result = await uploadApi.upload(await fileToBase64(file), "mtechbenin/products/variant-colors");
      await onChange(result.url);
    } catch (err) {
      setError(err.message || "Envoi de l’image impossible.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(event) => handleUpload(event.target.files?.[0])} />
      {value && <img src={value} alt={"Couleur " + label} className="h-9 w-9 rounded-lg border border-black/10 bg-white object-cover" />}
      <button type="button" disabled={uploading} onClick={() => inputRef.current?.click()} title={"Photo de la couleur " + label} className="flex h-9 items-center gap-1 rounded-lg border border-black/10 bg-white px-2 text-[11px] font-semibold hover:bg-neutral-100 disabled:opacity-50">
        {uploading ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}{value ? "Changer" : "Photo"}
      </button>
      {error && <span role="alert" className="max-w-32 text-[10px] text-red-600">{error}</span>}
    </div>
  );
}

// Analyse le texte saisi pour le supplément : entier signé strict.
// Un "+" explicite (ex: "+15000") est un entier parfaitement valide et doit
// être accepté ; seule sa présence est normalisée avant l'analyse, la valeur
// numérique obtenue est identique. Tout ce qui n'est pas un entier (décimal,
// texte, champ vide) est refusé avec un message expliquant pourquoi — ne
// jamais échouer silencieusement sur un champ qui détermine un prix de vente.
function parsePriceDelta(raw) {
  const trimmed = raw.trim();
  if (trimmed === "") {
    return { ok: false, error: "Le supplément doit être un nombre entier" };
  }
  const normalized = trimmed.startsWith("+") ? trimmed.slice(1) : trimmed;
  if (!/^-?\d+$/.test(normalized)) {
    return { ok: false, error: "Le supplément doit être un nombre entier" };
  }
  return { ok: true, value: parseInt(normalized, 10) };
}

// Champ éditable du supplément de prix d'une valeur de variante. Le
// supplément est la raison d'être de cette fonctionnalité : un 0 doit se
// distinguer visuellement d'une valeur renseignée pour qu'un coup d'œil
// suffise à repérer les options qui changent le prix — et un échec
// d'enregistrement doit être tout aussi visible : un supplément qui semble
// pris en compte mais ne l'est pas côté serveur revient à vendre l'option
// au mauvais prix sans que personne ne s'en rende compte.
function VariantOptionPriceInput({ productId, option, basePrice, onSaved }) {
  const [value, setValue] = useState(String(option.priceDelta ?? 0));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setValue(String(option.priceDelta ?? 0));
  }, [option.id, option.priceDelta]);

  const currentDelta = option.priceDelta ?? 0;
  const isZero = currentDelta === 0;
  const isNegative = currentDelta < 0;

  // Aperçu en direct pendant la saisie (avant le blur qui enregistre) : ce
  // champ est le seul endroit du panel où l'écart se traduit en prix de
  // vente réel. Sans lui, rien ne distingue « saisir l'écart » (120000) de
  // « saisir le prix final de la variante » (550000) — l'erreur multiplie
  // le prix de vente par un facteur énorme sans qu'aucun autre écran ne
  // l'expose (la liste des produits n'affiche que le prix de base).
  const draftDelta = parsePriceDelta(value);
  const previewDelta = draftDelta.ok ? draftDelta.value : currentDelta;
  const finalPrice = (Number(basePrice) || 0) + previewDelta;

  const handleBlur = async (e) => {
    const raw = e.target.value;
    const parsed = parsePriceDelta(raw);
    if (!parsed.ok) {
      setError(parsed.error);
      setValue(String(currentDelta));
      return;
    }
    if (parsed.value === currentDelta) {
      // Valeur inchangée : rien à enregistrer, mais on efface une éventuelle
      // erreur précédente puisque le champ affiche de nouveau une valeur valide.
      setError("");
      return;
    }
    setSaving(true);
    try {
      const { option: updated } = await variantsApi.updateOption(productId, option.id, {
        priceDelta: parsed.value,
      });
      onSaved(updated);
      setError("");
    } catch (err) {
      // Deux origines possibles :
      // - le backend a répondu (400/409...) : `err.status` est renseigné et
      //   `err.message` porte déjà un message en français (voir apiFetch) —
      //   on le relaie tel quel.
      // - la requête n'a même pas abouti (coupure réseau, serveur injoignable) :
      //   `fetch` rejette alors avec un message natif du navigateur en
      //   anglais ("Failed to fetch") — on le remplace par un message en
      //   français explicite.
      // Dans les deux cas, affiché durablement (pas de disparition
      // automatique) et le champ est signalé visuellement : un prix de
      // vente erroné mérite mieux qu'un message qu'on peut manquer.
      setError(
        err.status !== undefined
          ? err.message
          : "Connexion au serveur impossible — le supplément n'a pas été enregistré",
      );
      setValue(String(currentDelta));
    }
    setSaving(false);
  };

  return (
    <div className="flex flex-col items-end gap-1">
      {/* type="text" et non "number" : un <input type="number"> assainit sa
          valeur avant même que React ne la voie, et rejette silencieusement
          un "+" en tête (ex: "+15000") — un signe explicite pourtant valide.
          La validation (entier signé, décimales refusées...) est entièrement
          faite nous-mêmes dans parsePriceDelta. */}
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        disabled={saving}
        placeholder="ex: 15000"
        aria-label="Supplément (F CFA) — écart par rapport au prix de base, pas le prix final"
        aria-invalid={!!error}
        className={`w-24 rounded-xl px-2.5 py-1.5 text-[12px] text-right border focus:outline-none transition disabled:opacity-50 ${
          error
            ? "bg-red-50 border-red-300 text-red-600 font-semibold focus:border-red-400"
            : isZero
              ? "bg-black/[0.03] border-black/[0.07] text-apple-mid/50 focus:border-black/20"
              : isNegative
                ? "bg-amber-50 border-amber-200 text-amber-600 font-semibold focus:border-black/20"
                : "bg-emerald-50 border-emerald-200 text-emerald-600 font-semibold focus:border-black/20"
        }`}
      />
      {error ? (
        <p className="text-[11px] text-red-600 font-medium text-right leading-tight max-w-[7rem]">
          {error}
        </p>
      ) : (
        <p className="text-[11px] text-apple-mid/70 text-right leading-tight max-w-[7rem]">
          Prix final : <span className="font-semibold text-apple-mid">{formatPrice(finalPrice)}</span>
        </p>
      )}
    </div>
  );
}

export default function AdminProduits({ smartphoneOnly = false }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState(smartphoneOnly ? "smartphone-tablette" : "tous");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newSpec, setNewSpec] = useState({ label: "", value: "" });
  const [variantTypes, setVariantTypes] = useState([]);
  const [newTypeName, setNewTypeName] = useState("");
  const [newOptionValue, setNewOptionValue] = useState({}); // { [typeId]: string }
  const [variantLoading, setVariantLoading] = useState(false);
  // Bibliothèque partagée de caractéristiques (chargée une fois, réutilisée
  // pour chaque produit ouvert) + état du formulaire de rattachement.
  const [bibliotheque, setBibliotheque] = useState([]);
  const [attachCharId, setAttachCharId] = useState("");
  const [attachValueIds, setAttachValueIds] = useState([]);
  const [attachRequired, setAttachRequired] = useState(true);
  const [attachLoading, setAttachLoading] = useState(false);
  const [attachError, setAttachError] = useState("");
  // Tant que les variantes du produit ouvert ne sont pas encore chargées,
  // `variantTypes` est vide — la liste des caractéristiques "disponibles"
  // afficherait alors brièvement des caractéristiques déjà rattachées
  // (fenêtre entre l'ouverture du modal et la réponse de `variantsApi.getAll`).
  // Ce drapeau retarde l'affichage du formulaire de rattachement jusqu'à ce
  // que l'état réel du produit soit connu.
  const [variantsReady, setVariantsReady] = useState(false);
  // Ref (pas un state) pour savoir de façon synchrone, à la résolution d'un
  // fetch de variantes, si l'admin a entre-temps ouvert un autre produit.
  const editingProductIdRef = useRef(null);

  // Plafond de chargement du panel, aligne sur celui du serveur.
  //
  // L'avertissement affichait « limite 100 » des que le catalogue comptait
  // EXACTEMENT 100 produits — un test d'egalite sur une valeur ecrite en dur,
  // restee la alors que le plafond serveur etait passe a 250 le 28/07 puis a
  // 500. Il se declenchait donc sur un catalogue complet, sans qu'aucune limite
  // ne soit atteinte, et se serait tu au 101e produit. La constante sert
  // maintenant a la fois a la requete et au message : les deux ne peuvent plus
  // se contredire.
  const LIMITE_PRODUITS = 500;

  // ── Charge TOUS les produits (actifs + inactifs) pour le panel admin ───────
  const loadAll = async () => {
    setLoading(true);
    try {
      const [pData, cData] = await Promise.all([
        productsApi.getAll({ limit: LIMITE_PRODUITS, includeInactive: true }),
        categoriesApi.getAll(),
      ]);
      setProducts(pData.products || []);
      setCategories(cData.categories || []);
    } catch (err) {
      console.error("Erreur chargement produits", err.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
    characteristicsApi
      .getAll()
      .then((d) => setBibliotheque(d.characteristics || []))
      .catch(() => {});
  }, []);

  const getCategoryLabel = (slug) =>
    categories.find((c) => c.slug === slug)?.label ||
    categories.find((c) => c.slug === slug)?.name ||
    slug;

  const addSpec = () => {
    if (!newSpec.label || !newSpec.value) return;
    setForm((prev) => ({
      ...prev,
      specs: [...(prev.specs || []), { ...newSpec, id: Date.now() }],
    }));
    setNewSpec({ label: "", value: "" });
  };

  const removeSpec = (id) =>
    setForm((prev) => ({
      ...prev,
      specs: prev.specs.filter((s) => s.id !== id),
    }));

  const addVariantType = async () => {
    if (!newTypeName.trim() || !editingProduct) return;
    setVariantLoading(true);
    try {
      const data = await variantsApi.createType(editingProduct.id, {
        name: newTypeName.trim(),
        required: true,
        sortOrder: variantTypes.length,
      });
      setVariantTypes((prev) => [...prev, data.variantType]);
      setNewTypeName("");
    } catch (err) {
      console.error("Erreur ajout type variante", err.message);
    }
    setVariantLoading(false);
  };

  const removeVariantType = async (typeId) => {
    if (!editingProduct) return;
    try {
      await variantsApi.deleteType(editingProduct.id, typeId);
      setVariantTypes((prev) => prev.filter((t) => t.id !== typeId));
    } catch (err) {
      console.error("Erreur suppression type variante", err.message);
    }
  };

  const toggleVariantRequired = async (typeId, currentRequired) => {
    if (!editingProduct) return;
    try {
      const data = await variantsApi.updateType(editingProduct.id, typeId, {
        required: !currentRequired,
      });
      setVariantTypes((prev) =>
        prev.map((t) => (t.id === typeId ? { ...t, required: data.variantType.required } : t))
      );
    } catch (err) {
      console.error("Erreur toggle obligatoire", err.message);
    }
  };

  const addVariantOption = async (typeId) => {
    const value = newOptionValue[typeId]?.trim();
    if (!value || !editingProduct || variantLoading) return;
    setVariantLoading(true);
    try {
      const data = await variantsApi.createOption(editingProduct.id, typeId, {
        value,
        sortOrder: variantTypes.find((t) => t.id === typeId)?.options?.length || 0,
      });
      setVariantTypes((prev) =>
        prev.map((t) =>
          t.id === typeId ? { ...t, options: [...(t.options || []), data.option] } : t
        )
      );
      setNewOptionValue((prev) => ({ ...prev, [typeId]: "" }));
    } catch (err) {
      console.error("Erreur ajout option variante", err.message);
    }
    setVariantLoading(false);
  };

  const removeVariantOption = async (typeId, optionId) => {
    if (!editingProduct) return;
    try {
      await variantsApi.deleteOption(editingProduct.id, optionId);
      setVariantTypes((prev) =>
        prev.map((t) =>
          t.id === typeId
            ? { ...t, options: t.options.filter((o) => o.id !== optionId) }
            : t
        )
      );
    } catch (err) {
      console.error("Erreur suppression option variante", err.message);
    }
  };

  const toggleAttachValue = (valueId) => {
    setAttachValueIds((prev) =>
      prev.includes(valueId) ? prev.filter((id) => id !== valueId) : [...prev, valueId],
    );
  };

  const resetAttachForm = () => {
    setAttachCharId("");
    setAttachValueIds([]);
    setAttachRequired(true);
    setAttachError("");
  };

  const attachFromLibrary = async () => {
    if (!editingProduct || !attachCharId || attachValueIds.length === 0 || attachLoading) return;
    setAttachLoading(true);
    setAttachError("");
    try {
      const data = await variantsApi.attachFromLibrary(editingProduct.id, {
        characteristicId: attachCharId,
        required: attachRequired,
        valueIds: attachValueIds,
      });
      setVariantTypes((prev) => [...prev, data.variantType]);
      resetAttachForm();
    } catch (err) {
      // Le message vient déjà en français depuis le backend (ex : 409 quand
      // la caractéristique est déjà rattachée).
      setAttachError(err.message);
    }
    setAttachLoading(false);
  };

  const updateForm = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const openAdd = () => {
    setEditingProduct(null);
    setForm(smartphoneOnly ? { ...emptyForm, category: "smartphone-tablette" } : emptyForm);
    setVariantTypes([]);
    setNewTypeName("");
    setNewOptionValue({});
    setVariantLoading(false);
    setVariantsReady(false);
    resetAttachForm();
    setShowModal(true);
  };

  const openEdit = async (product) => {
    editingProductIdRef.current = product.id;
    setEditingProduct(product);
    setForm({
      name: product.name,
      slug: product.slug,
      category: product.categorySlug || product.category || "ecouteurs",
      price: product.price,
      comparePrice: product.comparePrice || "",
      stock: product.stock,
      status: product.status,
      description: product.description || "",
      active: product.active,
      featured: product.featured || false,
      media: buildMediaSlots(product),
      specs: parseSpecs(product.specs),
    });
    setVariantTypes([]);
    setNewTypeName("");
    setNewOptionValue({});
    setVariantsReady(false);
    resetAttachForm();
    setShowModal(true);
    // Load variants async after modal opens
    try {
      const data = await variantsApi.getAll(product.id);
      // Si l'admin a rouvert un autre produit avant que cette réponse
      // n'arrive, on ignore le résultat pour ne pas afficher/éditer les
      // variantes du mauvais produit.
      if (editingProductIdRef.current === product.id) {
        setVariantTypes(data.variantTypes || []);
        setVariantsReady(true);
      }
    } catch (err) {
      console.error("Erreur chargement variantes", err.message);
      if (editingProductIdRef.current === product.id) setVariantsReady(true);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.price || !form.stock) return;
    // Répartit les 2 emplacements libres : les médias "image" alimentent le
    // tableau images[], le premier média "video" alimente videoUrl (le
    // schéma ne stocke qu'une seule vidéo par produit).
    const imageUrls = form.media
      .filter((m) => m.type === "image" && m.url)
      .map((m) => m.url);
    const videoMedia = form.media.find((m) => m.type === "video" && m.url);
    const productData = {
      name: form.name,
      slug: form.slug || generateSlug(form.name),
      categorySlug: form.category,
      price: Number(form.price),
      comparePrice: form.comparePrice ? Number(form.comparePrice) : null,
      stock: Number(form.stock),
      status: form.status,
      description: form.description || "",
      active: form.active,
      featured: form.featured,
      images: JSON.stringify(imageUrls),
      videoUrl: videoMedia ? videoMedia.url : null,
      specs: [...(form.specs || []), ...getInternalSpecs(editingProduct?.specs)],
    };
    try {
      if (editingProduct)
        await productsApi.update(editingProduct.id, productData);
      else await productsApi.create(productData);
      await loadAll();
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setShowModal(false);
      }, 900);
    } catch (err) {
      console.error("Erreur save produit", err.message);
    }
  };

  const saveVariantColorImage = async (typeName, value, imageUrl) => {
    if (!editingProduct) return;
    const images = parseVariantColorImages(editingProduct.specs).filter((item) =>
      !((item.typeName || "Couleur") === typeName && (item.value || item.color) === value),
    );
    if (imageUrl) images.push({ typeName, value, imageUrl });
    const otherInternal = getInternalSpecs(editingProduct.specs)
      .filter((spec) => spec.label !== "__mtech_variant_color_images" && spec.label !== "__mtech_iphone_color_images");
    const nextSpecs = [
      ...parseSpecs(editingProduct.specs),
      ...otherInternal,
      ...(images.length ? [{ label: "__mtech_variant_color_images", value: JSON.stringify(images) }] : []),
    ];
    await productsApi.update(editingProduct.id, { specs: nextSpecs });
    const updatedProduct = { ...editingProduct, specs: nextSpecs };
    setEditingProduct(updatedProduct);
    setProducts((current) => current.map((product) => product.id === updatedProduct.id ? updatedProduct : product));
    await refreshPublicCatalog();
  };

  const handleDelete = async (id) => {
    try {
      await productsApi.delete(id);
      await loadAll();
    } catch (err) {
      console.error("Erreur delete produit", err.message);
    }
    setDeleteConfirm(null);
  };

  // ── Toggle : met à jour localement SANS recharger depuis l'API ─────────────
  // → le produit reste visible dans le panel même si le backend filtre active=true
  const handleToggle = async (product) => {
    // 1. Mise à jour optimiste immédiate dans l'état local
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, active: !p.active } : p)),
    );
    try {
      // 2. Envoi à l'API
      await productsApi.update(product.id, { active: !product.active });
    } catch (err) {
      console.error("Erreur toggle produit", err.message);
      // 3. Rollback si erreur
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, active: product.active } : p,
        ),
      );
    }
  };

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = smartphoneOnly
      ? (p.categorySlug || p.category) === "smartphone-tablette"
      : filterCat === "tous" || (p.categorySlug || p.category) === filterCat;
    return matchSearch && matchCat;
  });

  // Caractéristiques de la bibliothèque pas encore rattachées à ce produit
  const caracteristiquesDisponibles = bibliotheque.filter(
    (c) => !variantTypes.some((vt) => vt.characteristicId === c.id),
  );
  const caracteristiqueChoisie = caracteristiquesDisponibles.find(
    (c) => c.id === attachCharId,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-black text-2xl text-apple-black tracking-tight">
            {smartphoneOnly ? "Téléphones et tablettes" : "Produits"}
          </h1>
          <p className="text-apple-mid text-[13px] mt-1">
            {smartphoneOnly ? `${filtered.length} téléphones et tablettes` : `${products.length} produits au total`}
            {products.length >= LIMITE_PRODUITS && (
              <span className="ml-2 text-amber-500 text-[11px] font-medium">
                (limite {LIMITE_PRODUITS} atteinte — utilisez les filtres pour affiner)
              </span>
            )}
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
            className="flex items-center gap-2 bg-apple-black hover:bg-neutral-800 text-white font-semibold px-5 py-2.5 rounded-2xl transition-all text-sm"
          >
            <Plus className="w-4 h-4" /> Ajouter un produit
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="glass-card rounded-3xl p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-apple-mid"
            strokeWidth={1.8}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un produit..."
            className="w-full bg-black/[0.03] rounded-2xl pl-10 pr-4 py-2.5 text-[13px] border border-black/[0.06] focus:outline-none focus:border-black/15 transition"
          />
        </div>
        <div className="relative">
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            className="appearance-none bg-black/[0.03] border border-black/[0.06] rounded-2xl px-4 py-2.5 pr-9 text-[13px] focus:outline-none text-apple-black"
          >
            {!smartphoneOnly && <option value="tous">Toutes catégories</option>}
            {(smartphoneOnly ? categories.filter((c) => c.slug === "smartphone-tablette") : categories).map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label || c.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-apple-mid pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/[0.05] bg-black/[0.02]">
                {[
                  "Produit",
                  "Catégorie",
                  "Prix",
                  "Stock",
                  "Statut",
                  "Actions",
                ].map((h, i) => (
                  <th
                    key={h}
                    className={`text-left px-5 py-3 text-[11px] font-semibold text-apple-mid uppercase tracking-wider
                    ${i === 1 ? "hidden md:table-cell" : ""}
                    ${i === 3 ? "hidden lg:table-cell" : ""}
                    ${i === 4 ? "hidden md:table-cell" : ""}
                    ${i === 5 ? "text-right" : ""}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {loading && products.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-16 text-apple-mid text-[13px]"
                  >
                    Chargement...
                  </td>
                </tr>
              )}
              {filtered.map((product) => {
                const img =
                  getFirstImage(product) || "/placeholder.jpg";
                return (
                  <tr
                    key={product.id}
                    className={`hover:bg-black/[0.015] transition ${!product.active ? "opacity-50" : ""}`}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 bg-black/[0.04] rounded-2xl overflow-hidden flex-shrink-0">
                          <Image
                            src={img}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-apple-black text-[13px] leading-snug">
                            {product.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-apple-mid text-[11px] font-mono">
                              {product.slug}
                            </p>
                            {product.featured && (
                              <span className="text-[10px] bg-orange-50 text-cta px-1.5 py-0.5 rounded-full font-medium">
                                Coup de cœur
                              </span>
                            )}
                            {parseSpecs(product.specs).length > 0 && (
                              <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">
                                {parseSpecs(product.specs).length} specs
                              </span>
                            )}
                            {/* Badge visible si produit inactif */}
                            {!product.active && (
                              <span className="text-[10px] bg-red-50 text-red-500 px-1.5 py-0.5 rounded-full font-medium">
                                Masqué
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="text-[11px] bg-black/[0.04] text-apple-mid px-2.5 py-1 rounded-full">
                        {getCategoryLabel(
                          product.categorySlug || product.category,
                        )}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-bold text-apple-black text-[13px]">
                        {formatPrice(product.price)}
                      </p>
                      {product.comparePrice && (
                        <p className="text-apple-mid text-[11px] line-through">
                          {formatPrice(product.comparePrice)}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <span
                        className={`font-semibold text-[13px] ${product.stock <= 2 ? "text-cta" : "text-apple-black"}`}
                      >
                        {product.stock}
                        {product.stock <= 2 && (
                          <AlertCircle className="inline w-3.5 h-3.5 ml-1 text-cta" />
                        )}
                      </span>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                          product.status === "En stock"
                            ? "bg-green-50 text-green-600"
                            : product.status === "Stock limité"
                              ? "bg-orange-50 text-orange-500"
                              : "bg-red-50 text-red-500"
                        }`}
                      >
                        {product.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleToggle(product)}
                          className="p-2 rounded-xl hover:bg-black/[0.05] transition text-apple-mid hover:text-apple-black"
                          title={
                            product.active
                              ? "Masquer du site"
                              : "Afficher sur le site"
                          }
                        >
                          {product.active ? (
                            <Eye className="w-4 h-4" strokeWidth={1.8} />
                          ) : (
                            <EyeOff className="w-4 h-4" strokeWidth={1.8} />
                          )}
                        </button>
                        <button
                          onClick={() => openEdit(product)}
                          className="p-2 rounded-xl hover:bg-blue-50 transition text-apple-mid hover:text-blue-600"
                        >
                          <Edit className="w-4 h-4" strokeWidth={1.8} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(product.id)}
                          className="p-2 rounded-xl hover:bg-red-50 transition text-apple-mid hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" strokeWidth={1.8} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!loading && filtered.length === 0 && (
            <div className="text-center py-16">
              <p className="text-apple-mid text-[13px]">
                {products.length === 0
                  ? "Aucun produit en base — ajoutez-en un !"
                  : "Aucun produit trouvé"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Ajout/Édition */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-5 border-b border-black/[0.06] flex items-center justify-between rounded-t-3xl z-10">
              <h2 className="font-display font-bold text-lg text-apple-black">
                {editingProduct ? "Modifier le produit" : "Ajouter un produit"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-black/[0.05] rounded-xl transition"
              >
                <X className="w-5 h-5 text-apple-mid" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              {[0, 1].map((slotIndex) => (
                <MediaUploader
                  key={slotIndex}
                  value={form.media[slotIndex].url}
                  onChange={(url, type) =>
                    setForm((prev) => {
                      const resolvedType = type || "image";
                      const otherSlot = prev.media[1 - slotIndex];
                      // Un seul emplacement vidéo est conservé à la sauvegarde
                      // (le produit n'a qu'un seul champ videoUrl) — si l'autre
                      // emplacement est déjà une vidéo, on refuse plutôt que de
                      // laisser cette seconde vidéo être silencieusement perdue.
                      if (resolvedType === "video" && otherSlot.type === "video" && otherSlot.url) {
                        window.alert("Une seule vidéo est prise en charge par produit — remplacez d'abord l'autre emplacement vidéo.");
                        return prev;
                      }
                      return {
                        ...prev,
                        media: prev.media.map((m, i) =>
                          i === slotIndex ? { url, type: resolvedType } : m,
                        ),
                      };
                    })
                  }
                  folder="mtechbenin/products"
                  accept="image/*,video/*"
                  label={
                    slotIndex === 0
                      ? "Média principal"
                      : "Média secondaire (optionnel) — image ou vidéo"
                  }
                />
              ))}

              <div>
                <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1.5 block">
                  Nom du produit *
                </label>
                <input
                  value={form.name}
                  onChange={(e) => {
                    updateForm("name", e.target.value);
                    if (!editingProduct)
                      updateForm("slug", generateSlug(e.target.value));
                  }}
                  placeholder="Ex: AirPod Pro 2ème génération"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1.5 block">
                  Slug URL
                </label>
                <input
                  value={form.slug}
                  onChange={(e) => updateForm("slug", e.target.value)}
                  placeholder="airpod-pro-2"
                  className={`${inputClass} font-mono text-[13px]`}
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1.5 block">
                  Catégorie *
                </label>
                <div className="relative">
                  <select
                    value={form.category}
                    onChange={(e) => updateForm("category", e.target.value)}
                    disabled={smartphoneOnly}
                    className={`${inputClass} appearance-none pr-10`}
                  >
                    {(smartphoneOnly ? categories.filter((c) => c.slug === "smartphone-tablette") : categories).map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.label || c.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-apple-mid pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1.5 block">
                    Prix (FCFA) *
                  </label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => updateForm("price", e.target.value)}
                    placeholder="9750"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1.5 block">
                    Prix barré (FCFA)
                  </label>
                  <input
                    type="number"
                    value={form.comparePrice}
                    onChange={(e) => updateForm("comparePrice", e.target.value)}
                    placeholder="13650"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1.5 block">
                    Stock *
                  </label>
                  <input
                    type="number"
                    value={form.stock}
                    onChange={(e) => updateForm("stock", e.target.value)}
                    placeholder="10"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1.5 block">
                    Statut
                  </label>
                  <div className="relative">
                    <select
                      value={form.status}
                      onChange={(e) => updateForm("status", e.target.value)}
                      className={`${inputClass} appearance-none pr-10`}
                    >
                      {statusOptions.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-apple-mid pointer-events-none" />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1.5 block">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => updateForm("description", e.target.value)}
                  placeholder="Description du produit..."
                  rows={3}
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-3 block">
                  Spécifications techniques
                </label>
                {form.specs?.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {form.specs.map((spec) => (
                      <div
                        key={spec.id}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-black/[0.03]"
                      >
                        <span className="text-[12px] font-semibold text-apple-black w-28 flex-shrink-0">
                          {spec.label}
                        </span>
                        <span className="text-[12px] text-apple-mid flex-1">
                          {spec.value}
                        </span>
                        <button
                          onClick={() => removeSpec(spec.id)}
                          className="text-apple-mid hover:text-red-500 transition p-1 rounded-lg hover:bg-red-50 flex-shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    value={newSpec.label}
                    onChange={(e) =>
                      setNewSpec((p) => ({ ...p, label: e.target.value }))
                    }
                    placeholder="Propriété (ex: Connectivité)"
                    className="flex-1 bg-black/[0.03] rounded-xl px-3 py-2.5 text-[13px] border border-black/[0.07] focus:outline-none focus:border-black/20 transition"
                  />
                  <input
                    value={newSpec.value}
                    onChange={(e) =>
                      setNewSpec((p) => ({ ...p, value: e.target.value }))
                    }
                    placeholder="Valeur (ex: Bluetooth 5.3)"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSpec();
                      }
                    }}
                    className="flex-1 bg-black/[0.03] rounded-xl px-3 py-2.5 text-[13px] border border-black/[0.07] focus:outline-none focus:border-black/20 transition"
                  />
                  <button
                    onClick={addSpec}
                    disabled={!newSpec.label || !newSpec.value}
                    className="flex items-center gap-1 bg-apple-black text-white rounded-xl px-3 py-2.5 text-[12px] font-semibold hover:bg-neutral-800 transition disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[11px] text-apple-mid mt-1.5">
                  💡 Appuie sur Entrée pour ajouter rapidement
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    key: "active",
                    label: "Produit visible",
                    sub: "Affiché sur le site public",
                  },
                  {
                    key: "featured",
                    label: "Coup de cœur",
                    sub: 'Affiché dans la section "Nos Coups de Cœur"',
                  },
                ].map(({ key, label, sub }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-4 bg-black/[0.03] rounded-2xl"
                  >
                    <div>
                      <p className="font-medium text-apple-black text-sm">
                        {label}
                      </p>
                      <p className="text-apple-mid text-xs mt-0.5">{sub}</p>
                    </div>
                    <div
                      onClick={() => updateForm(key, !form[key])}
                      className={`w-11 h-6 rounded-full transition-colors duration-200 relative cursor-pointer ${form[key] ? "bg-apple-black" : "bg-apple-mid/40"}`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${form[key] ? "translate-x-6" : "translate-x-1"}`}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Variantes */}
              <div className="space-y-4">
                <p className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest">
                  Variantes
                </p>

                {!editingProduct && (
                  <p className="text-[12px] text-apple-mid/70 italic">
                    Enregistrez le produit d&apos;abord, puis ajoutez des variantes.
                  </p>
                )}

                {editingProduct && (
                  <div className="space-y-4">
                    {/* Rattacher depuis la bibliothèque de caractéristiques.
                        N'apparaît qu'une fois les variantes déjà rattachées à
                        CE produit chargées (`variantsReady`) : sinon,
                        `variantTypes` est encore vide et une caractéristique
                        pourtant déjà rattachée s'afficherait brièvement
                        comme disponible, menant à un rattachement voué au
                        409. */}
                    {!variantsReady ? (
                      <div
                        className="rounded-2xl p-4"
                        style={{
                          background: "rgba(0,0,0,0.015)",
                          border: "1px dashed rgba(0,0,0,0.12)",
                        }}
                      >
                        <p className="text-[12px] text-apple-mid/70 italic">
                          Chargement des caractéristiques du produit…
                        </p>
                      </div>
                    ) : (
                    <div
                      className="rounded-2xl p-4 space-y-3"
                      style={{
                        background: "rgba(0,0,0,0.015)",
                        border: "1px dashed rgba(0,0,0,0.12)",
                      }}
                    >
                      <p className="text-[12px] font-semibold text-apple-black">
                        Rattacher depuis la bibliothèque
                      </p>

                      {caracteristiquesDisponibles.length === 0 ? (
                        <p className="text-[12px] text-apple-mid/70 italic">
                          Toutes les caractéristiques de la bibliothèque sont déjà
                          rattachées à ce produit.
                        </p>
                      ) : (
                        <>
                          <select
                            value={attachCharId}
                            onChange={(e) => {
                              setAttachCharId(e.target.value);
                              setAttachValueIds([]);
                              setAttachError("");
                            }}
                            className={inputClass + " text-[13px] py-2"}
                          >
                            <option value="">Choisir une caractéristique…</option>
                            {caracteristiquesDisponibles.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name} ({c.values.length} valeurs)
                              </option>
                            ))}
                          </select>

                          {caracteristiqueChoisie && (
                            <>
                              <div className="flex flex-wrap gap-2">
                                {caracteristiqueChoisie.values.map((v) => (
                                  <label
                                    key={v.id}
                                    className={`flex items-center gap-1.5 rounded-full pl-3 pr-3 py-1.5 text-[12px] cursor-pointer transition select-none ${
                                      attachValueIds.includes(v.id)
                                        ? "bg-apple-black text-white"
                                        : "bg-black/[0.05] text-apple-black hover:bg-black/10"
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={attachValueIds.includes(v.id)}
                                      onChange={() => toggleAttachValue(v.id)}
                                      className="hidden"
                                    />
                                    {v.value}
                                  </label>
                                ))}
                              </div>

                              <label className="flex items-center gap-2 text-[12px] text-apple-mid cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={attachRequired}
                                  onChange={(e) => setAttachRequired(e.target.checked)}
                                />
                                Obligatoire à l&apos;achat
                              </label>

                              {attachError && (
                                <p className="text-[12px] text-red-500">{attachError}</p>
                              )}

                              <button
                                onClick={attachFromLibrary}
                                disabled={attachValueIds.length === 0 || attachLoading}
                                className="w-full px-4 py-2 rounded-xl bg-apple-black text-white text-[13px] font-semibold hover:bg-neutral-700 transition disabled:opacity-40"
                              >
                                {attachLoading ? "Rattachement…" : "Rattacher"}
                              </button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                    )}

                    {variantTypes.map((vType) => (
                      <div
                        key={vType.id}
                        className="rounded-2xl p-4 space-y-3"
                        style={{
                          background: "rgba(0,0,0,0.02)",
                          border: "1px solid rgba(0,0,0,0.07)",
                        }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-[13px] text-apple-black">
                            {vType.name}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleVariantRequired(vType.id, vType.required)}
                              className={`text-[11px] font-semibold px-2.5 py-1 rounded-full transition ${
                                vType.required
                                  ? "bg-orange-50 text-orange-500 hover:bg-orange-100"
                                  : "bg-black/[0.05] text-apple-mid hover:bg-black/10"
                              }`}
                              title="Cliquer pour basculer obligatoire / optionnel"
                            >
                              {vType.required ? "Obligatoire" : "Optionnel"}
                            </button>
                            <button
                              onClick={() => removeVariantType(vType.id)}
                              className="text-red-400 hover:text-red-600 transition"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Options */}
                        <div className="space-y-1.5">
                          {(vType.options || []).map((opt) => (
                            <div
                              key={opt.id}
                              className="flex items-start justify-between gap-2 bg-black/[0.05] rounded-xl pl-3 pr-2 py-1.5"
                            >
                              <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
                                <span className="max-w-full truncate pt-1.5 text-[12px] text-apple-black">{opt.value}</span>
                                {/(couleur|color)/i.test(vType.name) && (
                                  <VariantColorImageField
                                    label={opt.value}
                                    value={parseVariantColorImages(editingProduct.specs).find((item) =>
                                      (item.typeName || "Couleur") === vType.name && (item.value || item.color) === opt.value
                                    )?.imageUrl || ""}
                                    onChange={(imageUrl) => saveVariantColorImage(vType.name, opt.value, imageUrl)}
                                  />
                                )}
                              </div>
                              <div className="flex items-start gap-2 flex-shrink-0">
                                <span className="text-[11px] text-apple-mid whitespace-nowrap hidden sm:inline pt-1.5">
                                  Supplément (F CFA)
                                </span>
                                <VariantOptionPriceInput
                                  productId={editingProduct.id}
                                  option={opt}
                                  basePrice={form.price}
                                  onSaved={(updated) =>
                                    setVariantTypes((prev) =>
                                      prev.map((t) =>
                                        t.id === vType.id
                                          ? {
                                              ...t,
                                              options: t.options.map((o) =>
                                                o.id === updated.id ? updated : o,
                                              ),
                                            }
                                          : t,
                                      ),
                                    )
                                  }
                                />
                                <button
                                  onClick={() => removeVariantOption(vType.id, opt.id)}
                                  className="text-apple-mid hover:text-red-500 transition flex-shrink-0 mt-1.5"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Add option */}
                        <div className="flex gap-2">
                          <input
                            value={newOptionValue[vType.id] || ""}
                            onChange={(e) =>
                              setNewOptionValue((prev) => ({
                                ...prev,
                                [vType.id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addVariantOption(vType.id);
                              }
                            }}
                            placeholder={`Ajouter une option (ex: Rouge)`}
                            className={inputClass + " text-[13px] py-2"}
                          />
                          <button
                            onClick={() => addVariantOption(vType.id)}
                            className="flex-shrink-0 w-9 h-9 rounded-xl bg-apple-black text-white flex items-center justify-center hover:bg-neutral-700 transition"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Add new variant type */}
                    <div className="flex gap-2">
                      <input
                        value={newTypeName}
                        onChange={(e) => setNewTypeName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addVariantType();
                          }
                        }}
                        placeholder="Nouveau type (ex: Couleur, Taille, Modèle)"
                        className={inputClass + " text-[13px] py-2"}
                      />
                      <button
                        onClick={addVariantType}
                        disabled={!newTypeName.trim() || variantLoading}
                        className="flex-shrink-0 px-4 py-2 rounded-xl bg-apple-black text-white text-[13px] font-semibold hover:bg-neutral-700 transition disabled:opacity-40"
                      >
                        Ajouter
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleSave}
                disabled={!form.name || !form.price || !form.stock}
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
                ) : editingProduct ? (
                  "Modifier le produit"
                ) : (
                  "Créer le produit"
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
              Supprimer ce produit ?
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
