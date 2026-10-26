"use client";

import { useEffect, useState } from "react";
import { Plus, Save, Trash2, Smartphone } from "lucide-react";
import { settingsApi } from "@/lib/api";

const defaults = [
  { id: "iphone", title: "iPhone", description: "Derniers modèles, accessoires, et plus encore.", image: "/images/reparation/devices/iphone.jpg", href: "/recherche?q=iPhone", active: true },
  { id: "android", title: "Android", description: "Samsung, Xiaomi, Oppo, Tecno, etc.", image: "/images/reparation/devices/android.png", href: "/recherche?q=Samsung", active: true },
  { id: "computer", title: "Mac / PC", description: "Mac, PC, composants, accessoires…", image: "/images/reparation/devices/computer.png", href: "/recherche?q=ordinateur", active: true },
  { id: "tablet", title: "Tablette", description: "iPad, Samsung, Xiaomi, accessoires et plus…", image: "/images/reparation/devices/tablet.png", href: "/recherche?q=tablette", active: true },
];

const blankDevice = () => ({ id: `appareil-${Date.now()}`, title: "", description: "", image: "", href: "/catalogue", active: true });
const inputClass = "w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-apple-black focus:outline-none focus:border-black/30";

function parseDevices(value) {
  if (!value) return defaults;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : defaults;
  } catch {
    return defaults;
  }
}

export default function AdminSmartphoneDevices() {
  const [devices, setDevices] = useState(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    settingsApi.getAll()
      .then(({ settings }) => setDevices(parseDevices(settings?.smartphoneHubDevices)))
      .catch(() => setNotice("Chargement impossible. Vérifie ta connexion au serveur."))
      .finally(() => setLoading(false));
  }, []);

  const updateDevice = (id, key, value) => setDevices((current) => current.map((device) => device.id === id ? { ...device, [key]: value } : device));
  const addDevice = () => setDevices((current) => [...current, blankDevice()]);
  const deleteDevice = (id) => setDevices((current) => current.filter((device) => device.id !== id));

  const save = async () => {
    setSaving(true);
    setNotice("");
    try {
      await settingsApi.update({ smartphoneHubDevices: JSON.stringify(devices) });
      setNotice("Les appareils sont enregistrés et visibles dans l’espace smartphone.");
    } catch (error) {
      setNotice(error.message || "Enregistrement impossible.");
    }
    setSaving(false);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-black text-apple-black">Appareils de l’espace smartphone</h1>
          <p className="mt-1 text-sm text-apple-mid">Gère indépendamment les téléphones, ordinateurs, tablettes et autres appareils affichés sur la page Smartphones.</p>
        </div>
        <button onClick={addDevice} className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-apple-black">
          <Plus className="h-4 w-4" /> Ajouter un appareil
        </button>
      </header>

      {loading ? <p className="rounded-2xl bg-white p-6 text-sm text-apple-mid">Chargement des appareils…</p> : (
        <div className="space-y-4">
          {devices.map((device) => (
            <section key={device.id} className="grid gap-3 rounded-2xl border border-black/[0.07] bg-white p-4 sm:grid-cols-2">
              <label className="text-xs font-semibold text-apple-mid">Nom de l’appareil
                <input className={`${inputClass} mt-1.5`} value={device.title || ""} onChange={(event) => updateDevice(device.id, "title", event.target.value)} placeholder="Ex. iPhone" />
              </label>
              <label className="text-xs font-semibold text-apple-mid">Lien au clic
                <input className={`${inputClass} mt-1.5`} value={device.href || ""} onChange={(event) => updateDevice(device.id, "href", event.target.value)} placeholder="/recherche?q=iPhone" />
              </label>
              <label className="text-xs font-semibold text-apple-mid sm:col-span-2">Description
                <input className={`${inputClass} mt-1.5`} value={device.description || ""} onChange={(event) => updateDevice(device.id, "description", event.target.value)} placeholder="Modèles et accessoires…" />
              </label>
              <label className="text-xs font-semibold text-apple-mid sm:col-span-2">Adresse de l’image
                <input className={`${inputClass} mt-1.5`} value={device.image || ""} onChange={(event) => updateDevice(device.id, "image", event.target.value)} placeholder="/images/mon-appareil.jpg" />
              </label>
              <label className="flex items-center gap-2 text-sm text-apple-black">
                <input type="checkbox" checked={device.active !== false} onChange={(event) => updateDevice(device.id, "active", event.target.checked)} /> Afficher sur le site
              </label>
              <button onClick={() => deleteDevice(device.id)} className="inline-flex items-center justify-self-start gap-2 text-sm font-medium text-red-600">
                <Trash2 className="h-4 w-4" /> Supprimer cet appareil
              </button>
            </section>
          ))}
        </div>
      )}

      <footer className="sticky bottom-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/10 bg-white/95 p-3 shadow-lg backdrop-blur">
        <p role="status" className="text-sm text-apple-mid">{notice || <><Smartphone className="mr-1 inline h-4 w-4" /> Les modifications doivent être enregistrées.</>}</p>
        <button onClick={save} disabled={loading || saving} className="inline-flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
          <Save className="h-4 w-4" /> {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </footer>
    </div>
  );
}
