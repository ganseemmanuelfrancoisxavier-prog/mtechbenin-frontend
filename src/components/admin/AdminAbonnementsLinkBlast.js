"use client";

import { useState } from "react";
import { AlertCircle, Check, Send, X } from "lucide-react";
import { subscriptionsApi } from "@/lib/api";

function getPendingRecipients(plan) {
  return (plan?.linkClients || [])
    .filter(
      (client) =>
        client.status === "en_attente" && (client.whatsapp || client.email),
    )
    .sort(
      (a, b) =>
        new Date(a.paidAt || a.createdAt || 0) -
        new Date(b.paidAt || b.createdAt || 0),
    );
}

export default function AdminAbonnementsLinkBlast({ plan, serviceName, onSent }) {
  const recipients = getPendingRecipients(plan);
  const [open, setOpen] = useState(false);
  const [link, setLink] = useState("");
  const [count, setCount] = useState("1");
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const targetCount = Number.parseInt(count, 10) || 0;
  const targets = recipients.slice(0, Math.max(0, targetCount));
  const sentCount = result?.filter((item) => item.sent).length || 0;
  const failed = result?.filter((item) => !item.sent) || [];

  const ouvrir = () => {
    setLink("");
    setCount("1");
    setProgress("");
    setError("");
    setResult(null);
    setOpen(true);
  };

  const envoyer = async () => {
    const nombre = Number.parseInt(count, 10);
    const url = link.trim();
    if (!url) {
      setError("Saisis le lien à envoyer.");
      return;
    }
    if (!Number.isInteger(nombre) || nombre < 1 || nombre > recipients.length) {
      setError("Choisis un nombre de clients en attente valide.");
      return;
    }

    const aEnvoyer = recipients.slice(0, nombre);
    const resultats = [];
    setSaving(true);
    setError("");
    for (let index = 0; index < aEnvoyer.length; index += 1) {
      const client = aEnvoyer[index];
      setProgress(`Envoi ${index + 1}/${aEnvoyer.length} : ${client.name}`);
      try {
        await subscriptionsApi.sendLink(client.id, url);
        resultats.push({ id: client.id, name: client.name, sent: true });
      } catch (err) {
        resultats.push({
          id: client.id,
          name: client.name,
          sent: false,
          error: err.message || "Envoi impossible",
        });
      }
    }

    await onSent?.();
    setResult(resultats);
    setProgress("");
    setSaving(false);
  };

  if (recipients.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={ouvrir}
        className="flex items-center gap-1 text-[11px] font-semibold text-green-700 hover:text-green-800 transition"
      >
        <Send className="w-3 h-3" /> Envoi groupé
      </button>

      {open && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Fermer"
            disabled={saving}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-5 border-b border-black/[0.06] flex items-center justify-between rounded-t-3xl z-10">
              <div>
                <h2 className="font-display font-bold text-lg text-apple-black">
                  Envoyer le même lien
                </h2>
                <p className="mt-1 text-[11px] text-apple-mid">
                  {serviceName} · {plan.label}
                </p>
              </div>
              <button
                type="button"
                disabled={saving}
                onClick={() => setOpen(false)}
                className="p-2 hover:bg-black/[0.05] rounded-xl transition disabled:opacity-50"
              >
                <X className="w-5 h-5 text-apple-mid" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-[12px] leading-relaxed text-apple-mid">
                Le lien sera envoyé aux clients ayant payé et attendant encore leur accès, du plus ancien au plus récent.
              </p>

              <div>
                <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1.5 block">
                  Lien à partager
                </label>
                <input
                  type="url"
                  value={link}
                  onChange={(event) => setLink(event.target.value)}
                  placeholder="https://..."
                  disabled={saving || !!result}
                  className="w-full bg-black/[0.03] rounded-xl px-4 py-3 text-[13px] border border-black/[0.07] focus:outline-none focus:border-black/20 transition font-mono disabled:opacity-60"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1.5 block">
                  Nombre de personnes (sur {recipients.length} en attente)
                </label>
                <input
                  type="number"
                  min="1"
                  max={eligibleRecipients.length}
                  step="1"
                  value={count}
                  onChange={(event) => setCount(event.target.value)}
                  disabled={saving || !!result}
                  className="w-full bg-black/[0.03] rounded-xl px-4 py-3 text-[13px] border border-black/[0.07] focus:outline-none focus:border-black/20 transition disabled:opacity-60"
                />
              </div>

              <div className="rounded-2xl bg-black/[0.03] p-4">
                <p className="text-[10px] font-semibold text-apple-mid uppercase tracking-widest mb-2">
                  Destinataires prévus : {targets.length}
                </p>
                {targets.length > 0 ? (
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {targets.map((client) => (
                      <div
                        key={client.id}
                        className="flex items-center justify-between gap-3 text-[11px]"
                      >
                        <span className="font-semibold text-apple-black">
                          {client.name}
                        </span>
                        <span className="text-apple-mid text-right">
                          {client.whatsapp || client.email}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-apple-mid">
                    Aucun client en attente.
                  </p>
                )}
              </div>

              {progress && (
                <p role="status" className="text-[12px] font-medium text-apple-mid">
                  {progress}
                </p>
              )}
              {error && (
                <p role="alert" className="text-[12px] text-red-600">
                  {error}
                </p>
              )}
              {result && (
                <div className="rounded-2xl bg-green-50 p-4 text-[12px] text-green-800">
                  <p className="font-semibold">
                    {sentCount} lien(s) envoyé(s) sur {result.length}.
                  </p>
                  {failed.length > 0 && (
                    <div className="mt-2 space-y-1 text-red-700">
                      {failed.map((item) => (
                        <p key={item.id}>
                          {item.name} : {item.error}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {result ? (
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="w-full py-3 rounded-2xl bg-apple-black text-white font-semibold text-sm"
                >
                  Fermer
                </button>
              ) : (
                <button
                  type="button"
                  onClick={envoyer}
                  disabled={saving || !link.trim() || targetCount < 1 || targetCount > eligibleRecipients.length}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-semibold text-sm disabled:opacity-40"
                >
                  {saving ? (
                    <>{progress}</>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Envoyer à {targets.length} personne(s)
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
