"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Loader2,
  MessageCircle,
  Stethoscope,
  X,
} from "lucide-react";
import { reparationApi } from "@/lib/api";
import { formatPrice } from "@/lib/format";

// Estime un délai en heures pour comparer deux libellés en texte libre —
// l'administrateur écrit « 24h », « 2 jours », « 48 h »... sans format
// imposé. Comparer les chaînes telles quelles ferait dire que "9h" est plus
// long que "48h". Purement indicatif : on n'affiche jamais ce nombre, on
// s'en sert seulement pour choisir QUEL libellé original montrer.
function estimerHeures(delay) {
  if (!delay) return 0;
  const s = String(delay).toLowerCase();
  const nombre = parseFloat((s.match(/[\d.,]+/) || ["0"])[0].replace(",", "."));
  if (!Number.isFinite(nombre)) return 0;
  if (/sem/.test(s)) return nombre * 24 * 7;
  if (/jour|jr/.test(s)) return nombre * 24;
  if (/min/.test(s)) return nombre / 60;
  return nombre; // heures par défaut (h, heure, heures)
}

// Le plus bas des prix proposés pour une réparation. Sert d'accroche
// « dès X » quand plusieurs qualités existent : c'est le montant à partir
// duquel le client peut réellement faire réparer.
function prixMini(options) {
  const prix = (options || []).map((o) => o.price).filter((p) => Number.isFinite(p));
  return prix.length ? Math.min(...prix) : 0;
}

export default function ReparationModele({ espace, slug }) {
  const router = useRouter();

  const [donnees, setDonnees] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  // Une réparation cochée porte l'id de l'OPTION choisie (jamais juste `true`) :
  // c'est cet id, et lui seul, qui part au serveur — voir `reparationApi` dans
  // lib/api.js, aucun prix n'y transite depuis le navigateur.
  const [selections, setSelections] = useState({});

  const [devisOuvert, setDevisOuvert] = useState(false);
  const [devisNom, setDevisNom] = useState("");
  const [devisWhatsapp, setDevisWhatsapp] = useState("");
  const [devisEnvoi, setDevisEnvoi] = useState(false);
  const [devisResultat, setDevisResultat] = useState(null); // { ok, message }

  useEffect(() => {
    let annule = false;
    async function charger() {
      setChargement(true);
      setErreur(null);
      setSelections({});
      try {
        const data = await reparationApi.modele(slug);
        if (!annule) setDonnees(data);
      } catch (err) {
        if (!annule) setErreur(err.message || "Modèle introuvable");
      } finally {
        if (!annule) setChargement(false);
      }
    }
    charger();
    return () => {
      annule = true;
    };
  }, [slug]);

  const reparations = donnees?.reparations || [];

  const toggleReparation = (job) => {
    setSelections((s) => {
      const next = { ...s };
      if (next[job.id] !== undefined) {
        delete next[job.id];
      } else {
        // Une seule option : elle est prise implicitement, la notion de
        // qualité ne s'affiche même pas (l'administrateur ne l'a pas
        // définie, le client n'a pas à la découvrir).
        next[job.id] = job.options[0]?.id ?? null;
      }
      return next;
    });
  };

  const choisirOption = (jobId, optionId) => {
    setSelections((s) => ({ ...s, [jobId]: optionId }));
  };

  const optionIdsSelectionnees = useMemo(
    () => Object.values(selections).filter(Boolean),
    [selections],
  );

  const total = useMemo(() => {
    const prixParOption = {};
    reparations.forEach((j) => j.options.forEach((o) => (prixParOption[o.id] = o.price)));
    return optionIdsSelectionnees.reduce((somme, id) => somme + (prixParOption[id] || 0), 0);
  }, [reparations, optionIdsSelectionnees]);

  // Le délai le plus long parmi les réparations COCHÉES, affiché tel qu'écrit
  // par l'administrateur (voir `estimerHeures` — la comparaison est
  // approximative, le libellé montré ne l'est pas).
  const delaiPlusLong = useMemo(() => {
    const delais = reparations
      .filter((j) => selections[j.id] !== undefined && j.delay)
      .map((j) => j.delay);
    if (delais.length === 0) return null;
    return delais.reduce((max, d) => (estimerHeures(d) > estimerHeures(max) ? d : max));
  }, [reparations, selections]);

  const auMoinsUneSelection = optionIdsSelectionnees.length > 0;

  const handleCommande = () => {
    if (!auMoinsUneSelection || !donnees?.modele?.slug) return;
    const params = new URLSearchParams({
      modele: donnees.modele.slug,
      options: optionIdsSelectionnees.join(","),
    });
    router.push(`/reparation/commande?${params.toString()}`);
  };

  const ouvrirDevis = () => {
    setDevisResultat(null);
    setDevisOuvert(true);
  };

  const fermerDevis = () => {
    setDevisOuvert(false);
    setDevisEnvoi(false);
  };

  const envoyerDevis = async (e) => {
    e.preventDefault();
    if (!devisNom.trim() || !devisWhatsapp.trim()) return;
    setDevisEnvoi(true);
    setDevisResultat(null);
    try {
      // Contrat réel de l'API (`repairs.controller.js` → envoyerDevisWhatsapp) :
      // `modelId` / `clientName` / `clientWhatsapp`, pas des libellés français
      // — rien n'est enregistré côté serveur, l'appel se contente de
      // déclencher un message WhatsApp indicatif.
      const data = await reparationApi.devisWhatsapp({
        modelId: donnees.modele.id,
        optionIds: optionIdsSelectionnees,
        clientName: devisNom.trim(),
        clientWhatsapp: devisWhatsapp.trim(),
      });
      setDevisResultat({ ok: true, message: data?.message || "Devis envoyé sur WhatsApp." });
    } catch (err) {
      // Échec : le message du serveur, affiché tel quel — pas de reformulation.
      setDevisResultat({ ok: false, message: err.message || "Erreur serveur" });
    } finally {
      setDevisEnvoi(false);
    }
  };

  // ── Chargement ────────────────────────────────────────────────────────────
  if (chargement) {
    return (
      <div className="max-w-3xl mx-auto px-5 py-10">
        <p className="text-apple-mid text-[13px] text-center py-20">Chargement...</p>
      </div>
    );
  }

  // ── Modèle introuvable ────────────────────────────────────────────────────
  if (erreur || !donnees) {
    return (
      <div className="max-w-xl mx-auto px-5 py-20 text-center">
        <p className="text-apple-mid text-xl mb-6">{erreur || "Modèle introuvable"}</p>
        <Link
          href="/reparation"
          className="inline-flex items-center gap-2 bg-apple-black text-white px-6 py-3 rounded-2xl font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Retour à la réparation
        </Link>
      </div>
    );
  }

  const { modele, famille } = donnees;

  return (
    <div className="max-w-3xl mx-auto px-5 py-10 pb-48 md:pb-16">
      <Link
        href="/reparation"
        className="inline-flex items-center gap-1.5 text-apple-mid hover:text-apple-black text-[13px] font-medium mb-6 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Réparation
      </Link>

      <div className="mb-6">
        <p className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1">
          {famille?.name}
        </p>
        <h1 className="font-display font-black text-3xl md:text-4xl text-apple-black tracking-tight">
          {modele?.name}
        </h1>
      </div>

      {reparations.length === 0 ? (
        <div className="glass-card rounded-3xl p-8 text-center">
          <p className="text-apple-mid text-[13px]">
            Aucune réparation disponible pour ce modèle pour le moment.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {reparations.map((job) => {
            const checked = selections[job.id] !== undefined;
            const optionUnique = job.options.length === 1;
            const selectedOptionId = selections[job.id];
            return (
              <div key={job.id} className="glass-card rounded-3xl p-4">
                <button
                  onClick={() => toggleReparation(job)}
                  className="w-full flex items-start gap-3 text-left"
                >
                  <div
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center mt-0.5 flex-shrink-0 transition-all ${
                      checked
                        ? "bg-apple-black border-apple-black"
                        : "border-apple-mid/40"
                    }`}
                  >
                    {checked && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-apple-black text-[14px]">
                        {job.name}
                      </span>
                      {/* Le prix se lit sans rien cocher. Une réparation à
                          plusieurs qualités n'en affichait aucun ici : la ligne
                          restait vide jusqu'au clic, sur la page dont le prix
                          est justement la raison d'être. Elle annonce
                          désormais le moins cher, et le détail par qualité
                          arrive au clic. */}
                      <span className="font-display font-black text-[14px] text-apple-black flex-shrink-0">
                        {optionUnique
                          ? formatPrice(job.options[0]?.price || 0)
                          : `dès ${formatPrice(prixMini(job.options))}`}
                      </span>
                    </div>
                    {job.delay && (
                      <span className="text-apple-mid text-[11px] inline-flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" /> {job.delay}
                      </span>
                    )}
                  </div>
                </button>

                {/* Qualité — seulement s'il existe un choix. Une réparation à
                    option unique n'affiche jamais ce bloc : il n'y a rien à
                    choisir, et le montrer suggérerait à tort une décision. */}
                {checked && !optionUnique && (
                  <div className="mt-3 pl-8 space-y-1.5">
                    {job.options.map((o) => (
                      <button
                        key={o.id}
                        onClick={() => choisirOption(job.id, o.id)}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-[13px] transition-all ${
                          selectedOptionId === o.id
                            ? "bg-apple-black text-white"
                            : "bg-black/[0.03] text-apple-black hover:bg-black/[0.06]"
                        }`}
                      >
                        <span>{o.label}</span>
                        <span className="font-semibold">{formatPrice(o.price)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Lien discret vers le diagnostic — pour le client qui n'est pas sûr
          de la panne à cocher. Construit par un autre agent : on ne fait que
          pointer vers sa route, avec le modèle déjà connu. */}
      <Link
        href={`/reparation/diagnostic?modele=${encodeURIComponent(slug)}`}
        className="mt-6 flex items-center gap-2 text-apple-mid hover:text-apple-black text-[12px] transition-colors"
      >
        <Stethoscope className="w-3.5 h-3.5" /> Pas sûr du problème ? Lancer un diagnostic
      </Link>

      {/* Barre total + actions — flottante sur mobile pour rester visible au
          pouce pendant qu'on coche, simple bloc en fin de page sur desktop où
          l'écran entier est déjà visible sans défiler. */}
      <div className="fixed inset-x-0 bottom-16 z-30 px-4 md:static md:px-0 md:mt-6">
        <div className="glass-card rounded-3xl p-4 md:p-5 shadow-premium max-w-3xl mx-auto md:mx-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest">
                Total
              </p>
              <p className="font-display font-black text-[22px] text-apple-black tracking-tight">
                {formatPrice(total)}
              </p>
            </div>
            {delaiPlusLong && (
              <div className="text-right">
                <p className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest">
                  Délai
                </p>
                <p className="text-[13px] text-apple-black font-medium inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {delaiPlusLong}
                </p>
              </div>
            )}
          </div>
          <div className="flex gap-2.5">
            <button
              onClick={handleCommande}
              disabled={!auMoinsUneSelection}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[13px] font-semibold transition-all duration-200 disabled:opacity-35 disabled:cursor-not-allowed"
              style={{
                background: auMoinsUneSelection ? "rgba(29,29,31,0.92)" : "rgba(0,0,0,0.06)",
                color: auMoinsUneSelection ? "#FFFFFF" : "#6E6E73",
              }}
            >
              Demander la réparation <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={ouvrirDevis}
              disabled={!auMoinsUneSelection}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[13px] font-semibold transition-all duration-200 disabled:opacity-35 disabled:cursor-not-allowed"
              style={{
                background: "rgba(255,255,255,0.22)",
                backdropFilter: "blur(24px) saturate(200%)",
                WebkitBackdropFilter: "blur(24px) saturate(200%)",
                border: "1px solid rgba(255,255,255,0.50)",
                color: "#1D1D1F",
              }}
            >
              <MessageCircle className="w-4 h-4" /> Devis WhatsApp
            </button>
          </div>
        </div>
      </div>

      {/* Modale devis WhatsApp — rien n'est enregistré, c'est voulu : un
          simple message indicatif part vers le numéro donné. */}
      {devisOuvert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={fermerDevis}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-5 border-b border-black/[0.06] flex items-center justify-between rounded-t-3xl z-10">
              <h2 className="font-display font-bold text-lg text-apple-black">
                Recevoir le devis sur WhatsApp
              </h2>
              <button
                onClick={fermerDevis}
                className="p-2 hover:bg-black/[0.05] rounded-xl transition"
              >
                <X className="w-5 h-5 text-apple-mid" />
              </button>
            </div>

            <div className="p-6">
              {devisResultat?.ok ? (
                <div className="text-center py-6">
                  <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                    <Check className="w-7 h-7 text-green-600" strokeWidth={2.5} />
                  </div>
                  <p className="text-apple-black font-semibold text-[14px] mb-1">
                    {devisResultat.message}
                  </p>
                  <p className="text-apple-mid text-[12px] mb-6">
                    Vérifiez WhatsApp — le message peut prendre quelques instants.
                  </p>
                  <button
                    onClick={fermerDevis}
                    className="bg-apple-black text-white px-6 py-3 rounded-2xl font-semibold text-[13px]"
                  >
                    Fermer
                  </button>
                </div>
              ) : (
                <form onSubmit={envoyerDevis} className="space-y-4">
                  <div>
                    <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1.5 block">
                      Nom *
                    </label>
                    <input
                      value={devisNom}
                      onChange={(e) => setDevisNom(e.target.value)}
                      placeholder="Votre nom"
                      required
                      className="w-full bg-black/[0.03] rounded-xl px-4 py-3 text-sm border border-black/[0.07] focus:outline-none focus:border-black/20 transition"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1.5 block">
                      Numéro WhatsApp *
                    </label>
                    <input
                      value={devisWhatsapp}
                      onChange={(e) => setDevisWhatsapp(e.target.value)}
                      placeholder="+229 XX XX XX XX"
                      required
                      className="w-full bg-black/[0.03] rounded-xl px-4 py-3 text-sm border border-black/[0.07] focus:outline-none focus:border-black/20 transition"
                    />
                  </div>

                  {/* Échec : le message du serveur, affiché tel quel. */}
                  {devisResultat && !devisResultat.ok && (
                    <p className="text-[12px] text-red-600 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5">
                      {devisResultat.message}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={devisEnvoi}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[13px] font-semibold bg-apple-black text-white transition-all disabled:opacity-50"
                  >
                    {devisEnvoi ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Envoi...
                      </>
                    ) : (
                      <>
                        <MessageCircle className="w-4 h-4" /> Envoyer le devis
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
