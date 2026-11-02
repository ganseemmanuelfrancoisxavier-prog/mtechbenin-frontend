"use client";

import { useEffect, useId, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Search } from "lucide-react";
import { productsApi, reparationApi } from "@/lib/api";
import { MODELES_IPHONE, imageIphone } from "@/lib/reparationModeles";
import { compareIPhoneGeneration } from "@/lib/iphoneProducts";
import styles from "./ReparationEspace.module.css";

const NOMS_ESPACE = { apple: "iPhone", android: "Android", pc: "Mac / PC" };

function normaliserTexte(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function imageModele(modele, espace) {
  const nom = normaliserTexte(`${modele.name} ${modele.slug}`);
  if (espace === "apple") {
    return modele.image || imageIphone(nom);
  }
  if (espace === "android") return "/images/reparation/devices/android.png";
  return "/images/reparation/devices/computer.png";
}

function imageFondEcran(modele) {
  const nom = normaliserTexte(`${modele.name} ${modele.slug}`);
  if (nom.startsWith("iphonexsmax") || nom.startsWith("iphonexr")) {
    return "/images/reparation/wallpapers/iphone-xsmax-xr.webp";
  }
  if (nom === "iphonex") return "/images/reparation/wallpapers/iphone-x.jpg";
  if (nom.startsWith("iphone13")) return "/images/reparation/wallpapers/iphone-13.jpg";
  if (nom.startsWith("iphone15")) return "/images/reparation/wallpapers/iphone-15.jpg";
  if (nom.startsWith("iphone16")) return "/images/reparation/wallpapers/iphone-16.jpg";
  return null;
}

function imageProduitPourModele(modele, produits) {
  const nom = normaliserTexte(modele.name);
  const produit = produits.find((item) => normaliserTexte(item.name) === nom);
  if (!produit) return "";
  let images = produit.images;
  if (typeof images === "string") {
    try { images = JSON.parse(images); } catch { images = []; }
  }
  return produit.image || (Array.isArray(images) ? images[0] : "") || "";
}

const ICONE_COULEURS = [
  ["#45c66b", "#3988f5", "#f3a341", "#eb5a55"],
  ["#50b4e9", "#aa71db", "#f1cf52", "#51c7b2"],
  ["#e76b9a", "#557de7", "#f17b45", "#8176dc"],
  ["#53b96e", "#e6b850", "#ed6862", "#4d9cdf"],
  ["#6883e8", "#57c3bd", "#e88452", "#b273d2"],
];

const FONDS_ECRAN = {
  12: { standard: ["#f9ad4b", "#e94c39", "#304c9a"], pro: ["#d7e5df", "#df7046", "#273c70"] },
  13: { standard: ["#ffd26f", "#ee513e", "#294e9f"], pro: ["#c6d5ec", "#5795dc", "#202e62"] },
  14: { standard: ["#f9bc74", "#e95f70", "#5945bd"], pro: ["#c5e5ef", "#7582ec", "#572d9f"] },
  15: { standard: ["#ffd0a3", "#f47b50", "#d64e82"], pro: ["#e5dfd4", "#c59b80", "#555d72"] },
  16: { standard: ["#f4b8d1", "#d66bc5", "#568cda"], pro: ["#e6d6bd", "#c38a5c", "#3b4b6b"] },
  17: { standard: ["#9ce0ee", "#8b6aec", "#ef7796"], pro: ["#f4b964", "#e66d55", "#454362"] },
};

function EcranTelephone({ nom }) {
  const reactId = useId().replace(/:/g, "");
  const generation = Number(nom.match(/iPhone\s*(\d+)/i)?.[1]) || 13;
  const theme = FONDS_ECRAN[generation] || FONDS_ECRAN[13];
  const couleurs = /\bPro\b/i.test(nom) ? theme.pro : theme.standard;
  const wallpaperId = `iphone-wallpaper-${reactId}`;
  return (
    <span className={styles.phoneIllustration}>
      <svg viewBox="0 0 154 310" role="img" aria-label={`Écran allumé de ${nom}`}>
        <defs>
          <linearGradient id={wallpaperId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={couleurs[0]} />
            <stop offset=".5" stopColor={couleurs[1]} />
            <stop offset="1" stopColor={couleurs[2]} />
          </linearGradient>
        </defs>
        <rect x="8" y="2" width="138" height="306" rx="31" fill="#17181b" stroke="#777980" strokeWidth="2" />
        <rect x="14" y="8" width="126" height="294" rx="26" fill={`url(#${wallpaperId})`} />
        <path d="M16 184c30-31 53-34 77-8s35 24 47 6v94c0 14-11 26-26 26H40c-14 0-24-11-24-25z" fill={couleurs[2]} opacity=".76" />
        <path d="M16 213c26-24 48-22 71 2s34 28 53 4v59c0 14-11 24-26 24H40c-14 0-24-11-24-25z" fill={couleurs[1]} opacity=".7" />
        <rect x="55" y="8" width="44" height="16" rx="9" fill="#111216" />
        <text x="25" y="22" fill="#fff" fontSize="8" fontFamily="Arial, sans-serif" fontWeight="700">9:41</text>
        <g fill="#fff" opacity=".95">
          <rect x="115" y="15" width="3" height="5" rx="1" />
          <rect x="120" y="13" width="3" height="7" rx="1" />
          <rect x="125" y="11" width="3" height="9" rx="1" />
          <rect x="131" y="13" width="6" height="7" rx="1.5" />
        </g>
        {ICONE_COULEURS.map((row, rowIndex) =>
          row.map((couleur, columnIndex) => {
            const x = 25 + columnIndex * 28;
            const y = 43 + rowIndex * 39;
            return (
              <g key={`${rowIndex}-${columnIndex}`}>
                <rect x={x} y={y} width="21" height="21" rx="6" fill={couleur} />
                <circle cx={x + 10.5} cy={y + 10.5} r="5" fill="#fff" opacity=".86" />
                <rect x={x + 8} y={y + 8} width="5" height="5" rx="1.5" fill={couleur} />
              </g>
            );
          }),
        )}
        <rect x="22" y="252" width="110" height="34" rx="16" fill="#ffffff" fillOpacity=".3" />
        {["#45c66b", "#3988f5", "#51c7b2", "#eb5a55"].map((couleur, index) => (
          <g key={couleur}>
            <rect x={28 + index * 26} y="258" width="21" height="21" rx="6" fill={couleur} />
            <circle cx={38.5 + index * 26} cy="268.5" r="5" fill="#fff" opacity=".9" />
          </g>
        ))}
        <rect x="62" y="294" width="42" height="3" rx="2" fill="#fff" opacity=".9" />
      </svg>
    </span>
  );
}

export default function ReparationEspace({ espace }) {
  const espaceApi = espace.toUpperCase();
  const nomEspace = NOMS_ESPACE[espace] || espace;
  const [modeles, setModeles] = useState([]);
  const [query, setQuery] = useState("");
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    let annule = false;
    async function charger() {
      setChargement(true);
      setErreur(null);
      try {
        const { familles = [] } = await reparationApi.familles(espaceApi);
        const groupes = await Promise.all(
          familles.map((famille) => reparationApi.modelesDeFamille(famille.slug)),
        );
        const tousLesModeles = groupes.flatMap((groupe, index) =>
          (groupe.modeles || []).map((modele) => ({
            ...modele,
            family: groupe.famille || familles[index],
          })),
        );
        let visibles =
          espace === "apple"
            ? tousLesModeles.filter((modele) => {
                const nom = normaliserTexte(`${modele.name} ${modele.family?.name}`);
                return nom.includes("iphone");
              })
            : tousLesModeles;
        // L’API contient actuellement des familles Apple, mais aucune fiche
        // iPhone. Afficher les modèles de la maquette permet au client de
        // choisir son appareil en attendant la configuration du catalogue.
        if (espace === "apple" && visibles.length === 0) {
          visibles = MODELES_IPHONE.map((modele) => ({
            ...modele,
            id: modele.slug,
            image: modele.image,
            family: { name: "iPhone" },
            catalogueSecours: true,
          }));
        }
        if (espace === "apple") {
          try {
            const { products = [] } = await productsApi.getAll({ limit: 500 });
            visibles = visibles.map((modele) => ({
              ...modele,
              imagePanel: imageProduitPourModele(modele, products),
            }));
          } catch {
            // Le catalogue d’images du panneau est facultatif pour afficher la liste.
          }
        }
        if (!annule) setModeles(espace === "apple" ? [...visibles].sort(compareIPhoneGeneration) : visibles);
      } catch (err) {
        if (!annule) setErreur(err.message || "Impossible de charger les modèles pour le moment.");
      } finally {
        if (!annule) setChargement(false);
      }
    }
    charger();
    return () => {
      annule = true;
    };
  }, [espace, espaceApi]);

  const modelesFiltres = useMemo(() => {
    const terme = normaliserTexte(query);
    if (!terme) return modeles;
    return modeles.filter((modele) =>
      normaliserTexte(`${modele.name} ${modele.family?.name}`).includes(terme),
    );
  }, [modeles, query]);

  return (
    <div className={`${styles.page} ${espace === "apple" ? styles.applePage : ""}`}>
      <Link href={espace === "apple" ? "/reparation/apple" : "/reparation"} className={styles.back}>
        <ArrowLeft /> {espace === "apple" ? "Choisir un service" : "Réparation"}
      </Link>

      <label className={styles.search}>
        <Search aria-hidden="true" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`Rechercher un modèle (ex : ${espace === "apple" ? "iPhone 15" : nomEspace})`}
          aria-label="Rechercher un modèle"
        />
      </label>

      <div className={styles.heading}>
        <p>Réparation · {nomEspace}</p>
        <h1>{espace === "apple" ? "Choisissez votre iPhone" : "Tous les modèles"}</h1>
      </div>

      {chargement ? (
        <p className={styles.message}>Chargement des modèles…</p>
      ) : erreur ? (
        <p className={styles.message}>{erreur}</p>
      ) : modelesFiltres.length === 0 ? (
        <p className={styles.message}>
          {query ? `Aucun modèle ne correspond à « ${query} ».` : "Aucun modèle disponible pour le moment."}
        </p>
      ) : (
        <div className={styles.grid}>
          {modelesFiltres.map((modele) => (
            <Link
              key={modele.id}
              href={`/reparation/${espace}/${modele.slug}`}
              className={styles.card}
            >
              <span className={styles.imageFrame}>
                {espace === "apple" && (modele.imagePanel || imageFondEcran(modele)) ? (
                  <Image
                    src={modele.imagePanel || imageFondEcran(modele)}
                    alt={`Écran de ${modele.name}`}
                    fill
                    sizes="(max-width: 640px) 45vw, 260px"
                    className={styles.image}
                  />
                ) : espace === "apple" ? (
                  <EcranTelephone nom={modele.name} />
                ) : (
                  <Image
                    src={imageModele(modele, espace)}
                    alt={modele.name}
                    fill
                    sizes="(max-width: 640px) 30vw, (max-width: 1024px) 30vw, 260px"
                    className={styles.image}
                  />
                )}
              </span>
              <span className={styles.cardFooter}>
                <span className={styles.modelName}>{modele.name}</span>
                <span className={styles.family}>{modele.family?.name || nomEspace}</span>
                <span className={styles.arrow} aria-hidden="true"><ArrowRight /></span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
