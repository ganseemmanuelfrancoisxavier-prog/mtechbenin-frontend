"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Search,
  Wrench,
  X,
} from "lucide-react";
import { reparationApi } from "@/lib/api";

// Libellé affiché pour chaque espace. La liste des espaces eux-mêmes (et le
// garde-fou qui la fige) vit dans ReparationHub / le `page.js` parent — ce
// fichier ne fait que nommer celui qu'on lui donne.
const NOMS_ESPACE = {
  apple: "Apple",
  android: "Androïd",
  pc: "PC portable",
};

export default function ReparationEspace({ espace }) {
  // L'URL porte la forme courte (`apple`), l'API attend l'enum serveur
  // (`APPLE`) — la conversion est purement mécanique, elle ne vaut pas la
  // peine d'être poussée plus haut.
  const espaceApi = espace.toUpperCase();
  const nomEspace = NOMS_ESPACE[espace] || espace;

  const [familles, setFamilles] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  // Accordéon : les modèles d'une famille ne sont chargés qu'à l'ouverture,
  // et gardés en mémoire ensuite pour ne pas refaire la requête si le client
  // replie puis rouvre la même famille.
  const [familleOuverte, setFamilleOuverte] = useState(null);
  const [modelesParFamille, setModelesParFamille] = useState({});
  const [chargementFamille, setChargementFamille] = useState(null);

  const [query, setQuery] = useState("");
  const [resultats, setResultats] = useState([]);
  const [rechercheEnCours, setRechercheEnCours] = useState(false);

  useEffect(() => {
    let annule = false;
    async function charger() {
      setChargement(true);
      setErreur(null);
      try {
        const data = await reparationApi.familles(espaceApi);
        if (!annule) setFamilles(data.familles || []);
      } catch {
        if (!annule) setErreur("Impossible de charger le catalogue pour le moment.");
      } finally {
        if (!annule) setChargement(false);
      }
    }
    charger();
    return () => {
      annule = true;
    };
  }, [espaceApi]);

  // Recherche bornée à l'espace, dès deux caractères. Ne pas l'étendre
  // au-delà : le client a déjà choisi son appareil en arrivant sur cet écran.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResultats([]);
      setRechercheEnCours(false);
      return;
    }
    setRechercheEnCours(true);
    const t = setTimeout(async () => {
      try {
        const data = await reparationApi.recherche(espaceApi, q);
        setResultats(data.modeles || []);
      } catch {
        setResultats([]);
      } finally {
        setRechercheEnCours(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query, espaceApi]);

  const toggleFamille = useCallback(
    (slug) => {
      setFamilleOuverte((actuelle) => (actuelle === slug ? null : slug));
      if (!modelesParFamille[slug]) {
        setChargementFamille(slug);
        reparationApi
          .modelesDeFamille(slug)
          .then((data) => {
            setModelesParFamille((m) => ({ ...m, [slug]: data.modeles || [] }));
          })
          .catch(() => {
            setModelesParFamille((m) => ({ ...m, [slug]: [] }));
          })
          .finally(() => setChargementFamille((c) => (c === slug ? null : c)));
      }
    },
    [modelesParFamille],
  );

  const enRecherche = query.trim().length >= 2;

  return (
    <div className="max-w-3xl mx-auto px-5 py-10">
      <Link
        href="/reparation"
        className="inline-flex items-center gap-1.5 text-apple-mid hover:text-apple-black text-[13px] font-medium mb-6 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Réparation
      </Link>

      <div className="mb-6">
        <p className="text-[11px] font-semibold text-apple-mid uppercase tracking-widest mb-1">
          Réparation
        </p>
        <h1 className="font-display font-black text-3xl md:text-4xl text-apple-black tracking-tight">
          {nomEspace}
        </h1>
      </div>

      {/* Recherche — bornée à l'espace courant */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-apple-mid" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Rechercher un modèle ${nomEspace}...`}
          className="w-full bg-black/[0.03] border border-black/10 rounded-2xl pl-11 pr-11 py-3.5 text-[14px] focus:outline-none focus:border-black/20 transition"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-apple-mid hover:text-apple-black transition"
            aria-label="Effacer la recherche"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {enRecherche ? (
        // ── Résultats de recherche — remplacent la liste des familles tant
        // qu'une requête est active, plutôt que de s'empiler dessus.
        <div className="space-y-2">
          {rechercheEnCours ? (
            <p className="text-apple-mid text-[13px] text-center py-10">Recherche...</p>
          ) : resultats.length === 0 ? (
            <p className="text-apple-mid text-[13px] text-center py-10">
              Aucun modèle ne correspond à « {query.trim()} ».
            </p>
          ) : (
            resultats.map((m) => (
              <Link
                key={m.id}
                href={`/reparation/${espace}/${m.slug}`}
                className="glass-card rounded-2xl px-4 py-3.5 flex items-center justify-between hover:opacity-80 transition"
              >
                <div>
                  <p className="font-semibold text-apple-black text-[14px]">{m.name}</p>
                  <p className="text-apple-mid text-[12px]">{m.family?.name}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-apple-mid flex-shrink-0" />
              </Link>
            ))
          )}
        </div>
      ) : chargement ? (
        <p className="text-apple-mid text-[13px] text-center py-14">
          Chargement du catalogue...
        </p>
      ) : erreur ? (
        <p className="text-apple-mid text-[13px] text-center py-14">{erreur}</p>
      ) : familles.length === 0 ? (
        // État actuel en production : le catalogue n'a pas encore été rempli
        // par l'administrateur. Le dire clairement vaut mieux qu'un écran vide.
        <div className="glass-card rounded-3xl p-8 text-center">
          <Wrench className="w-8 h-8 text-apple-mid/30 mx-auto mb-3" strokeWidth={1.4} />
          <p className="text-apple-mid text-[13px]">
            Aucun modèle enregistré pour cet espace pour le moment.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {familles.map((f) => {
            const ouverte = familleOuverte === f.slug;
            const modeles = modelesParFamille[f.slug];
            return (
              <div key={f.id} className="glass-card rounded-3xl overflow-hidden">
                <button
                  onClick={() => toggleFamille(f.slug)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                >
                  <span className="font-semibold text-apple-black text-[14px]">
                    {f.name}
                  </span>
                  {ouverte ? (
                    <ChevronUp className="w-4 h-4 text-apple-mid flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-apple-mid flex-shrink-0" />
                  )}
                </button>
                {ouverte && (
                  <div className="px-3 pb-3 border-t border-black/[0.05]">
                    {chargementFamille === f.slug ? (
                      <p className="text-apple-mid text-[12px] py-4 text-center">
                        Chargement...
                      </p>
                    ) : modeles?.length === 0 ? (
                      <p className="text-apple-mid text-[12px] py-4 text-center">
                        Aucun modèle enregistré dans cette famille.
                      </p>
                    ) : (
                      <div className="pt-2 space-y-1">
                        {modeles?.map((m) => (
                          <Link
                            key={m.id}
                            href={`/reparation/${espace}/${m.slug}`}
                            className="flex items-center justify-between px-3 py-3 rounded-2xl hover:bg-black/[0.03] transition"
                          >
                            <span className="text-[13px] text-apple-black">{m.name}</span>
                            <ChevronRight className="w-3.5 h-3.5 text-apple-mid/50 flex-shrink-0" />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
