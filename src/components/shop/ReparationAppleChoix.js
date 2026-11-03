"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  HelpCircle,
  MessageCircle,
  LockKeyhole,
  Wrench,
} from "lucide-react";
import styles from "./ReparationAppleChoix.module.css";

const DEBLOCAGES = [
  {
    id: "bypass_wifi",
    titre: "Bypass sans réseau",
    detail: "Déblocage iCloud / Activation sans connexion Internet",
    options: [
      { id: "wifi_6_x", nom: "iPhone 6 à iPhone X", prix: "5 000 FCFA" },
      { id: "wifi_xr_17", nom: "iPhone XR à iPhone 17 Pro Max", prix: "10 000 FCFA" },
    ],
  },
  {
    id: "bypass_signal",
    titre: "Bypass avec réseau",
    detail: "Déblocage iCloud (appels, SMS et carte SIM)",
    options: [
      { id: "sig_6_x", nom: "iPhone 6s à iPhone X", prix: "15 000 FCFA" },
      { id: "sig_xr_15", nom: "iPhone XR à iPhone 15 Pro Max", prix: "Sur devis" },
      { id: "sig_16_17", nom: "iPhone 16 à iPhone 17 Pro Max", prix: "Sur devis" },
    ],
  },
  {
    id: "mdm",
    titre: "Gestion MDM",
    detail: "Suppression de la gestion à distance (iPhone, iPad et Mac)",
    options: [
      { id: "mdm_iphone", nom: "iPhone MDM · tous modèles", prix: "8 000 FCFA" },
      { id: "mdm_mac", nom: "MacBook ou iMac MDM", prix: "15 000 FCFA" },
    ],
  },
  {
    id: "esim",
    titre: "eSIM & désimlockage",
    detail: "Déverrouillage opérateur et activation eSIM",
    options: [
      { id: "esim_lock", nom: "Déblocage eSIM", prix: "Sur devis" },
      { id: "other_unlock", nom: "Autre déblocage spécifique", prix: "Sur devis" },
    ],
  },
];

const WHATSAPP = "22961151561";

export default function ReparationAppleChoix() {
  const [etape, setEtape] = useState("choix");
  const [categorieId, setCategorieId] = useState(null);
  const [optionId, setOptionId] = useState(null);
  const [imei, setImei] = useState("");
  const [aideOuverte, setAideOuverte] = useState(false);

  const categorie = useMemo(
    () => DEBLOCAGES.find((item) => item.id === categorieId) || null,
    [categorieId],
  );
  const option = categorie?.options.find((item) => item.id === optionId) || null;
  const imeiValide = imei.trim().length >= 8;

  function choisirCategorie(id) {
    setCategorieId(id);
    setOptionId(null);
    setImei("");
    setAideOuverte(false);
    setEtape("details");
  }

  function retournerAuMenu() {
    setEtape("choix");
    setCategorieId(null);
    setOptionId(null);
    setImei("");
  }

  function demanderLeService() {
    if (!categorie || !option || !imeiValide) return;
    const message = [
      "Bonjour MTECHBENIN, je souhaite un service de déblocage iPhone.",
      `Prestation : ${categorie.titre}`,
      `Modèle : ${option.nom}`,
      `IMEI / numéro de série : ${imei.trim().toUpperCase()}`,
      `Tarif affiché : ${option.prix}`,
    ].join("\n");
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  return (
    <main className={styles.page}>
      {etape === "choix" && (
        <Link href="/reparation" className={styles.back}>
          <ArrowLeft aria-hidden="true" /> Services de réparation
        </Link>
      )}

      {etape === "choix" ? (
        <>
          <header className={styles.heading}>
            <p>Service iPhone</p>
            <h1>Que souhaitez-vous faire&nbsp;?</h1>
            <span>Choisissez le service adapté à votre appareil.</span>
          </header>

          <section className={styles.grid} aria-label="Services iPhone">
            <Link href="/reparation/apple/reparation" className={styles.card}>
              <span className={styles.icon}><Wrench aria-hidden="true" /></span>
              <span className={styles.cardTitle}>Réparation</span>
              <span className={styles.description}>Écran, batterie, système, vitre arrière…</span>
              <span className={styles.action}>Choisir un modèle <ArrowRight aria-hidden="true" /></span>
            </Link>

            <button type="button" onClick={() => setEtape("categories")} className={`${styles.card} ${styles.cardButton}`}>
              <span className={styles.icon}><LockKeyhole aria-hidden="true" /></span>
              <span className={styles.cardTitle}>Déblocage</span>
              <span className={styles.description}>Reprogrammation, accompagnement MDM…</span>
              <span className={styles.action}>Voir les prestations <ArrowRight aria-hidden="true" /></span>
            </button>
          </section>
          <p className={styles.footnote}>Vous ne savez pas quelle option choisir&nbsp;? Nous vous aiderons à identifier le service adapté.</p>
        </>
      ) : (
        <section className={styles.flow}>
          <div className={styles.flowTop}>
            <button type="button" onClick={etape === "details" ? () => setEtape("categories") : retournerAuMenu} className={styles.backButton}>
              <ArrowLeft aria-hidden="true" /> {etape === "details" ? "Changer de prestation" : "Retour au menu iPhone"}
            </button>
            <div className={styles.steps} aria-label={`Étape ${etape === "categories" ? "1" : "2"} sur 2`}>
              <span className={styles.stepActive}>1 <span>Prestation</span></span><i />
              <span className={etape === "details" ? styles.stepActive : ""}>2 <span>Appareil</span></span>
            </div>
          </div>

          {etape === "categories" ? (
            <>
              <header className={styles.flowHeading}>
                <p>Déblocage iPhone</p>
                <h1>Quel service recherchez-vous&nbsp;?</h1>
                <span>Sélectionnez la prestation qui correspond à votre appareil.</span>
              </header>
              <div className={styles.categoryGrid}>
                {DEBLOCAGES.map(({ id, titre, detail }) => (
                  <button type="button" key={id} className={styles.categoryCard} onClick={() => choisirCategorie(id)}>
                    <span className={styles.categoryText}><strong>{titre}</strong><small>{detail}</small></span>
                    <span className={styles.categoryArrow}><ArrowRight aria-hidden="true" /></span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <header className={styles.flowHeading}>
                <p>{categorie?.titre || "Déblocage iPhone"}</p>
                <h1>Précisez votre appareil</h1>
                <span>Choisissez votre modèle, puis renseignez son IMEI ou son numéro de série.</span>
              </header>
              <div className={styles.formCard}>
                <fieldset className={styles.options}>
                  <legend>Modèle ou appareil</legend>
                  {categorie?.options.map((item) => (
                    <label key={item.id} className={`${styles.option} ${optionId === item.id ? styles.optionSelected : ""}`}>
                      <input type="radio" name="unlock-model" value={item.id} checked={optionId === item.id} onChange={() => setOptionId(item.id)} />
                      <span className={styles.radioMark}>{optionId === item.id && <Check aria-hidden="true" />}</span>
                      <span className={styles.optionName}>{item.nom}</span>
                      <strong className={item.prix === "Sur devis" ? styles.quotePrice : ""}>{item.prix}</strong>
                    </label>
                  ))}
                </fieldset>

                <div className={styles.imeiSection}>
                  <div className={styles.labelRow}>
                    <label htmlFor="unlock-imei">IMEI ou numéro de série</label>
                    <button type="button" onClick={() => setAideOuverte((value) => !value)} aria-expanded={aideOuverte}>
                      <HelpCircle aria-hidden="true" /> Où le trouver&nbsp;?
                    </button>
                  </div>
                  <input id="unlock-imei" value={imei} onChange={(event) => setImei(event.target.value)} placeholder="Ex. 356789101112131" autoCapitalize="characters" />
                  {aideOuverte && (
                    <div className={styles.helpBox}>
                      <strong>Sur iPhone ou iPad</strong>
                      <span>Composez <b>*#06#</b> dans Téléphone, ou ouvrez Réglages → Général → Informations.</span>
                    </div>
                  )}
                </div>

                <div className={styles.priceSummary}>
                  <span>Tarif de la prestation</span>
                  <strong>{option?.prix || "Sélectionnez un modèle"}</strong>
                </div>
                <button type="button" className={styles.submit} disabled={!option || !imeiValide} onClick={demanderLeService}>
                  <MessageCircle aria-hidden="true" /> Continuer sur WhatsApp <ArrowRight aria-hidden="true" />
                </button>
                <p className={styles.formNote}>Nous confirmerons la compatibilité et le tarif avant toute intervention.</p>
              </div>
            </>
          )}
        </section>
      )}
    </main>
  );
}
