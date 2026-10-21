import LegalLayout from "@/components/layout/LegalLayout";

const STATIC_CONTENT = `<h2>1. Qu'est-ce qu'un cookie ?</h2><p>Un cookie est un petit fichier texte déposé sur votre appareil lors de votre visite sur notre site. Il permet de mémoriser des informations relatives à votre navigation.</p><h2>2. Cookies utilisés</h2><p>MTECHBENIN utilise uniquement des cookies techniques strictement nécessaires au bon fonctionnement du site :</p><ul><li><strong>Panier d'achat</strong> : mémorise vos articles ajoutés au panier</li><li><strong>Session utilisateur</strong> : maintient votre connexion pendant la navigation</li><li><strong>Préférences</strong> : conserve vos paramètres d'affichage</li></ul><h2>3. Cookies tiers</h2><p>Nous n'utilisons aucun cookie publicitaire, cookie de tracking ou cookie de réseau social tiers. Votre navigation sur MTECHBENIN n'est pas tracée à des fins publicitaires.</p><h2>4. Durée de conservation</h2><p>Les cookies techniques sont conservés pour la durée de votre session de navigation. Ils sont automatiquement supprimés à la fermeture de votre navigateur, à l'exception du cookie de panier qui peut persister 7 jours.</p><h2>5. Gestion des cookies</h2><p>Vous pouvez configurer votre navigateur pour refuser les cookies ou être alerté avant leur dépôt. Cependant, la désactivation des cookies techniques peut affecter le bon fonctionnement du site, notamment le panier d'achat.</p><h2>6. Contact</h2><p>Pour toute question relative à notre politique des cookies, contactez-nous via WhatsApp au <strong>+229 61 15 15 61</strong> ou par email à <strong>contact@mtechbenin.com</strong>.</p>`;

export const metadata = { title: "Politique des Cookies | MTECHBENIN" };

export default async function PolitiqueCookiesPage() {
  let page = null;
  try {
    const apiUrl = process.env.API_SERVER_URL || process.env.NEXT_PUBLIC_API_URL || "https://mtechbenin-backend-xp3i.onrender.com";
    const res = await fetch(`${apiUrl}/api/legal/politique-cookies`, { next: { revalidate: 300 } });
    if (res.ok) { const d = await res.json(); if (d.page?.content) page = d.page; }
  } catch {}

  return (
    <LegalLayout
      title={page?.title || "Politique des Cookies"}
      lastUpdated={page?.updatedAt || null}
      htmlContent={page?.content || STATIC_CONTENT}
    />
  );
}
