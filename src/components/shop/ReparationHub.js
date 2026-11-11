import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Clock3,
  FileText,
  Headset,
  Settings,
  ShieldCheck,
} from "lucide-react";
import styles from "./ReparationHub.module.css";

const APPAREILS = [
  {
    nom: "Apple",
    detail: "Écran, batterie, Face ID, caméra, carte mère…",
    href: "/reparation/apple",
    image: "/images/reparation/devices/iphone.jpg",
    alt: "Appareils Apple, dont l’iPhone",
  },
  {
    nom: "Android",
    detail: "Écran, batterie, connecteur, caméra, déblocage…",
    href: "/reparation/android",
    image: "/images/reparation/devices/android.png",
    alt: "Réparation d'un téléphone Android",
  },
  {
    nom: "Mac / PC",
    detail: "Diagnostic, nettoyage, système, composants…",
    href: "/reparation/pc",
    image: "/images/reparation/devices/computer.png",
    alt: "Ordinateurs portables et Mac",
  },
  {
    nom: "Tablette",
    detail: "Écran, batterie, connecteur, système…",
    href: "/reparation/apple",
    image: "/images/reparation/devices/tablet.png",
    alt: "Tablette et appareils mobiles",
  },
];

const AVANTAGES = [
  { Icon: ShieldCheck, titre: "Diagnostic gratuit", detail: "Avant toute réparation" },
  { Icon: Clock3, titre: "Service rapide", detail: "48h en moyenne" },
  { Icon: Settings, titre: "Pièces de qualité", detail: "Originales ou premium" },
  { Icon: Headset, titre: "Support client", detail: "Suivi de votre réparation" },
];

export default function ReparationHub() {
  return (
    <div className={styles.page}>
      <section className={styles.devices} aria-labelledby="devices-title">
        <p className={styles.sectionEyebrow}>Nos services</p>
        <h2 id="devices-title">Choisissez votre appareil</h2>
        <div className={styles.deviceGrid}>
          {APPAREILS.map((appareil) => (
            <Link key={appareil.nom} href={appareil.href} className={styles.deviceCard}>
              <div className={styles.devicePicture}>
                <Image
                  src={appareil.image}
                  alt={appareil.alt}
                  fill
                  sizes="(max-width: 640px) 45vw, (max-width: 1024px) 40vw, 260px"
                  className={styles.deviceImage}
                />
              </div>
              <div className={styles.deviceText}>
                <h3>{appareil.nom}</h3>
                <p>{appareil.detail}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.benefits} aria-label="Les avantages de notre service">
        {AVANTAGES.map(({ Icon, titre, detail }) => (
          <div className={styles.benefit} key={titre}>
            <span className={styles.benefitIcon}><Icon /></span>
            <span><strong>{titre}</strong><small>{detail}</small></span>
          </div>
        ))}
      </section>

      <Link href="/reparation/conditions" className={styles.conditions}>
        <Image
          src="/images/reparation/devices/conditions-tools.png"
          alt="Outils professionnels de réparation"
          fill
          sizes="(max-width: 767px) 100vw, 1200px"
          className={styles.conditionsImage}
        />
        <span className={styles.conditionsShade} />
        <span className={styles.conditionsContent}>
          <span className={styles.eyebrow}>À lire avant toute réparation</span>
          <strong>Conditions générales<br />de réparation</strong>
          <span className={styles.conditionsCopy}>
            Découvrez nos conditions, garanties,<br className={styles.desktopBreak} /> délais et responsabilités.
          </span>
          <span className={styles.conditionsButton}>
            <FileText /> Conditions générales de réparation <ArrowRight />
          </span>
        </span>
      </Link>
    </div>
  );
}
