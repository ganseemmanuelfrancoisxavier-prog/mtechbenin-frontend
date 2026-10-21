"use client";

import { useState, useEffect } from "react";
import {
  Store,
  Key,
  Truck,
  AlertTriangle,
  Check,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Save,
  Lock,
  Percent,
  ShieldAlert,
} from "lucide-react";
import { settingsApi, authApi } from "@/lib/api";
import { formatPrice } from "@/lib/format";

const inputBaseClass =
  "w-full bg-black/[0.03] text-[14px] placeholder-apple-mid/50 rounded-2xl px-4 py-3 border border-black/[0.07] focus:outline-none focus:border-black/20 transition";
const inputClass = `${inputBaseClass} text-apple-black`;


function Section({ icon: Icon, title, description, children }) {
  return (
    <div className="glass-card rounded-3xl overflow-hidden">
      <div className="flex items-start gap-3 px-6 py-4 border-b border-black/[0.06]">
        <div className="w-8 h-8 bg-black/[0.04] rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
          <Icon className="w-4 h-4 text-apple-mid" strokeWidth={1.6} />
        </div>
        <div>
          <h2 className="font-display font-bold text-[15px] text-apple-black">
            {title}
          </h2>
          {description && (
            <p className="text-[11px] text-apple-mid mt-0.5">{description}</p>
          )}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function Field({ label, children, hint }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest block">
        {label}
        {hint && (
          <span className="text-apple-mid/50 normal-case ml-1 font-normal">
            {hint}
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

function PasswordStrength({ password }) {
  if (!password) return null;
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const labels = ["", "Faible", "Moyen", "Bon", "Fort ✓"];
  const colors = [
    "",
    "bg-red-400",
    "bg-orange-400",
    "bg-yellow-400",
    "bg-green-400",
  ];
  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {checks.map((ok, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${ok ? colors[score] : "bg-black/[0.08]"}`}
          />
        ))}
      </div>
      <p
        className={`text-[11px] font-medium ${score <= 1 ? "text-red-500" : score === 2 ? "text-orange-500" : score === 3 ? "text-yellow-600" : "text-green-600"}`}
      >
        {password.length < 8
          ? "Trop court (minimum 8 caractères)"
          : labels[score]}
      </p>
    </div>
  );
}

function PasswordInput({ field, placeholder, label, hint, passwordForm, setPasswordForm, setPasswordError, showPass, setShowPass }) {
  return (
    <Field label={label} hint={hint}>
      <div className="relative">
        <input
          type={showPass[field] ? "text" : "password"}
          value={passwordForm[field]}
          onChange={(e) => {
            setPasswordForm((p) => ({ ...p, [field]: e.target.value }));
            setPasswordError("");
          }}
          placeholder={placeholder}
          className={`${inputClass} pr-12`}
        />
        <button
          type="button"
          onClick={() => setShowPass((p) => ({ ...p, [field]: !p[field] }))}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-apple-mid hover:text-apple-black transition"
        >
          {showPass[field] ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
      </div>
    </Field>
  );
}

export default function AdminParametres() {
  // ── État local — chargé depuis l'API ─────────────────────────────────────
  const [settings, setSettings] = useState({
    shopName: "MTECHBENIN",
    shopSlogan: "",
    shopEmail: "",
    shopWhatsapp: "",
    shopAddress: "",
    shopFacebook: "",
    shopInstagram: "",
    shopTiktok: "",
    fedapayPublicKey: "",
    fedapayEnv: "live",
    paymentFeePercent: "2.9",
    maintenanceMode: "false",
    maintenanceMessage: "Site en maintenance. Nous revenons très bientôt !",
  });

  const [zones, setZones] = useState([]);
  const [newZone, setNewZone] = useState({ name: "", fee: "", delay: "" });
  const [savedSection, setSavedSection] = useState(null);
  const [saving, setSaving] = useState(null);
  const [showPubKey, setShowPubKey] = useState(false);
  const [savedSettings, setSavedSettings] = useState({});
  const [loadingInit, setLoadingInit] = useState(true);

  const [passwordForm, setPasswordForm] = useState({
    current: "",
    newPass: "",
    confirm: "",
  });
  const [showPass, setShowPass] = useState({
    current: false,
    newPass: false,
    confirm: false,
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaved, setPasswordSaved] = useState(false);

  // ── Charge les paramètres depuis l'API ────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoadingInit(true);
      try {
        const data = await settingsApi.getAll();
        if (data.settings) {
          setSettings((prev) => ({ ...prev, ...data.settings }));
          setSavedSettings(data.settings);
        }
      } catch (err) {
        console.error("Erreur chargement paramètres", err.message);
      }
      // Zones — depuis localStorage pour l'instant (pas de route dédiée)
      try {
        const raw = localStorage.getItem("mtechbenin-settings");
        const parsed = raw ? JSON.parse(raw) : null;
        if (parsed?.state?.zones?.length) setZones(parsed.state.zones);
        else
          setZones([
            { id: 1, name: "Cotonou", fee: 1000, delay: "2-4h", active: true },
            {
              id: 2,
              name: "Abomey-Calavi",
              fee: 1500,
              delay: "3-6h",
              active: true,
            },
            {
              id: 3,
              name: "Porto-Novo",
              fee: 2000,
              delay: "24h",
              active: true,
            },
            { id: 4, name: "Parakou", fee: 5000, delay: "48h", active: false },
          ]);
      } catch {}
      setLoadingInit(false);
    };
    load();
  }, []);

  const updateSetting = (key, value) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const exampleBase = 10000;
  const exampleFee = Math.ceil(
    exampleBase * (Number(settings.paymentFeePercent) / 100),
  );
  const exampleTotal = exampleBase + exampleFee;

  // ── Sauvegarde une section en base ────────────────────────────────────────
  const handleSave = async (section) => {
    setSaving(section);
    try {
      let data = {};
      if (section === "boutique") {
        data = {
          shopName: settings.shopName,
          shopSlogan: settings.shopSlogan,
          shopEmail: settings.shopEmail,
          shopWhatsapp: settings.shopWhatsapp,
          shopAddress: settings.shopAddress,
          shopFacebook: settings.shopFacebook,
          shopInstagram: settings.shopInstagram,
          shopTiktok: settings.shopTiktok,
        };
      } else if (section === "fedapay") {
        data = {
          fedapayPublicKey: settings.fedapayPublicKey,
          fedapayEnv: settings.fedapayEnv,
          paymentFeePercent: String(settings.paymentFeePercent),
        };
      } else if (section === "maintenance") {
        data = {
          maintenanceMode: String(settings.maintenanceMode),
          maintenanceMessage: settings.maintenanceMessage,
        };
      }
      await settingsApi.update(data);
      setSavedSettings((prev) => ({ ...prev, ...data }));
      setSavedSection(section);
      setTimeout(() => setSavedSection(null), 2000);
    } catch (err) {
      console.error("Erreur sauvegarde", err.message);
    }
    setSaving(null);
  };

  // ── Zones — gestion locale + persistance localStorage ────────────────────
  const saveZonesToStorage = (newZones) => {
    try {
      const raw = localStorage.getItem("mtechbenin-settings");
      const parsed = raw ? JSON.parse(raw) : { state: {} };
      parsed.state.zones = newZones;
      localStorage.setItem("mtechbenin-settings", JSON.stringify(parsed));
    } catch {}
  };

  const handleAddZone = () => {
    if (!newZone.name || !newZone.fee) return;
    const updated = [
      ...zones,
      { ...newZone, id: Date.now(), fee: Number(newZone.fee), active: true },
    ];
    setZones(updated);
    saveZonesToStorage(updated);
    setNewZone({ name: "", fee: "", delay: "" });
  };

  const handleToggleZone = (id) => {
    const updated = zones.map((z) =>
      z.id === id ? { ...z, active: !z.active } : z,
    );
    setZones(updated);
    saveZonesToStorage(updated);
  };

  const handleDeleteZone = (id) => {
    const updated = zones.filter((z) => z.id !== id);
    setZones(updated);
    saveZonesToStorage(updated);
  };

  // ── Changement mot de passe — vérifie le mot de passe actuel via le backend ──
  const handleChangePassword = async () => {
    setPasswordError("");

    if (passwordForm.newPass.length < 8) {
      setPasswordError("Le nouveau mot de passe doit contenir au moins 8 caractères");
      return;
    }
    if (passwordForm.newPass !== passwordForm.confirm) {
      setPasswordError("Les mots de passe ne correspondent pas");
      return;
    }

    setSaving("password");
    try {
      // 1. Vérifie le mot de passe actuel contre le backend (bcrypt)
      await authApi.login(passwordForm.current);
    } catch {
      setPasswordError("Mot de passe actuel incorrect");
      setSaving(null);
      return;
    }

    // 2. Sauvegarde le nouveau mot de passe (le backend doit le hacher)
    try {
      await settingsApi.update({ adminPassword: passwordForm.newPass });
      setPasswordForm({ current: "", newPass: "", confirm: "" });
      setPasswordSaved(true);
      setTimeout(() => setPasswordSaved(false), 3000);
    } catch (err) {
      setPasswordError("Erreur lors de la sauvegarde : " + err.message);
    }
    setSaving(null);
  };

  const shopInputClass = (key, extra = "") => {
    const pristine = savedSettings[key] !== undefined && settings[key] === savedSettings[key];
    return `${inputBaseClass} ${pristine ? "text-apple-mid/60" : "text-apple-black"}${extra ? ` ${extra}` : ""}`;
  };

  const SaveButton = ({ section }) => (
    <button
      onClick={() => handleSave(section)}
      className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-semibold text-[13px] transition-all ${
        savedSection === section
          ? "bg-green-500 text-white"
          : "bg-apple-black hover:bg-neutral-800 text-white"
      }`}
    >
      {saving === section ? (
        "Sauvegarde..."
      ) : savedSection === section ? (
        <>
          <Check className="w-3.5 h-3.5" /> Sauvegardé
        </>
      ) : (
        <>
          <Save className="w-3.5 h-3.5" /> Sauvegarder
        </>
      )}
    </button>
  );


  if (loadingInit) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-black/20 border-t-black/70 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display font-black text-2xl text-apple-black tracking-tight">
          Paramètres
        </h1>
        <p className="text-apple-mid text-[13px] mt-1">
          Toutes les modifications sont sauvegardées en base de données
        </p>
      </div>

      <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-blue-50 border border-blue-100">
        <span className="text-[14px] flex-shrink-0">🔄</span>
        <p className="text-[12px] text-blue-700 leading-relaxed">
          Cliquez sur <strong>Sauvegarder</strong> pour synchroniser chaque
          section en base de données — les modifications sont visibles sur tout
          le site immédiatement.
        </p>
      </div>

      {/* Infos boutique */}
      <Section
        icon={Store}
        title="Informations boutique"
        description="Apparaît dans la navbar, le footer et les emails automatiques"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nom de la boutique">
              <input
                value={settings.shopName}
                onChange={(e) => updateSetting("shopName", e.target.value)}
                className={shopInputClass("shopName")}
              />
            </Field>
            <Field label="Email">
              <input
                value={settings.shopEmail}
                onChange={(e) => updateSetting("shopEmail", e.target.value)}
                type="email"
                className={shopInputClass("shopEmail")}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="WhatsApp">
              <input
                value={settings.shopWhatsapp}
                onChange={(e) => updateSetting("shopWhatsapp", e.target.value)}
                className={shopInputClass("shopWhatsapp")}
              />
            </Field>
            <Field label="Adresse">
              <input
                value={settings.shopAddress}
                onChange={(e) => updateSetting("shopAddress", e.target.value)}
                className={shopInputClass("shopAddress")}
              />
            </Field>
          </div>
          <Field label="Slogan / Description courte">
            <input
              value={settings.shopSlogan}
              onChange={(e) => updateSetting("shopSlogan", e.target.value)}
              placeholder="Votre boutique tech de confiance..."
              className={shopInputClass("shopSlogan")}
            />
          </Field>
          <div className="pt-2 space-y-3">
            <p className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest">
              Réseaux sociaux
            </p>
            <div className="grid grid-cols-1 gap-3">
              {[
                {
                  key: "shopFacebook",
                  val: settings.shopFacebook,
                  label: "Facebook",
                  placeholder: "https://facebook.com/...",
                },
                {
                  key: "shopInstagram",
                  val: settings.shopInstagram,
                  label: "Instagram",
                  placeholder: "https://instagram.com/...",
                },
                {
                  key: "shopTiktok",
                  val: settings.shopTiktok,
                  label: "TikTok",
                  placeholder: "https://tiktok.com/@...",
                },
              ].map(({ key, val, label, placeholder }) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-[12px] text-apple-mid w-20 flex-shrink-0">
                    {label}
                  </span>
                  <input
                    value={val}
                    onChange={(e) => updateSetting(key, e.target.value)}
                    placeholder={placeholder}
                    className={shopInputClass(key, "text-[13px] font-mono flex-1")}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <SaveButton section="boutique" />
          </div>
        </div>
      </Section>

      {/* FedaPay + Frais */}
      <Section
        icon={Key}
        title="Paiement — FedaPay"
        description="Clé publique, environnement et frais affichés au client dans le checkout"
      >
        <div className="space-y-5">
          <Field label="Clé publique">
            <div className="relative">
              <input
                type={showPubKey ? "text" : "password"}
                value={settings.fedapayPublicKey}
                onChange={(e) =>
                  updateSetting("fedapayPublicKey", e.target.value)
                }
                placeholder="pk_sandbox_xxxx ou pk_live_xxxx"
                className={`${inputClass} font-mono text-[13px] pr-12`}
              />
              <button
                onClick={() => setShowPubKey(!showPubKey)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-apple-mid hover:text-apple-black transition"
              >
                {showPubKey ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-[11px] text-apple-mid mt-1">
              💡 Récupérez votre clé sur{" "}
              <span className="font-mono">live.fedapay.com</span> → API &
              Webhooks.
            </p>
          </Field>
          <div className="flex items-center justify-between p-4 bg-black/[0.03] rounded-2xl">
            <div>
              <p className="font-medium text-apple-black text-sm">
                Mode sandbox
              </p>
              <p className="text-apple-mid text-xs mt-0.5">
                Paiements de test — désactiver en production
              </p>
            </div>
            <div
              onClick={() =>
                updateSetting(
                  "fedapayEnv",
                  settings.fedapayEnv === "sandbox" ? "live" : "sandbox",
                )
              }
              className={`w-11 h-6 rounded-full transition-colors duration-200 relative cursor-pointer ${settings.fedapayEnv === "sandbox" ? "bg-apple-black" : "bg-apple-mid/40"}`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${settings.fedapayEnv === "sandbox" ? "translate-x-6" : "translate-x-1"}`}
              />
            </div>
          </div>
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-medium ${settings.fedapayEnv === "sandbox" ? "bg-orange-50 text-orange-600 border border-orange-100" : "bg-green-50 text-green-600 border border-green-100"}`}
          >
            {settings.fedapayEnv === "sandbox"
              ? "🧪 Mode TEST — aucun vrai paiement n'est débité"
              : "✅ Mode LIVE — les vrais paiements sont actifs"}
          </div>
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-apple-mid" strokeWidth={1.6} />
              <p className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest">
                Frais de paiement
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={settings.paymentFeePercent}
                  onChange={(e) =>
                    updateSetting("paymentFeePercent", e.target.value)
                  }
                  className="w-24 bg-black/[0.03] rounded-xl px-4 py-3 text-[14px] font-semibold text-apple-black border border-black/[0.07] focus:outline-none focus:border-black/20 transition text-center"
                />
                <span className="text-apple-black font-semibold text-[14px]">
                  %
                </span>
              </div>
              <p className="text-[12px] text-apple-mid">
                appliqués sur le total (articles + livraison)
              </p>
            </div>
            <div className="p-4 bg-black/[0.03] rounded-2xl space-y-2">
              <p className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-3">
                Simulation — commande de {formatPrice(exampleBase)}
              </p>
              {[
                {
                  label: "Articles + livraison",
                  value: formatPrice(exampleBase),
                  className: "text-apple-black font-medium",
                },
                {
                  label: `Frais paiement (${settings.paymentFeePercent}%)`,
                  value: `+ ${formatPrice(exampleFee)}`,
                  className: "text-orange-500 font-medium",
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex justify-between text-[12px]"
                >
                  <span className="text-apple-mid">{row.label}</span>
                  <span className={row.className}>{row.value}</span>
                </div>
              ))}
              <div className="h-px bg-black/[0.06]" />
              <div className="flex justify-between text-[13px] font-bold">
                <span className="text-apple-black">
                  Total affiché au client
                </span>
                <span className="text-apple-black">
                  {formatPrice(exampleTotal)}
                </span>
              </div>
              <p className="text-[10px] text-apple-mid/60 mt-1">
                FedaPay reçoit le montant total — les frais sont déjà inclus
                dans ce que paie le client.
              </p>
            </div>
            {Number(settings.paymentFeePercent) === 0 && (
              <p className="text-[11px] text-apple-mid">
                ℹ️ Frais à 0% — aucune ligne frais n&apos;est affichée dans le
                checkout.
              </p>
            )}
          </div>
          <div className="flex justify-end">
            <SaveButton section="fedapay" />
          </div>
        </div>
      </Section>

      {/* Zones livraison */}
      <Section
        icon={Truck}
        title="Zones de livraison"
        description="Synchronisé avec le checkout — le client voit uniquement les villes actives"
      >
        <div className="space-y-3">
          {zones.length === 0 && (
            <p className="text-apple-mid text-[13px] text-center py-4">
              Aucune zone configurée
            </p>
          )}
          {zones.map((zone) => (
            <div
              key={zone.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl bg-black/[0.03] transition-opacity ${!zone.active ? "opacity-40" : ""}`}
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-apple-black text-[13px]">
                  {zone.name}
                </p>
                <p className="text-apple-mid text-[11px]">
                  {zone.fee.toLocaleString("fr-FR")} FCFA
                  {zone.delay ? ` · ${zone.delay}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <div
                  onClick={() => handleToggleZone(zone.id)}
                  className={`w-9 h-5 rounded-full transition-colors duration-200 relative cursor-pointer ${zone.active ? "bg-apple-black" : "bg-apple-mid/40"}`}
                >
                  <div
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${zone.active ? "translate-x-4" : "translate-x-0.5"}`}
                  />
                </div>
                <button
                  onClick={() => handleDeleteZone(zone.id)}
                  className="p-1.5 rounded-xl hover:bg-red-50 transition text-apple-mid hover:text-red-500"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          <div className="space-y-2 pt-2">
            <div className="grid grid-cols-2 gap-2">
              <input
                value={newZone.name}
                onChange={(e) =>
                  setNewZone((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Ville"
                className="bg-black/[0.03] rounded-xl px-3 py-2.5 text-[13px] border border-black/[0.07] focus:outline-none focus:border-black/20 transition"
              />
              <input
                type="number"
                value={newZone.fee}
                onChange={(e) =>
                  setNewZone((p) => ({ ...p, fee: e.target.value }))
                }
                placeholder="Frais FCFA"
                className="bg-black/[0.03] rounded-xl px-3 py-2.5 text-[13px] border border-black/[0.07] focus:outline-none focus:border-black/20 transition"
              />
            </div>
            <div className="flex gap-2">
              <input
                value={newZone.delay}
                onChange={(e) =>
                  setNewZone((p) => ({ ...p, delay: e.target.value }))
                }
                placeholder="Délai estimé (ex: 2-4h)"
                className="flex-1 bg-black/[0.03] rounded-xl px-3 py-2.5 text-[13px] border border-black/[0.07] focus:outline-none focus:border-black/20 transition"
              />
              <button
                onClick={handleAddZone}
                disabled={!newZone.name || !newZone.fee}
                className="flex items-center justify-center gap-1.5 bg-apple-black text-white rounded-xl px-4 py-2.5 text-[13px] font-semibold hover:bg-neutral-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="w-3.5 h-3.5" /> Ajouter
              </button>
            </div>
          </div>
        </div>
      </Section>

      {/* Maintenance */}
      <Section
        icon={AlertTriangle}
        title="Mode maintenance"
        description="Active une page de maintenance sur tout le site public"
      >
        <div className="space-y-4">
          {settings.maintenanceMode === "true" && (
            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-orange-50 border border-orange-100">
              <span className="text-[14px] flex-shrink-0">⚠️</span>
              <p className="text-[12px] text-orange-700">
                Le mode maintenance est actif — le site est inaccessible aux
                visiteurs. Les URLs <code className="font-mono">/admin/*</code>{" "}
                restent accessibles.
              </p>
            </div>
          )}
          <div className="flex items-center justify-between p-4 bg-black/[0.03] rounded-2xl">
            <div>
              <p className="font-medium text-apple-black text-sm">
                Activer la maintenance
              </p>
              <p className="text-apple-mid text-xs mt-0.5">
                Bloque l&apos;accès au site public
              </p>
            </div>
            <div
              onClick={() =>
                updateSetting(
                  "maintenanceMode",
                  settings.maintenanceMode === "true" ? "false" : "true",
                )
              }
              className={`w-11 h-6 rounded-full transition-colors duration-200 relative cursor-pointer ${settings.maintenanceMode === "true" ? "bg-cta" : "bg-apple-mid/40"}`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${settings.maintenanceMode === "true" ? "translate-x-6" : "translate-x-1"}`}
              />
            </div>
          </div>
          <Field label="Message affiché aux visiteurs">
            <textarea
              value={settings.maintenanceMessage}
              onChange={(e) =>
                updateSetting("maintenanceMessage", e.target.value)
              }
              rows={3}
              className={`${inputClass} resize-none`}
              placeholder="Site en maintenance. Nous revenons très bientôt !"
            />
          </Field>
          <div className="flex justify-end">
            <SaveButton section="maintenance" />
          </div>
        </div>
      </Section>

      {/* Mot de passe admin */}
      <Section
        icon={Lock}
        title="Mot de passe administrateur"
        description="Modifiez votre mot de passe de connexion au panel admin"
      >
        <div className="space-y-4">
          {/* Bannière sécurité — bcrypt requis en base */}
          <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-amber-50 border border-amber-100">
            <ShieldAlert className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" strokeWidth={1.8} />
            <div>
              <p className="text-[12px] font-semibold text-amber-700 mb-0.5">
                Mot de passe bcrypt requis
              </p>
              <p className="text-[11px] text-amber-600 leading-relaxed">
                Le backend vérifie maintenant que le mot de passe en base est haché.
                Si la connexion échoue, utilisez le formulaire ci-dessous pour définir
                un nouveau mot de passe — le backend le hachera automatiquement à la sauvegarde.
              </p>
            </div>
          </div>

          {passwordSaved && (
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-green-50 border border-green-100">
              <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
              <p className="text-[12px] text-green-700 font-medium">
                Mot de passe modifié avec succès. Le cookie admin a été mis à
                jour.
              </p>
            </div>
          )}
          <PasswordInput
            field="current"
            label="Mot de passe actuel"
            placeholder="••••••••"
            passwordForm={passwordForm}
            setPasswordForm={setPasswordForm}
            setPasswordError={setPasswordError}
            showPass={showPass}
            setShowPass={setShowPass}
          />
          <div>
            <PasswordInput
              field="newPass"
              label="Nouveau mot de passe"
              hint="— minimum 8 caractères"
              placeholder="••••••••"
              passwordForm={passwordForm}
              setPasswordForm={setPasswordForm}
              setPasswordError={setPasswordError}
              showPass={showPass}
              setShowPass={setShowPass}
            />
            <PasswordStrength password={passwordForm.newPass} />
          </div>
          <div>
            <PasswordInput
              field="confirm"
              label="Confirmer le nouveau mot de passe"
              placeholder="••••••••"
              passwordForm={passwordForm}
              setPasswordForm={setPasswordForm}
              setPasswordError={setPasswordError}
              showPass={showPass}
              setShowPass={setShowPass}
            />
            {passwordForm.confirm && passwordForm.newPass && (
              <p
                className={`text-[11px] mt-1 flex items-center gap-1 ${passwordForm.confirm === passwordForm.newPass ? "text-green-600" : "text-cta"}`}
              >
                {passwordForm.confirm === passwordForm.newPass ? (
                  <>
                    <Check className="w-3 h-3" /> Les mots de passe
                    correspondent
                  </>
                ) : (
                  "⚠ Les mots de passe ne correspondent pas"
                )}
              </p>
            )}
          </div>
          {passwordError && (
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-red-50 border border-red-100">
              <span className="text-[13px] text-cta">⚠️ {passwordError}</span>
            </div>
          )}
          <div className="flex justify-end">
            <button
              onClick={handleChangePassword}
              disabled={
                !passwordForm.current ||
                !passwordForm.newPass ||
                !passwordForm.confirm
              }
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-semibold text-[13px] transition-all bg-apple-black hover:bg-neutral-800 text-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Lock className="w-3.5 h-3.5" /> Modifier le mot de passe
            </button>
          </div>
        </div>
      </Section>
    </div>
  );
}
