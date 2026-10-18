// Formate un nombre en prix FCFA
// Exemple : formatPrice(9750) → "9 750 FCFA"
export function formatPrice(amount) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
  }).format(amount);
}

// Calcule le pourcentage de réduction
// Exemple : getDiscount(9750, 14000) → "-30%"
export function getDiscount(price, comparePrice) {
  if (!comparePrice || comparePrice <= price) return null;
  const discount = Math.round(((comparePrice - price) / comparePrice) * 100);
  return `-${discount}%`;
}

// Nomme la durée d'une formule d'abonnement.
//
// Écrit ici parce que la formulation apparaît sur quatre écrans (fiche
// service, panier, panel, recherche) et que l'ajout de « à vie » à chacun
// d'eux séparément garantissait d'en oublier un — l'oubli aurait annoncé
// « 1 mois » à un client qui vient d'acheter un accès définitif.
//
// `duration` arrive en NOMBRE depuis l'API (1, 3, 6) mais en chaîne déjà
// libellée depuis le catalogue statique de repli (« 1 mois »), celui qui
// s'affiche quand le backend est injoignable. Suffixer sans regarder
// produisait « 1 mois mois » à l'écran, précisément le jour où le site est
// déjà dégradé.
export function libelleDuree(formule) {
  if (formule?.aVie) return "À vie";
  if (typeof formule?.duration === "number") return `${formule.duration} mois`;
  return String(formule?.duration || "").trim();
}

// Le « à partir de » d'une carte de service, et l'unité qui l'accompagne.
//
// Les cartes annonçaient `Math.min(prix) /mois` sur toutes les formules
// confondues. Depuis qu'une formule peut être à vie, ce « /mois » promet un
// tarif récurrent qui n'existe pas : un service vendu UNIQUEMENT à vie
// afficherait « Dès 25 000 FCFA /mois » pour un paiement unique.
//
// Tant qu'une formule mensuelle existe, c'est elle qui fixe le prix d'entrée —
// c'est le vrai « à partir de », et « /mois » y est exact. Une formule à vie,
// plus chère, ne remportait de toute façon presque jamais le minimum : le cas
// qui compte est celui où il n'y a QUE des formules à vie.
export function prixDepart(formules) {
  const liste = Array.isArray(formules) ? formules.filter(Boolean) : [];
  if (liste.length === 0) return { prix: null, suffixe: "/mois" };

  const mensuelles = liste.filter((f) => !f.aVie);
  const source = mensuelles.length > 0 ? mensuelles : liste;
  return {
    prix: Math.min(...source.map((f) => Number(f.price) || 0)),
    suffixe: mensuelles.length > 0 ? "/mois" : " à vie",
  };
}
