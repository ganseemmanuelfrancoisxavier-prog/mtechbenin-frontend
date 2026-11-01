import Link from "next/link";
import { ArrowLeft, ArrowRight, LockKeyhole, Wrench } from "lucide-react";
import styles from "./ReparationAppleChoix.module.css";

const WHATSAPP_DEBLOCAGE = `https://wa.me/22961151561?text=${encodeURIComponent(
  "Bonjour, je souhaite des informations sur le service de déblocage Apple.",
)}`;

export default function ReparationAppleChoix() {
  return (
    <main className={styles.page}>
      <Link href="/reparation" className={styles.back}>
        <ArrowLeft aria-hidden="true" /> Services de réparation
      </Link>

      <header className={styles.heading}>
        <p>Service Apple</p>
        <h1>Que souhaitez-vous faire ?</h1>
        <span>Choisissez le service adapté à votre appareil.</span>
      </header>

      <section className={styles.grid} aria-label="Services Apple">
        <Link href="/reparation/apple/reparation" className={styles.card}>
          <span className={styles.icon}><Wrench aria-hidden="true" /></span>
          <span className={styles.cardTitle}>Réparation</span>
          <span className={styles.description}>Écran, batterie, système, vitre arrière…</span>
          <span className={styles.action}>Choisir un modèle <ArrowRight aria-hidden="true" /></span>
        </Link>

        <a href={WHATSAPP_DEBLOCAGE} target="_blank" rel="noreferrer" className={styles.card}>
          <span className={`${styles.icon} ${styles.iconUnlock}`}><LockKeyhole aria-hidden="true" /></span>
          <span className={styles.cardTitle}>Déblocage</span>
          <span className={styles.description}>Reprogrammation, accompagnement MDM…</span>
          <span className={styles.action}>Nous contacter <ArrowRight aria-hidden="true" /></span>
        </a>
      </section>
    </main>
  );
}
