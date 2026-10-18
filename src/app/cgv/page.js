import LegalLayout from "@/components/layout/LegalLayout";

const STATIC_CONTENT = `<h2>1. Objet</h2><p>Les présentes Conditions Générales de Vente (CGV) régissent les relations contractuelles entre MTECHBENIN et tout client effectuant un achat sur le site mtechbenin.com. Tout achat implique l'acceptation pleine et entière des présentes CGV.</p><h2>2. Produits</h2><p>MTECHBENIN propose à la vente des produits électroniques (écouteurs, enceintes Bluetooth) et des abonnements à des plateformes numériques (Netflix, Spotify, Apple Music, etc.).</p><h2>3. Prix</h2><p>Tous les prix sont affichés en Francs CFA (FCFA) et sont valables jusqu'à modification ou épuisement du stock. Les frais de livraison sont calculés selon votre zone géographique et affichés lors du passage de commande.</p><h2>4. Commande</h2><p>La commande est validée après confirmation du paiement via <strong>FedaPay</strong>. Un numéro de commande au format <strong>MTECH-2026-XXXXX</strong> vous est attribué automatiquement. Vous recevrez une confirmation sur WhatsApp.</p><h2>5. Paiement</h2><p>Le paiement s'effectue intégralement au moment de la commande via la plateforme sécurisée <strong>FedaPay</strong>. Les méthodes acceptées sont :</p><ul><li>MTN Mobile Money</li><li>Moov Money</li><li>Celtiis</li><li>BMO</li><li>Coris Money</li><li>Visa / MasterCard</li></ul><h2>6. Livraison</h2><p>MTECHBENIN assure la livraison à domicile sur Cotonou, Abomey-Calavi et les villes environnantes. La livraison s'effectue à l'adresse GPS fournie lors de la commande.</p><h2>7. Abonnements Digitaux</h2><p>Pour les abonnements numériques, les accès sont envoyés automatiquement par WhatsApp et/ou email dans les 5 minutes suivant la confirmation du paiement. Ces accès sont personnels et ne doivent pas être partagés avec des tiers.</p><h2>8. Droit Applicable</h2><p>Les présentes CGV sont soumises au droit béninois. MTECHBENIN peut être contacté via WhatsApp au <strong>+229 61 15 15 61</strong> ou par email à <strong>contact@mtechbenin.com</strong>.</p>`;

export const metadata = { title: "Conditions Générales de Vente | MTECHBENIN" };

export default async function CGVPage() {
  let page = null;
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const res = await fetch(`${apiUrl}/api/legal/cgv`, { next: { revalidate: 300 } });
    if (res.ok) { const d = await res.json(); if (d.page?.content) page = d.page; }
  } catch {}

  return (
    <LegalLayout
      title={page?.title || "Conditions Générales de Vente"}
      lastUpdated={page?.updatedAt || null}
      htmlContent={page?.content || STATIC_CONTENT}
    />
  );
}
