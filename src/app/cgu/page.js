import LegalLayout from "@/components/layout/LegalLayout";

export const metadata = {
  title: "Conditions générales d’utilisation (CGU) | MTECH BENIN",
};

const DEFAULT_CONTENT = `<h2>Article 1 — Objet</h2><p>Les présentes conditions définissent les modalités d’accès et d’utilisation du site MTECH BENIN, de ses produits et de ses services.</p><h2>Article 2 — Accès au site</h2><p>L’accès au site est généralement libre. Certaines fonctionnalités peuvent être interrompues pour maintenance ou pour des raisons techniques.</p><h2>Article 3 — Utilisation</h2><p>L’utilisateur s’engage à fournir des informations exactes et à utiliser le site conformément à la loi. Toute utilisation frauduleuse ou tentative d’accès non autorisé est interdite.</p><h2>Article 4 — Produits et services</h2><p>Les produits et services sont proposés selon leur disponibilité. Les commandes, ventes, réparations et abonnements sont également soumis aux conditions particulières applicables et aux Conditions générales de vente.</p><h2>Article 5 — Propriété intellectuelle</h2><p>Les contenus du site sont protégés. Toute reproduction ou réutilisation nécessite l’autorisation de leurs titulaires.</p><h2>Article 6 — Données personnelles</h2><p>Le traitement des données personnelles est décrit dans la Politique de confidentialité accessible sur le site.</p><h2>Article 7 — Contact</h2><p>Pour toute question concernant ces conditions, contactez MTECH BENIN via les coordonnées indiquées sur le site.</p>`;

export default async function CGUPage() {
  let page = null;
  try {
    const apiUrl = process.env.API_SERVER_URL || process.env.NEXT_PUBLIC_API_URL || "https://mtechbenin-backend-xp3i.onrender.com";
    const res = await fetch(`${apiUrl}/api/legal/cgu`, { next: { revalidate: 60 } });
    if (res.ok) {
      const data = await res.json();
      if (data.page?.content) page = data.page;
    }
  } catch {}

  return (
    <LegalLayout
      title={page?.title || "Conditions générales d’utilisation (CGU)"}
      lastUpdated={page?.updatedAt || null}
      htmlContent={page?.content || DEFAULT_CONTENT}
    />
  );
}
