"use client";

import { useState } from "react";
import { Check, MessageCircle } from "lucide-react";
import { demandeCodeApi } from "@/lib/api";

export default function DemandeCodePage() {
  const [numero, setNumero] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

  const demander = async (e) => {
    e.preventDefault();
    if (!numero.trim() || envoi) return;
    setEnvoi(true);
    setErreur("");
    setMessage("");
    try {
      const r = await demandeCodeApi.demander(numero.trim());
      setMessage(r.message);
      setNumero("");
    } catch (err) {
      // Deux origines possibles :
      // - le backend a répondu (400...) : `err.status` est renseigné et
      //   `err.message` porte déjà un message en français (voir apiFetch) —
      //   on le relaie tel quel.
      // - la requête n'a même pas abouti (coupure réseau, serveur injoignable) :
      //   `fetch` rejette alors avec un message natif du navigateur en
      //   anglais ("Failed to fetch") — on le remplace par un message en
      //   français explicite.
      setErreur(
        err.status !== undefined
          ? err.message
          : "Connexion au serveur impossible — la demande n'a pas été enregistrée.",
      );
    }
    setEnvoi(false);
  };

  return (
    <div className="max-w-md mx-auto px-5 py-16">
      <h1 className="font-display font-black text-2xl text-apple-black tracking-tight mb-2">
        Demander mon code
      </h1>
      <p className="text-apple-mid text-[14px] leading-relaxed mb-8">
        Votre service vous demande un code de vérification ? Indiquez votre
        numéro WhatsApp, puis connectez-vous. Dès que le code arrive, nous vous
        l&apos;envoyons.
      </p>

      <form onSubmit={demander} className="space-y-4">
        <div className="space-y-1.5">
          <label className="flex items-center gap-1 text-[12px] font-medium text-apple-mid">
            Numéro WhatsApp
          </label>
          <input
            type="tel"
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            placeholder="+229 97 00 00 00"
            className="w-full bg-black/[0.03] text-apple-black text-[14px] placeholder-apple-mid/50 rounded-2xl px-4 py-3 border border-black/[0.07] focus:outline-none focus:border-black/20 transition"
          />
        </div>
        <button
          type="submit"
          disabled={envoi || !numero.trim()}
          className="w-full bg-apple-black text-white text-[14px] font-medium rounded-2xl px-4 py-3 disabled:opacity-40 transition"
        >
          {envoi ? "Enregistrement..." : "Demander mon code"}
        </button>
      </form>

      {message && (
        <div className="mt-6 flex items-start gap-3 p-4 rounded-2xl bg-green-50 border border-green-200">
          <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-[13px] text-green-800 leading-relaxed">{message}</p>
        </div>
      )}

      {erreur && (
        <div className="mt-6 p-4 rounded-2xl bg-red-50 border border-red-200">
          <p className="text-[13px] text-red-800">{erreur}</p>
        </div>
      )}

      <div className="mt-10 flex items-start gap-3 text-apple-mid text-[12px] leading-relaxed">
        <MessageCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <p>
          Le code est toujours envoyé au numéro enregistré lors de votre achat,
          jamais à celui saisi ici. Cette demande reste valable 15 minutes.
        </p>
      </div>
    </div>
  );
}
