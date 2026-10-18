// Interrupteur de maintenance — INDÉPENDANT du backend.
//
// Le garde existant (`MaintenanceGuard`) demande l'état à l'API. Quand c'est
// justement le backend qui est tombé — quota Render dépassé — la question ne
// reçoit aucune réponse : `maintenanceMode` reste à `false`, et la boutique
// continue de s'afficher, d'accepter des mises au panier et d'annoncer des
// paiements qu'aucun serveur ne peut traiter. Un interrupteur qui dépend de ce
// qu'il doit couvrir ne sert à rien le jour où il faut s'en servir.
//
// Celui-ci vit dans le code livré. Il bascule par un commit, sans backend,
// sans base et sans panel : c'est la seule forme qui tienne quand tout le
// reste est tombé.
//
// `NEXT_PUBLIC_MAINTENANCE` permet de le forcer depuis Vercel sans toucher au
// code — « 1 » ferme, « 0 » rouvre. Attention : les variables `NEXT_PUBLIC_*`
// sont inscrites dans le bundle À LA CONSTRUCTION, un changement de valeur
// n'a donc d'effet qu'après un redéploiement.
const FERME_PAR_DEFAUT = false;

export const MAINTENANCE =
  process.env.NEXT_PUBLIC_MAINTENANCE === "0"
    ? false
    : process.env.NEXT_PUBLIC_MAINTENANCE === "1"
      ? true
      : FERME_PAR_DEFAUT;

// Chemins qui restent ouverts pendant la maintenance.
//
// `/admin` en fait partie : c'est de là que l'exploitant travaille, et le lui
// fermer le priverait de son outil au moment précis où il en a besoin. Ses
// écrans dépendent du backend, donc la plupart resteront vides tant qu'il est
// à terre — mais la porte ne doit pas être verrouillée en plus.
export function cheminOuvertPendantMaintenance(pathname) {
  return (
    pathname === "/maintenance" ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api")
  );
}
