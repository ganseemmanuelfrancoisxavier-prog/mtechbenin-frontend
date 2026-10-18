import LegalLayout from "@/components/layout/LegalLayout";

export const metadata = { title: "Livraison | MTECHBENIN" };

export default async function LivraisonPage() {
  let page = null;
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const res = await fetch(`${apiUrl}/api/legal/livraison`, { next: { revalidate: 300 } });
    if (res.ok) { const d = await res.json(); if (d.page?.content) page = d.page; }
  } catch {}

  if (page) {
    return (
      <LegalLayout
        title={page.title || "Informations de Livraison"}
        lastUpdated={page.updatedAt || null}
        htmlContent={page.content}
      />
    );
  }

  return (
    <LegalLayout title="Informations de Livraison" lastUpdated="Juin 2026">
      <div className="space-y-8">
        <section>
          <h2>1. Zones de livraison</h2>
          <p>
            MTECHBENIN assure la livraison à domicile dans les villes suivantes
            :
          </p>
          <ul>
            <li>
              <strong>Cotonou</strong> — 1 000 FCFA · Délai : 2 à 4 heures
            </li>
            <li>
              <strong>Abomey-Calavi</strong> — 1 500 FCFA · Délai : 3 à 6 heures
            </li>
            <li>
              <strong>Porto-Novo</strong> — 2 000 FCFA · Délai : 24 heures
            </li>
            <li>
              <strong>Parakou & autres villes</strong> — Sur devis · Délai : 48h
              à 72h
            </li>
          </ul>
        </section>

        <section>
          <h2>2. Localisation GPS</h2>
          <p>
            Pour garantir une livraison précise, nous utilisons votre position
            GPS fournie lors de la commande. Un lien Google Maps est envoyé à
            notre livreur pour qu&apos;il puisse vous localiser facilement.
          </p>
          <p>
            Assurez-vous que votre position GPS est correcte au moment de la
            commande. En cas d&apos;adresse incorrecte, des frais supplémentaires
            peuvent s&apos;appliquer.
          </p>
        </section>

        <section>
          <h2>3. Créneaux de livraison</h2>
          <p>Vous choisissez votre créneau préféré lors de la commande :</p>
          <ul>
            <li>Matin — 8h à 12h</li>
            <li>Après-midi — 12h à 17h</li>
            <li>Soir — 17h à 20h</li>
          </ul>
          <p>
            Nous faisons notre maximum pour respecter le créneau choisi. En cas
            d&apos;imprévu, notre livreur vous contactera directement sur WhatsApp.
          </p>
        </section>

        <section>
          <h2>4. Confirmation et suivi</h2>
          <p>
            Après confirmation du paiement, vous recevrez un message WhatsApp
            avec votre numéro de commande et un lien de suivi. Vous pouvez
            suivre votre commande en temps réel sur{" "}
            <strong>mtechbenin.com/suivi</strong>.
          </p>
        </section>

        <section>
          <h2>5. Livraison cadeau</h2>
          <p>
            Vous pouvez choisir l&apos;option &quot;Offrir à quelqu&apos;un&quot; lors de la
            commande. La livraison sera effectuée directement chez le
            destinataire, et les identifiants de la commande seront envoyés sur
            votre WhatsApp.
          </p>
        </section>

        <section>
          <h2>6. Abonnements digitaux</h2>
          <p>
            Les abonnements numériques (Netflix, Spotify, etc.) ne nécessitent
            pas de livraison physique. Vos accès sont envoyés automatiquement
            par WhatsApp et email dans les <strong>5 minutes</strong> suivant la
            confirmation du paiement, 7j/7.
          </p>
        </section>
      </div>
    </LegalLayout>
  );
}
