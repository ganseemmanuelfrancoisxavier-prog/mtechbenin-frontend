"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Search } from "lucide-react";
import { reparationApi } from "@/lib/api";
import { MODELES_IPHONE, imageIphone } from "@/lib/reparationModeles";
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
    return imageIphone(nom);
  }
  if (espace === "android") return "/images/reparation/devices/android.png";
  return "/images/reparation/devices/computer.png";
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
        if (!annule) setModeles(visibles);
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
    <div className={styles.page}>
      <Link href="/reparation" className={styles.back}>
        <ArrowLeft /> Réparation
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
        <h1>Tous les modèles</h1>
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
                <Image
                  src={imageModele(modele, espace)}
                  alt={modele.name}
                  fill
                  sizes="(max-width: 640px) 30vw, (max-width: 1024px) 30vw, 260px"
                  className={styles.image}
                />
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
