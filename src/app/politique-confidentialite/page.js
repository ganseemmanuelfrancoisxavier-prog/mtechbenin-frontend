import LegalLayout from "@/components/layout/LegalLayout";

const STATIC_CONTENT = `<h2>1. Collecte des données</h2><p>MTECHBENIN collecte uniquement les données nécessaires au traitement de vos commandes : nom, numéro WhatsApp, email (optionnel) et coordonnées GPS de livraison.</p><p>Ces données sont collectées lors du passage de commande et ne sont jamais vendues ou partagées avec des tiers à des fins commerciales.</p><h2>2. Utilisation des données</h2><p>Vos données sont utilisées exclusivement pour :</p><ul><li>Traiter et livrer vos commandes</li><li>Vous envoyer des notifications de suivi via WhatsApp</li><li>Gérer les abonnements digitaux souscrits</li><li>Améliorer notre service client</li></ul><h2>3. Conservation des données</h2><p>Vos données de commande sont conservées pendant une durée de 2 ans à compter de la date d'achat, conformément aux obligations légales en vigueur au Bénin.</p><h2>4. Sécurité</h2><p>MTECHBENIN met en œuvre toutes les mesures techniques nécessaires pour protéger vos données. Les paiements sont traités par <strong>FedaPay</strong>, une plateforme certifiée et sécurisée. Nous ne stockons jamais vos informations bancaires ou de Mobile Money.</p><h2>5. Cookies</h2><p>Notre site utilise des cookies techniques essentiels au fonctionnement (panier, session). Aucun cookie publicitaire ou de tracking tiers n'est utilisé.</p><h2>6. Vos droits</h2><p>Vous disposez d'un droit d'accès, de rectification et de suppression de vos données personnelles. Pour exercer ces droits, contactez-nous via WhatsApp au <strong>+229 61 15 15 61</strong> ou par email à <strong>contact@mtechbenin.com</strong>.</p>`;

export const metadata = { title: "Politique de Confidentialité | MTECHBENIN" };

export default async function PolitiqueConfidentialitePage() {
  let page = null;
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const res = await fetch(`${apiUrl}/api/legal/politique-confidentialite`, { next: { revalidate: 300 } });
    if (res.ok) { const d = await res.json(); if (d.page?.content) page = d.page; }
  } catch {}

  return (
    <LegalLayout
      title={page?.title || "Politique de Confidentialité"}
      lastUpdated={page?.updatedAt || null}
      htmlContent={page?.content || STATIC_CONTENT}
    />
  );
}
