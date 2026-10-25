import Image from "next/image";
import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";
import HeroSection from "@/components/shop/HeroSection";
import styles from "./SmartphonePurchaseHub.module.css";

const DEVICES = [
  {
    title: "iPhone",
    description: "Derniers modèles, accessoires, et plus encore.",
    image: "/images/reparation/apple.jpg",
    query: "iPhone",
  },
  {
    title: "Android",
    description: "Samsung, Xiaomi, Oppo, Tecno, etc.",
    image: "/images/reparation/android.jpg",
    query: "Samsung",
  },
  {
    title: "Mac / PC",
    description: "Mac, PC, composants, accessoires…",
    image: "/images/reparation/pc.jpg",
    query: "ordinateur",
  },
  {
    title: "Tablette",
    description: "iPad, Samsung, Xiaomi, accessoires et plus…",
    image: "/images/categories/smartphone-tablette.jpg",
    query: "tablette",
  },
];

export default function SmartphonePurchaseHub() {
  return (
    <div className={styles.page}>
      <HeroSection />

      <section className={styles.catalogue} aria-labelledby="device-heading">
        <p className={styles.eyebrow}>Nos produits</p>
        <h1 className={styles.heading} id="device-heading">
          Choisissez votre appareil
        </h1>

        <div className={styles.grid}>
          {DEVICES.map((device) => (
            <Link
              className={styles.deviceCard}
              href={`/recherche?q=${encodeURIComponent(device.query)}`}
              key={device.title}
            >
              <span className={styles.deviceImage}>
                <Image
                  src={device.image}
                  alt={device.title}
                  fill
                  sizes="(max-width: 640px) 42vw, 220px"
                  className={styles.image}
                />
              </span>
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
