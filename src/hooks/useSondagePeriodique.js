"use client";

import { useEffect, useRef } from "react";

/**
 * Rappelle `action` toutes les `intervalleMs`, mais UNIQUEMENT tant que
 * l'onglet est visible.
 *
 * Un `setInterval` nu continue de tourner dans un onglet relégué en arrière-
 * plan. C'est le cas courant du panneau d'administration : on l'ouvre le matin
 * et on l'y laisse. Le tableau de bord interrogeait alors la base toutes les
 * 30 secondes pendant des heures, pour des chiffres que personne ne regardait —
 * et c'est ce qui épuisait le quota d'egress Supabase.
 *
 * Le retour sur l'onglet déclenche un rafraîchissement immédiat : on ne veut
 * pas échanger de l'egress contre des données périmées à l'écran. Mais
 * seulement si l'intervalle est écoulé — sinon un aller-retour rapide entre
 * onglets déclencherait une requête à chaque passage, et cette rafale coûterait
 * plus cher que le sondage qu'on cherche à éviter.
 */
export default function useSondagePeriodique(action, intervalleMs) {
  // L'action est gardée dans une référence pour que le minuteur ne soit pas
  // détruit et recréé à chaque rendu du composant appelant — ce qui, avec une
  // fonction redéfinie à chaque rendu, relancerait un appel sans fin.
  const actionRef = useRef(action);

  // Affectée dans un effet, jamais pendant le rendu : muter une référence en
  // cours de rendu n'est pas sûr avec le rendu concurrent de React.
  useEffect(() => {
    actionRef.current = action;
  });

  // Initialisée à maintenant : les appelants font leur premier chargement au
  // montage, et sans cela un aller-retour immédiat entre onglets le doublerait.
  const dernierAppelRef = useRef(Date.now());

  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    let minuteur = null;

    const executer = () => {
      dernierAppelRef.current = Date.now();
      actionRef.current();
    };

    const arreter = () => {
      if (minuteur) {
        clearInterval(minuteur);
        minuteur = null;
      }
    };
    const demarrer = () => {
      if (!minuteur) minuteur = setInterval(executer, intervalleMs);
    };

    const surChangementDeVisibilite = () => {
      if (document.visibilityState === "visible") {
        if (Date.now() - dernierAppelRef.current >= intervalleMs) executer();
        demarrer();
      } else {
        arreter();
      }
    };

    if (document.visibilityState === "visible") demarrer();
    document.addEventListener("visibilitychange", surChangementDeVisibilite);

    return () => {
      arreter();
      document.removeEventListener("visibilitychange", surChangementDeVisibilite);
    };
  }, [intervalleMs]);
}
