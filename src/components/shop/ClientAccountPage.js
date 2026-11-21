"use client";

import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Clock3, LogOut, Package, ShieldCheck, UserRound, Gift, Wallet, Copy } from "lucide-react";
import { clientAccountApi } from "@/lib/clientAccountApi";

const formatPrice = (value) => `${Number(value || 0).toLocaleString("fr-FR")} FCFA`;
const formatDate = (value) => value
  ? new Date(value).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
  : "";

export default function ClientAccountPage() {
  const [account, setAccount] = useState(null);
  const [orders, setOrders] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [rewards, setRewards] = useState(null);
  const [withdrawalForm, setWithdrawalForm] = useState({ amount: "", payoutNumber: "" });
  const [withdrawalBusy, setWithdrawalBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", whatsapp: "+229 ", email: "", code: "" });

  const chargerHistorique = async () => {
    const data = await clientAccountApi.orders();
    setOrders(data.orders || []);
    setSubscriptions(data.subscriptions || []);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { client } = await clientAccountApi.me();
        if (!mounted) return;
        setAccount(client);
        try { setRewards(await clientAccountApi.rewards()); } catch { /* Recharge possible après connexion. */ }
        try { await chargerHistorique(); } catch { /* Le compte reste accessible si l'historique ne répond pas. */ }
      } catch {
        // Le visiteur n'a pas encore ouvert de session.
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const mettreAJour = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const handleDemanderCode = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setSending(true);
    try {
      const result = await clientAccountApi.requestCode({
        name: form.name,
        whatsapp: form.whatsapp,
        email: form.email,
      });
      setCodeSent(true);
      setNotice(`${result.message} Saisissez le code à 6 chiffres reçu.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleVerifierCode = async (event) => {
    event.preventDefault();
    setError("");
    setVerifying(true);
    try {
      const result = await clientAccountApi.verifyCode({ whatsapp: form.whatsapp, code: form.code });
      setAccount(result.client);
      await clientAccountApi.rewards().then(setRewards).catch(() => {});
      await chargerHistorique().catch(() => {});
      setNotice("Votre compte est prêt. Votre numéro WhatsApp est vérifié.");
    } catch (err) {
      setError(err.message);
    } finally {
      setVerifying(false);
    }
  };

  const handleDeconnexion = async () => {
    await clientAccountApi.logout();
    setAccount(null);
    setOrders([]);
    setSubscriptions([]);
    setRewards(null);
    setCodeSent(false);
    setForm({ name: "", whatsapp: "+229 ", email: "", code: "" });
    setNotice("Vous êtes déconnecté.");
    setError("");
  };

  const handleWithdrawal = async (event) => {
    event.preventDefault(); setError(""); setNotice(""); setWithdrawalBusy(true);
    try {
      await clientAccountApi.requestWithdrawal({ amount: Number(withdrawalForm.amount), payoutNumber: withdrawalForm.payoutNumber });
      setRewards(await clientAccountApi.rewards()); setWithdrawalForm({ amount: "", payoutNumber: "" });
      setNotice("Votre demande de retrait a été envoyée.");
    } catch (err) { setError(err.message); }
    finally { setWithdrawalBusy(false); }
  };

  if (loading) {
    return <main className="min-h-[65vh] px-4 py-16 text-center text-sm text-neutral-500">Chargement de votre compte…</main>;
  }

  return (
    <main className="min-h-[70vh] bg-neutral-50 px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-900 text-white">
            <UserRound className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">MTECHBENIN</p>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-950">Mon compte</h1>
          </div>
        </div>

        {account ? (
          <section className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm text-neutral-500">Bonjour</p>
                <h2 className="mt-1 text-xl font-semibold text-neutral-950">{account.name}</h2>
                <p className="mt-1 text-sm text-neutral-600">{account.whatsapp}</p>
              </div>
              <button type="button" onClick={handleDeconnexion} className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-600 transition hover:bg-neutral-50">
                <LogOut className="h-4 w-4" /> Déconnexion
              </button>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-neutral-50 p-4">
                <p className="text-xs text-neutral-500">Commandes enregistrées</p>
                <p className="mt-1 text-lg font-semibold text-neutral-950">{orders.length + subscriptions.length}</p>
              </div>
              <div className="rounded-2xl bg-neutral-50 p-4">
                <p className="text-xs text-neutral-500">Points fidélité</p>
                <p className="mt-1 text-lg font-semibold text-neutral-950">{account.points || 0}</p>
              </div>
            </div>

            <div className="mt-7">
              <div className="mb-3 flex items-center gap-2">
            {rewards && (
              <section className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 sm:p-5">
                <div className="flex items-center gap-2 text-emerald-900"><Wallet className="h-5 w-5" /><h3 className="font-semibold">Mes récompenses</h3></div>
                <p className="mt-3 text-2xl font-bold text-neutral-950">{formatPrice(rewards.balance)}</p>
                <p className="mt-1 text-sm text-neutral-600">10 % de cashback sur vos achats confirmés. Gagnez aussi 20 % sur les achats effectués avec votre code.</p>
                <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-white p-3"><Gift className="h-4 w-4 text-emerald-700" /><span className="text-sm text-neutral-600">Votre code :</span><strong className="font-mono text-neutral-950">{rewards.referralCode}</strong><button type="button" onClick={() => navigator.clipboard?.writeText(rewards.referralCode)} className="ml-auto inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold"><Copy className="h-3.5 w-3.5" /> Copier</button></div>
                <form onSubmit={handleWithdrawal} className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                  <input required min={2000} type="number" step="1" placeholder="Montant à retirer (min. 2 000 F)" value={withdrawalForm.amount} onChange={(e) => setWithdrawalForm((v) => ({ ...v, amount: e.target.value }))} className="rounded-xl border border-neutral-200 bg-white px-3 py-3 text-sm" />
                  <input required inputMode="tel" placeholder="Numéro Mobile Money" value={withdrawalForm.payoutNumber} onChange={(e) => setWithdrawalForm((v) => ({ ...v, payoutNumber: e.target.value }))} className="rounded-xl border border-neutral-200 bg-white px-3 py-3 text-sm" />
                  <button disabled={withdrawalBusy || (rewards.balance || 0) < 2000} className="rounded-xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{withdrawalBusy ? "Envoi…" : "Demander le retrait"}</button>
                </form>
                <p className="mt-2 text-xs text-neutral-500">Retrait possible dès 2 000 F. Le paiement est effectué après traitement de la demande.</p>
                {!!rewards.withdrawals?.length && <div className="mt-4 space-y-2 border-t border-emerald-100 pt-3">{rewards.withdrawals.map((w) => <div key={w.id} className="flex justify-between gap-3 text-xs text-neutral-600"><span>{formatPrice(w.amount)} · {w.payoutNumber}</span><strong>{w.status === "REQUESTED" ? "En attente" : w.status === "PAID" ? "Payé" : "Refusé"}</strong></div>)}</div>}
              </section>
            )}

                <Package className="h-4 w-4 text-neutral-500" />
                <h3 className="font-semibold text-neutral-950">Mes commandes</h3>
              </div>
              {orders.length + subscriptions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-neutral-200 px-4 py-8 text-center">
                  <p className="text-sm font-medium text-neutral-800">Aucune commande liée à ce numéro pour le moment.</p>
                  <p className="mt-1 text-xs text-neutral-500">Utilisez le même numéro WhatsApp lors de vos prochains achats.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {orders.map((order) => (
                    <article key={order.reference} className="rounded-2xl border border-neutral-200 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-neutral-950">Commande {order.reference}</p>
                          <p className="mt-1 text-xs text-neutral-500">{order.items.map((item) => `${item.productName} ×${item.quantity}`).join(", ")}</p>
                          <p className="mt-1 text-xs text-neutral-500">{formatDate(order.createdAt)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-neutral-950">{formatPrice(order.total)}</p>
                          <span className="mt-1 inline-block rounded-full bg-neutral-100 px-2 py-1 text-[10px] font-medium text-neutral-600">{order.status}</span>
                        </div>
                      </div>
                    </article>
                  ))}
                  {subscriptions.map((order) => (
                    <article key={order.id} className="rounded-2xl border border-neutral-200 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-neutral-950">{order.service?.name || "Abonnement"} · {order.plan?.label || "Formule"}</p>
                          <p className="mt-1 text-xs text-neutral-500">{formatDate(order.createdAt)}{order.expiresAt ? ` · expire le ${formatDate(order.expiresAt)}` : ""}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-neutral-950">{formatPrice(order.amount)}</p>
                          <span className="mt-1 inline-block rounded-full bg-neutral-100 px-2 py-1 text-[10px] font-medium text-neutral-600">{order.status}</span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        ) : (
          <section className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-8">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-neutral-950">{codeSent ? "Vérifiez votre numéro" : "Créer mon compte ou me connecter"}</h2>
              <p className="mt-1 text-sm leading-relaxed text-neutral-500">
                {codeSent
                  ? "Nous avons envoyé un code à 6 chiffres. Il est valable 5 minutes."
                  : "Un code envoyé sur WhatsApp vérifie votre numéro et ouvre votre espace client."}
              </p>
            </div>

            <form onSubmit={codeSent ? handleVerifierCode : handleDemanderCode} className="space-y-4">
              {!codeSent ? (
                <>
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-neutral-700">Nom complet</span>
                    <input required minLength={2} maxLength={80} autoComplete="name" value={form.name} onChange={(event) => mettreAJour("name", event.target.value)} className="h-12 w-full rounded-xl border border-neutral-200 px-4 text-base outline-none transition focus:border-neutral-500 focus:ring-4 focus:ring-neutral-900/5" placeholder="Votre nom" />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-neutral-700">Numéro WhatsApp avec indicatif</span>
                    <input required type="tel" autoComplete="tel" value={form.whatsapp} onChange={(event) => mettreAJour("whatsapp", event.target.value)} className="h-12 w-full rounded-xl border border-neutral-200 px-4 text-base outline-none transition focus:border-neutral-500 focus:ring-4 focus:ring-neutral-900/5" placeholder="+229 01 23 45 67 89" />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-neutral-700">E-mail de secours <span className="font-normal text-neutral-400">(facultatif)</span></span>
                    <input type="email" autoComplete="email" value={form.email} onChange={(event) => mettreAJour("email", event.target.value)} className="h-12 w-full rounded-xl border border-neutral-200 px-4 text-base outline-none transition focus:border-neutral-500 focus:ring-4 focus:ring-neutral-900/5" placeholder="vous@exemple.com" />
                  </label>
                </>
              ) : (
                <>
                  <div className="rounded-xl bg-neutral-50 p-3 text-sm text-neutral-600">{form.whatsapp}</div>
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-neutral-700">Code de vérification</span>
                    <input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" value={form.code} onChange={(event) => mettreAJour("code", event.target.value.replace(/\D/g, "").slice(0, 6))} className="h-14 w-full rounded-xl border border-neutral-200 px-4 text-center font-mono text-2xl tracking-[0.35em] outline-none transition focus:border-neutral-500 focus:ring-4 focus:ring-neutral-900/5" placeholder="••••••" />
                  </label>
                  <button type="button" onClick={() => { setCodeSent(false); setForm((current) => ({ ...current, code: "" })); setNotice(""); setError(""); }} className="text-sm font-medium text-neutral-600 underline underline-offset-4">Modifier mes informations</button>
                </>
              )}

              {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>}
              {notice && <p role="status" className="rounded-xl bg-green-50 px-3 py-2.5 text-sm text-green-700">{notice}</p>}

              <button type="submit" disabled={sending || verifying} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50">
                {sending || verifying ? "Veuillez patienter…" : codeSent ? "Vérifier et ouvrir mon compte" : "Recevoir mon code"}
                {!(sending || verifying) && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>

            <div className="mt-5 flex items-start gap-2 rounded-2xl bg-neutral-50 p-3 text-xs leading-relaxed text-neutral-500">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-green-700" />
              Le code confirme que vous possédez ce numéro. Ne le partagez avec personne.
            </div>
          </section>
        )}

        {notice && account && (
          <p role="status" className="mt-4 flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2.5 text-sm text-green-700">
            <CheckCircle2 className="h-4 w-4" /> {notice}
          </p>
        )}
        <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-xs text-neutral-400">
          <Clock3 className="h-3.5 w-3.5" /> Les codes expirent après 5 minutes.
        </p>
      </div>
    </main>
  );
}
