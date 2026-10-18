"use client";

import { useState, useEffect } from "react";
import ShopLayout from "@/components/layout/ShopLayout";
import { MessageCircle, Mail, MapPin, Clock, Send, Check, AlertCircle } from "lucide-react";
import { contactsApi } from "@/lib/api";
import useSettingsStore from "@/store/settingsStore";

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    whatsapp: "",
    email: "",
    subject: "",
    message: "",
  });
  const [state, setState] = useState("idle"); // idle | loading | success | error

  const { shopWhatsapp, shopEmail, shopAddress, fetchSettings } = useSettingsStore();

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Numéro brut pour wa.me (chiffres uniquement)
  const waNumber = shopWhatsapp.replace(/\D/g, "");

  const updateForm = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setState("loading");
    try {
      await contactsApi.create(form);
      setState("success");
      const text = `Bonjour MTECHBENIN, je m'appelle ${form.name}.\n\nSujet : ${form.subject}\n\n${form.message}\n\nMon WhatsApp : ${form.whatsapp}`;
      window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`, "_blank");
      setForm({ name: "", whatsapp: "", email: "", subject: "", message: "" });
      setTimeout(() => setState("idle"), 4000);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 4000);
    }
  };

  const isDisabled =
    state === "loading" ||
    !form.name ||
    !form.whatsapp ||
    !form.subject ||
    !form.message;

  const coordonnees = [
    {
      icon: MessageCircle,
      title: "WhatsApp",
      value: shopWhatsapp || "+229 61 15 15 61",
      subtitle: "Réponse en moins de 30 minutes",
      color: "bg-green-50 text-green-600",
      href: `https://wa.me/${waNumber}`,
    },
    {
      icon: Mail,
      title: "Email",
      value: shopEmail || "contact@mtechbenin.com",
      subtitle: "Réponse sous 24h",
      color: "bg-blue-50 text-primary",
      href: shopEmail ? `mailto:${shopEmail}` : "mailto:contact@mtechbenin.com",
    },
    {
      icon: MapPin,
      title: "Localisation",
      value: shopAddress || "Cotonou, Bénin",
      subtitle: "Livraison sur toute la ville",
      color: "bg-orange-50 text-cta",
    },
    {
      icon: Clock,
      title: "Disponibilité",
      value: "7j/7 — 8h à 20h",
      subtitle: "Support WhatsApp en continu",
      color: "bg-purple-50 text-purple-500",
    },
  ];

  return (
    <ShopLayout>
      <div className="max-w-5xl mx-auto px-5 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-display font-black text-3xl md:text-4xl text-apple-black mb-3">
            Nous Contacter
          </h1>
          <p className="text-apple-mid">
            Une question ? Un problème ? On est là pour vous aider.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Infos contact */}
          <div className="space-y-5">
            <h2 className="font-display font-bold text-xl text-apple-black">
              Nos coordonnées
            </h2>

            {coordonnees.map((item) => {
              const Icon = item.icon;
              const content = (
                <div className="flex items-start gap-4 glass-card rounded-2xl p-5">
                  <div
                    className={`w-11 h-11 rounded-2xl ${item.color} flex items-center justify-center flex-shrink-0`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-apple-black text-sm">
                      {item.title}
                    </p>
                    <p className="text-apple-black font-medium mt-0.5">
                      {item.value}
                    </p>
                    <p className="text-apple-mid text-xs mt-0.5">
                      {item.subtitle}
                    </p>
                  </div>
                </div>
              );

              return item.href ? (
                <a
                  key={item.title}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="block hover:scale-105 transition-transform"
                >
                  {content}
                </a>
              ) : (
                <div key={item.title}>{content}</div>
              );
            })}
          </div>

          {/* Formulaire */}
          <div className="glass-card rounded-3xl p-6">
            <h2 className="font-display font-bold text-xl text-apple-black mb-6">
              Envoyer un message
            </h2>

            {state === "success" && (
              <div className="mb-5 flex items-start gap-3 px-4 py-3 rounded-2xl bg-green-50 border border-green-100">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-green-700 text-sm font-semibold">Message envoyé !</p>
                  <p className="text-green-600 text-xs mt-0.5">
                    WhatsApp s&apos;est ouvert pour une réponse rapide.
                  </p>
                </div>
              </div>
            )}

            {state === "error" && (
              <div className="mb-5 flex items-start gap-3 px-4 py-3 rounded-2xl bg-red-50 border border-red-100">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-600 text-sm">
                  Une erreur est survenue. Contactez-nous directement sur WhatsApp.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-apple-mid mb-1.5 block">
                    Votre nom *
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => updateForm("name", e.target.value)}
                    placeholder="Jean Kouassi"
                    required
                    className="w-full bg-apple-gray rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-apple-mid mb-1.5 block">
                    WhatsApp *
                  </label>
                  <input
                    value={form.whatsapp}
                    onChange={(e) => updateForm("whatsapp", e.target.value)}
                    placeholder="+229 97 00 00 00"
                    required
                    className="w-full bg-apple-gray rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-apple-mid mb-1.5 block">
                  Email{" "}
                  <span className="text-apple-mid/60 font-normal">(facultatif)</span>
                </label>
                <input
                  value={form.email}
                  onChange={(e) => updateForm("email", e.target.value)}
                  type="email"
                  placeholder="vous@email.com"
                  className="w-full bg-apple-gray rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-apple-mid mb-1.5 block">
                  Sujet *
                </label>
                <input
                  value={form.subject}
                  onChange={(e) => updateForm("subject", e.target.value)}
                  placeholder="Ex: Question sur ma commande"
                  required
                  className="w-full bg-apple-gray rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-apple-mid mb-1.5 block">
                  Message *
                </label>
                <textarea
                  value={form.message}
                  onChange={(e) => updateForm("message", e.target.value)}
                  placeholder="Décrivez votre demande..."
                  required
                  rows={4}
                  className="w-full bg-apple-gray rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isDisabled}
                className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-sm transition-all ${
                  state === "success"
                    ? "bg-green-500 text-white"
                    : "bg-cta hover:bg-cta/90 text-white hover:scale-105 active:scale-95 shadow-lg shadow-cta/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                }`}
              >
                {state === "loading" ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Envoi en cours...
                  </span>
                ) : state === "success" ? (
                  <>
                    <Check className="w-4 h-4" /> Message envoyé !
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Envoyer le message
                  </>
                )}
              </button>

              <p className="text-xs text-apple-mid text-center">
                Votre message est sauvegardé — WhatsApp s&apos;ouvre pour une réponse immédiate
              </p>
            </form>
          </div>
        </div>
      </div>
    </ShopLayout>
  );
}
