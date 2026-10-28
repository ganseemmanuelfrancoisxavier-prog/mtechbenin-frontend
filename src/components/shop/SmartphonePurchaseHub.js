"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  Clock3,
  FileText,
  Headset,
  Settings,
  ShieldCheck,
  Truck,
} from "lucide-react";
import styles from "./SmartphonePurchaseHub.module.css";
import smartphonePosterImage from "./smartphonePosterImage";
import { settingsApi } from "@/lib/api";

const DEVICES = [
  {
    title: "iPhone",
    description: "Derniers modèles, accessoires, et plus encore.",
    image: "/images/reparation/devices/iphone.jpg",
    query: "iPhone",
  },
  {
    title: "Android",
    description: "Samsung, Xiaomi, Oppo, Tecno, etc.",
    image: "/images/reparation/devices/android.png",
    query: "Samsung",
  },
  {
    title: "Mac / PC",
    description: "Mac, PC, composants, accessoires…",
    image: "/images/reparation/devices/computer.png",
    query: "ordinateur",
  },
  {
    title: "Tablette",
    description: "iPad, Samsung, Xiaomi, accessoires et plus…",
    image: "/images/reparation/devices/tablet.png",
    query: "tablette",
  },
];

const BENEFITS = [
  { Icon: ShieldCheck, title: "Diagnostic gratuit", detail: "Avant toute réparation" },
  { Icon: Clock3, title: "Service rapide", detail: "48h en moyenne" },
  { Icon: Settings, title: "Pièces de qualité", detail: "Originales ou premium" },
  { Icon: Headset, title: "Support client", detail: "Suivi de votre réparation" },
];

export default function SmartphonePurchaseHub() {
  const [devices, setDevices] = useState(DEVICES);

  useEffect(() => {
    settingsApi.getPublic().then(({ settings }) => {
      if (!settings?.smartphoneHubDevices) return;
      try {
        const configuredDevices = JSON.parse(settings.smartphoneHubDevices);
        if (Array.isArray(configuredDevices)) {
          setDevices(configuredDevices.filter((device) => device.active !== false));
        }
      } catch (error) {
        console.error("Impossible de lire les appareils de la boutique", error);
      }
    }).catch((error) => {
      console.error("Impossible de charger les appareils de la boutique", error);
    });
  }, []);

  return (
    <div className={styles.page}>
      <section className={styles.hero} aria-label="Offres smartphones">
        <div className={styles.heroText}>
          <p className={styles.heroEyebrow}>Saison de vente</p>
          <h1>Smartphones<br />au meilleur prix</h1>
          <p className={styles.heroDescription}>
            iPhone, Samsung, Xiaomi et bien plus.<br className={styles.desktopBreak} />
            Qualité garantie et livraison rapide.
          </p>
          <Link href="/catalogue/smartphone-tablette" className={styles.heroCta}>
            Voir les offres <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
        <div className={styles.heroProduct} aria-hidden="true">
          <div
            className={styles.heroPoster}
            style={{ backgroundImage: `url("${smartphonePosterImage}")` }}
          />
        </div>
        <div className={styles.heroBenefits}>
          <span><Award aria-hidden="true" />Produits originaux</span>
          <span><Truck aria-hidden="true" />Livraison rapide</span>
          <span><ShieldCheck aria-hidden="true" />Garantie incluse</span>
        </div>
      </section>

      <section className={styles.catalogue} aria-labelledby="device-heading">
        <p className={styles.eyebrow}>Nos produits</p>
        <h2 className={styles.heading} id="device-heading">
          Choisissez votre appareil
        </h2>

        <div className={styles.grid}>
          {devices.map((device) => (
            <Link
              className={styles.deviceCard}
              href={device.href || (device.title?.toLowerCase() === "iphone"
                ? "/smartphones/iphone"
                : `/recherche?q=${encodeURIComponent(device.title)}`)}
              key={device.id || device.title}
            >
              {device.image ? (
                <span className={styles.deviceImage}>
                  <img src={device.image} alt={device.title} className={styles.image} />
                </span>
              ) : <span className={styles.deviceImage} aria-hidden="true" />}
              <span className={styles.deviceInfo}>
                <span className={styles.deviceTitle}>{device.title}</span>
                <span className={styles.deviceDescription}>
                  {device.description}
                </span>
              </span>
              <span className={styles.arrow} aria-hidden="true">
                <ArrowRight size={21} strokeWidth={2} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.benefits} aria-label="Nos engagements">
        {BENEFITS.map(({ Icon, title, detail }) => (
          <div className={styles.benefit} key={title}>
            <span className={styles.benefitIcon} aria-hidden="true">
              <Icon />
            </span>
            <span className={styles.benefitText}>
              <strong>{title}</strong>
              <small>{detail}</small>
            </span>
          </div>
        ))}
      </section>

      <section className={styles.terms} aria-labelledby="terms-heading">
        <div className={styles.termsCopy}>
          <p className={styles.termsEyebrow}>Avant votre achat</p>
          <h2 id="terms-heading">Conditions générales de vente</h2>
          <p>Consultez les modalités de commande, paiement et livraison.</p>
          <Link href="/cgv" className={styles.termsLink}>
            <FileText size={20} aria-hidden="true" />
            Lire les conditions générales de vente
            <ArrowRight size={19} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}
