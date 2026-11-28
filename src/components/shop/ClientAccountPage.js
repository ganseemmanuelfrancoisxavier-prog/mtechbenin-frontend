"use client";

import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Clock3, LogOut, ShieldCheck, UserRound, ChevronDown, ChevronRight, House, Coins, Smartphone } from "lucide-react";
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

  const [historyTab, setHistoryTab] = useState("purchases");
  const [historyFilter, setHistoryFilter] = useState("all");
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState("");
  const cashbackByOrder = new Map((rewards?.entries || []).filter((entry) => entry.type === "CASHBACK").map((entry) => [entry.orderRef, entry]));
  const purchaseRows = [
    ...orders.map((order) => {
      const reward = cashbackByOrder.get(order.reference);
      return {
        id: order.reference,
        reference: order.reference,
        title: order.items?.map((item) => `${item.productName} ×${item.quantity}`).join(", ") || "Commande",
        amount: reward?.saleAmount || order.total,
        gain: reward?.amount || 0,
        date: order.createdAt,
        status: order.status,
        details: reward?.details || "Récompense créditée après confirmation du paiement.",
      };
    }),
    ...subscriptions.map((order) => {
      const reward = cashbackByOrder.get(order.id);
      return {
        id: order.id,
        reference: order.id,
        title: `${order.service?.name || "Abonnement"} · ${order.plan?.label || "Formule"}`,
        amount: reward?.saleAmount || order.amount,
        gain: reward?.amount || 0,
        date: order.createdAt,
        status: order.status,
        details: reward?.details || (order.expiresAt ? `Expiration : ${formatDate(order.expiresAt)}` : "Récompense créditée après confirmation du paiement."),
      };
    }),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));
  const referralRows = (rewards?.entries || []).filter((entry) => entry.type === "REFERRAL").map((entry) => ({
    id: entry.id,
    reference: entry.orderRef || entry.id,
    title: "Achat effectué avec votre code",
    amount: entry.saleAmount || 0,
    gain: entry.amount,
    date: entry.createdAt,
    status: "CONFIRMED",
    details: entry.details || "Commission de parrainage de 20 %.",
  }));
  const activeHistory = historyTab === "purchases" ? purchaseRows : referralRows;
  const visibleHistory = activeHistory.filter((row) => historyFilter === "all" || (historyFilter === "earned" ? row.gain > 0 : row.gain === 0));
  const displayedHistory = showAllHistory ? visibleHistory : visibleHistory.slice(0, 4);
  const completedWithdrawals = (rewards?.withdrawals || []).filter((withdrawal) => withdrawal.status === "PAID");
  const completedWithdrawalTotal = completedWithdrawals.reduce((total, withdrawal) => total + Number(withdrawal.amount || 0), 0);
  const copierCode = async () => {
    try {
      await navigator.clipboard.writeText(rewards.referralCode);
      setNotice("Code de parrainage copié.");
    } catch { setNotice("Votre code de parrainage : " + rewards.referralCode); }
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
          <section className="space-y-4">
            <div className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="flex items-start justify-between gap-3">
                <div><p className="text-sm text-neutral-500">Bonjour,</p><h2 className="text-2xl font-extrabold tracking-tight text-black sm:text-3xl">{account.name}</h2><p className="mt-1 text-sm text-neutral-500">{account.whatsapp}</p></div>
                <button type="button" onClick={handleDeconnexion} className="inline-flex shrink-0 items-center gap-2 rounded-full border border-neutral-300 px-3 py-2 text-xs font-semibold text-black hover:bg-neutral-50 sm:px-4 sm:text-sm"><LogOut className="h-4 w-4" /> Déconnexion</button>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button type="button" onClick={() => { setHistoryTab("purchases"); document.getElementById("reward-history")?.scrollIntoView({ behavior: "smooth", block: "start" }); }} className="flex min-h-[92px] items-center justify-between gap-2 rounded-3xl border border-neutral-200 bg-white p-4 text-left shadow-sm transition hover:border-neutral-400">
                  <span className="min-w-0 flex-1"><strong className="block text-xs leading-snug text-black sm:text-sm">Commandes enregistrées</strong><span className="mt-1 block text-2xl font-extrabold leading-none text-black">{orders.length + subscriptions.length}</span></span><ChevronRight className="h-5 w-5 shrink-0 text-neutral-500" />
                </button>
                <button type="button" onClick={() => document.getElementById("client-rewards-panel")?.scrollIntoView({ behavior: "smooth", block: "center" })} className="flex min-h-[92px] items-center justify-between gap-2 rounded-3xl border border-neutral-200 bg-white p-4 text-left shadow-sm transition hover:border-neutral-400">
                  <span className="min-w-0 flex-1"><strong className="block text-xs leading-snug text-black sm:text-sm">Récompense</strong><span className="mt-1 block whitespace-nowrap text-base font-extrabold leading-tight text-black sm:text-2xl">{formatPrice(rewards?.balance || 0)}</span></span><ChevronRight className="h-5 w-5 shrink-0 text-neutral-500" />
                </button>
              </div>
            </div>

            <section id="client-rewards-panel" aria-label="Mes récompenses" className="relative isolate overflow-hidden rounded-[28px] shadow-lg">
              <img src="/images/client-rewards-card.svg" alt="" aria-hidden="true" className="block h-auto w-full" />
                            <span className="absolute left-[34%] top-[75%] flex h-[15%] w-[33%] items-center overflow-hidden whitespace-nowrap bg-white pl-[1%] font-mono text-[clamp(.55rem,3.2vw,1.35rem)] font-extrabold leading-none tracking-tight text-black sm:text-[clamp(.7rem,2.1vw,1.35rem)]">{rewards?.referralCode || "…"}</span>
              <button type="button" onClick={copierCode} disabled={!rewards?.referralCode} aria-label="Copier votre code de parrainage" className="absolute left-[71.5%] top-[71.5%] h-[20%] w-[24%] cursor-pointer rounded-2xl bg-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-600 disabled:cursor-default" />
            </section>

            <section id="reward-history" className="rounded-[28px] border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 text-lg font-extrabold text-black sm:text-xl"><Clock3 className="h-6 w-6" /> Détail des récompenses</h3>
                <label className="relative"><span className="sr-only">Filtrer l’historique</span><select value={historyFilter} onChange={(e) => { setHistoryFilter(e.target.value); setShowAllHistory(false); }} className="appearance-none rounded-full border border-neutral-300 bg-white py-2 pl-3 pr-9 text-xs font-semibold text-neutral-800"><option value="all">Toutes les commandes</option><option value="earned">Récompenses validées</option><option value="pending">Sans récompense validée</option></select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" /></label>
              </div>
              <div className="mt-4 grid grid-cols-2 rounded-full bg-neutral-100 p-1 text-center text-xs font-bold sm:text-sm">
                <button type="button" onClick={() => { setHistoryTab("purchases"); setExpandedHistory(""); setShowAllHistory(false); }} className={`rounded-full px-2 py-3 ${historyTab === "purchases" ? "bg-black text-white shadow" : "text-neutral-700"}`}>Mes commandes ({purchaseRows.length})</button>
                <button type="button" onClick={() => { setHistoryTab("referrals"); setExpandedHistory(""); setShowAllHistory(false); }} className={`rounded-full px-2 py-3 ${historyTab === "referrals" ? "bg-black text-white shadow" : "text-neutral-700"}`}>Avec mon code ({referralRows.length})</button>
              </div>
              <div className="mt-4 grid grid-cols-[48px_minmax(0,1fr)_auto] gap-2 border-b border-neutral-200 bg-neutral-50 px-3 py-2 text-[10px] font-bold text-neutral-500 sm:grid-cols-[70px_minmax(0,2fr)_1fr_1fr_1fr] sm:text-xs">
                <span>#</span><span>Commande</span><span className="hidden sm:block">Montant</span><span className="hidden sm:block">Gain</span><span className="text-right sm:text-left">Date</span>
              </div>
              {!visibleHistory.length ? <div className="rounded-b-2xl border border-t-0 border-neutral-200 px-4 py-10 text-center"><p className="text-sm font-semibold text-neutral-800">Aucune opération dans cette sélection.</p><p className="mt-1 text-xs text-neutral-500">Vos gains apparaîtront ici après confirmation du paiement.</p></div> : <div className="divide-y divide-neutral-100">
                {displayedHistory.map((row) => <div key={row.id}>
                  <button type="button" onClick={() => setExpandedHistory(expandedHistory === row.id ? "" : row.id)} className="grid w-full grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-2 px-3 py-3 text-left transition hover:bg-neutral-50 sm:grid-cols-[70px_minmax(0,2fr)_1fr_1fr_1fr]">
                    <span className="text-[10px] font-bold text-neutral-700 sm:text-xs">#{String(row.reference).slice(-6)}</span>
                    <span className="min-w-0"><strong className="block truncate text-[11px] font-semibold text-neutral-900 sm:text-sm">{row.title}</strong>{historyTab === "referrals" && <span className="mt-0.5 inline-block rounded-full bg-violet-50 px-2 py-0.5 text-[9px] font-semibold text-violet-700">Via votre code</span>}</span>
                    <span className="hidden text-xs font-semibold text-neutral-900 sm:block">{row.amount ? formatPrice(row.amount) : "—"}</span><span className="hidden text-xs font-bold text-green-700 sm:block">{row.gain ? "+" + formatPrice(row.gain) : "—"}</span>
                    <span className="flex items-center justify-end gap-1 text-right text-[10px] text-neutral-600 sm:justify-between sm:text-xs">{formatDate(row.date)}<ChevronRight className="h-4 w-4 shrink-0 text-neutral-500" /></span>
                  </button>
                  <div className="flex justify-between gap-2 px-[64px] pb-2 text-[10px] sm:hidden"><span className="text-neutral-500">Achat {row.amount ? formatPrice(row.amount) : "—"}</span><span className="font-bold text-green-700">Gain {row.gain ? "+" + formatPrice(row.gain) : "—"}</span></div>
                  {expandedHistory === row.id && <div className="flex flex-wrap justify-between gap-2 bg-neutral-50 px-4 py-3 text-xs"><span className="text-neutral-700">{row.details} · Réf. {row.reference}</span><strong className="text-neutral-800">Statut : {row.gain ? "Récompense créditée" : row.status}</strong></div>}
                </div>)}
              </div>}
              {visibleHistory.length > 4 && (
                <div className="border-t border-neutral-100 px-4 py-3 text-center">
                  <button type="button" onClick={() => setShowAllHistory((value) => !value)} className="rounded-full border border-neutral-300 px-5 py-2 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50">
                    {showAllHistory ? "Voir moins" : "Voir plus"}
                  </button>
                </div>
              )}
            </section>

            <section className="rounded-[28px] border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
              <h3 className="flex items-center gap-2 text-lg font-extrabold text-black sm:text-xl"><House className="h-6 w-6" /> Demande de retrait</h3>
              <form onSubmit={handleWithdrawal} className="mt-4 space-y-3">
                <label className="flex items-center gap-3 rounded-2xl border border-neutral-300 px-4 py-3"><Coins className="h-5 w-5 shrink-0 text-neutral-800" /><input required min={2000} max={rewards?.balance || 0} type="number" step="1" placeholder="Montant (minimum 2 000 F)" value={withdrawalForm.amount} onChange={(e) => setWithdrawalForm((v) => ({ ...v, amount: e.target.value }))} className="min-w-0 flex-1 text-sm outline-none placeholder:text-neutral-500" /></label>
                <label className="flex items-center gap-3 rounded-2xl border border-neutral-300 px-4 py-3"><Smartphone className="h-5 w-5 shrink-0 text-neutral-800" /><input required inputMode="tel" placeholder="Numéro Mobile Money pour recevoir" value={withdrawalForm.payoutNumber} onChange={(e) => setWithdrawalForm((v) => ({ ...v, payoutNumber: e.target.value }))} className="min-w-0 flex-1 text-sm outline-none placeholder:text-neutral-500" /></label>
                <p className="text-xs text-neutral-500">Disponible : {formatPrice(rewards?.balance || 0)} · Minimum de retrait : 2 000 FCFA.</p>
                <button disabled={withdrawalBusy || (rewards?.balance || 0) < 2000} className="w-full rounded-2xl bg-black px-5 py-4 text-sm font-extrabold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40">{withdrawalBusy ? "Envoi de la demande…" : "Demander le retrait"}</button>
              </form>
              {!!rewards?.withdrawals?.length && <div className="mt-4 space-y-2 border-t border-neutral-200 pt-4">{rewards.withdrawals.map((w) => <div key={w.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-neutral-50 p-3 text-xs text-neutral-700"><span className="flex min-w-0 flex-col gap-1"><span className="font-semibold text-neutral-900">{formatPrice(w.amount)} · {w.payoutNumber}</span><span className="text-neutral-500">{formatDate(w.processedAt || w.requestedAt)}</span></span><strong className={`rounded-full px-2.5 py-1 ${w.status === "PAID" ? "bg-emerald-100 text-emerald-800" : w.status === "REQUESTED" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-700"}`}>{w.status === "REQUESTED" ? "En attente" : w.status === "PAID" ? "Livré" : "Refusé"}</strong></div>)}</div>}
              <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
                <p className="text-xs font-medium text-neutral-500">Retraits effectués</p>
                <p className="mt-1 text-sm font-bold text-neutral-900">{completedWithdrawals.length} retrait{completedWithdrawals.length > 1 ? "s" : ""} · {formatPrice(completedWithdrawalTotal)}</p>
              </div>
            </section>
            {notice && <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>}
            {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
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
