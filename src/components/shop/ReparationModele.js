"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  ChevronRight,
  Check,
  Clock,
  Loader2,
  MessageCircle,
  ShieldCheck,
  Star,
  Stethoscope,
  X,
} from "lucide-react";
import { faqApi, reparationApi, reviewsApi } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { modeleIphoneSecours } from "@/lib/reparationModeles";
import styles from "./ReparationModele.module.css";

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

function imageModele(slug, espace) {
  const normalise = String(slug || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (normalise.includes("iphone")) {
    const n = normalise.match(/iphone(17|16|15|14|13|12)/)?.[1];
    const suffixe = normalise.includes("promax")
      ? "pro-max"
      : normalise.includes("pro")
        ? "pro"
        : "";
    if (n) return `/images/reparation/models/iphone-${n}${suffixe ? `-${suffixe}` : ""}.jpg`;
  }
  if (espace === "android") return "/images/reparation/devices/android.png";
  if (espace === "pc") return "/images/reparation/devices/computer.png";
  return "/images/categories/smartphone-tablette.jpg";
}

function imagesDetail(slug, espace) {
  if (String(slug).toLowerCase().includes("iphone-15-pro-max") || String(slug).toLowerCase().includes("iphone15promax")) {
    return [1, 2, 3].map((numero) => `/images/reparation/models/iphone-15-pro-max-thumb-${numero}.jpg`);
  }
  return [imageModele(slug, espace)];
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
  const [onglet, setOnglet] = useState("description");
  const [imageActive, setImageActive] = useState(0);
  const [faq, setFaq] = useState([]);
  const [avis, setAvis] = useState([]);

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

  useEffect(() => {
    let annule = false;
    Promise.allSettled([faqApi.getPublished(), reviewsApi.getBySlug(slug)]).then(
      ([faqResultat, avisResultat]) => {
        if (annule) return;
        if (faqResultat.status === "fulfilled") {
          setFaq(faqResultat.value?.faqs || []);
        }
        if (avisResultat.status === "fulfilled") {
          setAvis(avisResultat.value?.reviews || []);
        }
      },
    );
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
    const modeleSecours = espace === "apple" ? modeleIphoneSecours(slug) : null;
    if (modeleSecours) {
      const imageSecours = `/images/reparation/models/${modeleSecours.image}`;
      const messageWhatsapp = encodeURIComponent(`Bonjour MTECHBENIN, je souhaite un diagnostic et un devis pour mon ${modeleSecours.name}.`);
      return (
        <div className={styles.page}>
          <nav className={styles.breadcrumb} aria-label="Fil d’Ariane">
            <Link href="/">Accueil</Link><ChevronRight /><Link href="/reparation">Réparation</Link><ChevronRight /><Link href="/reparation/apple">iPhone</Link><ChevronRight /><span>{modeleSecours.name}</span>
          </nav>
          <section className={styles.product}>
            <div className={styles.gallery}><div className={styles.mainImage}><Image src={imageSecours} alt={modeleSecours.name} fill priority sizes="(max-width: 700px) 80vw, 440px" /></div></div>
            <div className={styles.summary}>
              <p className={styles.eyebrow}>Service de réparation</p>
              <h1>Réparation {modeleSecours.name}</h1>
              <div className={styles.badges}>
                <span><BadgeCheck /> Diagnostic avant réparation</span>
                <span><ShieldCheck /> Garantie 3 jours</span>
                <span><Clock /> Devis personnalisé</span>
              </div>
              <div className={styles.priceBox}><span>Tarif communiqué après diagnostic</span><strong>Sur devis</strong></div>
            </div>
          </section>
          <div className={styles.benefits}>
            <div><Clock /><span>Délai estimé<strong>Après diagnostic</strong></span></div>
            <div><ShieldCheck /><span>Garantie<strong>3 jours</strong></span></div>
            <div><BadgeCheck /><span>Pièce<strong>Confirmée sur devis</strong></span></div>
          </div>
          <div className={styles.tabPanel}>
            <h2>Description du service</h2>
            <p className={styles.description}>Les réparations et les prix de ce modèle ne sont pas encore enregistrés dans le catalogue. Écris-nous sur WhatsApp pour décrire la panne et recevoir un diagnostic et un devis.</p>
          </div>
          <div className={styles.actionBar}>
            <div className={styles.total}><span>Appareil sélectionné</span><strong>{modeleSecours.name}</strong></div>
            <Link className={styles.fallbackQuote} href={`https://wa.me/22961151561?text=${messageWhatsapp}`} target="_blank" rel="noreferrer"><MessageCircle /> Demander un devis <ArrowRight /></Link>
          </div>
        </div>
      );
    }
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

  const photos = imagesDetail(slug, espace);
  const photosDetail = photos.map((src, index) =>
    index === 0 && photos.length > 1
      ? "/images/reparation/models/iphone-15-pro-max-repair.jpg"
      : src,
  );
  const reparationVedette = reparations.find((job) => /écran|ecran/i.test(job.name)) || reparations[0];
  const prixDepart = prixMini(reparationVedette?.options);
  const nomReparation = reparationVedette?.name || "Réparation";
  const faqAffichees = faq
    .filter((item) => /répar|repar|appareil|technicien/i.test(`${item.category || ""} ${item.question || ""}`))
    .slice(0, 6);

  return (
    <div className={styles.page}>
      <nav className={styles.breadcrumb} aria-label="Fil d’Ariane">
        <Link href="/">Accueil</Link><ChevronRight />
        <Link href="/reparation">Réparation</Link><ChevronRight />
        <Link href={`/reparation/${espace}`}>{famille?.name || (espace === "apple" ? "iPhone" : espace)}</Link><ChevronRight />
        <span>{modele?.name}</span>
      </nav>

      <section className={styles.product}>
        <div className={styles.gallery}>
          {photosDetail.length > 1 && (
            <div className={styles.thumbnails}>
              {photosDetail.map((src, index) => (
                <button key={src} className={`${styles.thumbnail} ${imageActive === index ? styles.thumbnailActive : ""}`} onClick={() => setImageActive(index)} aria-label={`Voir la photo ${index + 1}`}>
                  <Image src={src} alt="" fill sizes="72px" />
                </button>
              ))}
            </div>
          )}
          <div className={styles.mainImage}>
            <Image src={photosDetail[imageActive] || photosDetail[0]} alt={modele?.name || "Appareil à réparer"} fill priority sizes="(max-width: 700px) 80vw, 440px" />
          </div>
        </div>

        <div className={styles.summary}>
          <p className={styles.eyebrow}>Service de réparation</p>
          <h1>{nomReparation} {modele?.name}</h1>
          <div className={styles.badges}>
            <span><BadgeCheck /> Pièce de qualité</span>
            <span><ShieldCheck /> Garantie 3 jours</span>
            <span><Clock /> Réparation rapide</span>
          </div>
          {prixDepart > 0 && (
            <div className={styles.priceBox}><span>À partir de</span><strong>{formatPrice(prixDepart)}</strong></div>
          )}
        </div>
      </section>

      <div className={styles.benefits}>
        <div><Clock /><span>Délai estimé<strong>{reparationVedette?.delay || "Selon la réparation"}</strong></span></div>
        <div><ShieldCheck /><span>Garantie<strong>3 jours</strong></span></div>
        <div><BadgeCheck /><span>Pièce<strong>Qualité proposée au choix</strong></span></div>
      </div>

      <div className={styles.tabs} role="tablist" aria-label="Informations réparation">
        {[["description", "Description"], ["faq", "FAQ"], ["avis", "Avis"]].map(([key, label]) => (
          <button key={key} type="button" role="tab" aria-selected={onglet === key} className={onglet === key ? styles.tabActive : ""} onClick={() => setOnglet(key)}>{label}</button>
        ))}
      </div>

      {onglet === "description" && (
        <section className={styles.tabPanel}>
          <h2>Description du service</h2>
          <p className={styles.description}>Choisissez la réparation souhaitée et la qualité de pièce disponible. Le prix est affiché avant votre demande et la réparation est réalisée par nos techniciens.</p>
          <h3 className={styles.repairHeading}>Réparations disponibles</h3>
          {reparations.length === 0 ? (
            <div className={styles.empty}>Aucune réparation disponible pour ce modèle pour le moment.</div>
          ) : (
            <div className={styles.repairList}>
              {reparations.map((job) => {
                const checked = selections[job.id] !== undefined;
                const optionUnique = job.options.length === 1;
                const selectedOptionId = selections[job.id];
                return (
                  <div key={job.id} className={styles.repairCard}>
                    <button onClick={() => toggleReparation(job)} className={styles.repairSelect} aria-pressed={checked}>
                      <span className={`${styles.checkbox} ${checked ? styles.checkboxChecked : ""}`}>{checked && <Check />}</span>
                      <span className={styles.repairText}><strong>{job.name}</strong>{job.delay && <small><Clock /> {job.delay}</small>}</span>
                      <strong className={styles.repairPrice}>{optionUnique ? formatPrice(job.options[0]?.price || 0) : `dès ${formatPrice(prixMini(job.options))}`}</strong>
                    </button>
                    {checked && !optionUnique && <div className={styles.options}>{job.options.map((option) => <button key={option.id} onClick={() => choisirOption(job.id, option.id)} className={selectedOptionId === option.id ? styles.optionSelected : ""}><span>{option.label}</span><strong>{formatPrice(option.price)}</strong></button>)}</div>}
                  </div>
                );
              })}
            </div>
          )}
          <Link href={`/reparation/diagnostic?modele=${encodeURIComponent(slug)}`} className={styles.diagnostic}><Stethoscope /> Pas sûr du problème ? Lancer un diagnostic <ArrowRight /></Link>
        </section>
      )}

      {onglet === "faq" && (
        <section className={styles.tabPanel}>
          <h2>Questions fréquentes</h2>
          {faqAffichees.length ? <div className={styles.faqList}>{faqAffichees.map((item, index) => <details key={item.id || index}><summary>{item.question || item.title || "Question fréquente"}<ChevronRight /></summary><p>{item.answer || item.reponse || item.content}</p></details>)}</div> : <p className={styles.empty}>Aucune question fréquente n’est publiée pour le moment. <Link href="/contact">Contactez notre équipe</Link> pour obtenir de l’aide.</p>}
        </section>
      )}

      {onglet === "avis" && (
        <section className={styles.tabPanel}>
          <h2>Avis clients</h2>
          {avis.length ? <div className={styles.reviewList}>{avis.map((review, index) => <article key={review.id || index}><div className={styles.reviewTop}><strong>{review.customerName || review.name || "Client MTECHBENIN"}</strong><span><Star /> {review.rating || 5}/5</span></div><p>{review.comment || review.content || review.message}</p></article>)}</div> : <p className={styles.empty}>Aucun avis n’a encore été publié pour ce modèle.</p>}
        </section>
      )}

      <Link href="/reparation/conditions" className={styles.conditions}>Consulter les conditions générales de réparation <ArrowRight /></Link>

      <div className={styles.actionBar}>
        <div className={styles.total}><span>Total sélectionné</span><strong>{formatPrice(total)}</strong>{delaiPlusLong && <small><Clock /> {delaiPlusLong}</small>}</div>
        <div className={styles.actions}>
          <button onClick={ouvrirDevis} disabled={!auMoinsUneSelection} className={styles.quote}><MessageCircle /> Demander un devis</button>
          <button onClick={handleCommande} disabled={!auMoinsUneSelection} className={styles.order}>Continuer <ArrowRight /></button>
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
