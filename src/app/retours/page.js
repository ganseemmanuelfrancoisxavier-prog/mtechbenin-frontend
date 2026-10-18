import LegalLayout from "@/components/layout/LegalLayout";
import Link from "next/link";

export const metadata = { title: "Retours & Échanges | MTECHBENIN" };

export default async function RetoursPage() {
  let page = null;
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const res = await fetch(`${apiUrl}/api/legal/retours`, { next: { revalidate: 300 } });
    if (res.ok) { const d = await res.json(); if (d.page?.content) page = d.page; }
  } catch {}

  if (page) {
    return (
      <LegalLayout
        title={page.title || "Retours & Échanges"}
        lastUpdated={page.updatedAt || null}
        htmlContent={page.content}
      />
    );
  }

  return (
    <LegalLayout title="Retours & Échanges" lastUpdated="Juin 2026">
      <div className="space-y-8">
        <section>
          <h2>1. Délai de retour</h2>
          <p>
            Vous disposez de <strong>7 jours</strong> à compter de la réception
            de votre commande pour demander un retour ou un échange. Passé ce
            délai, aucun retour ne sera accepté.
          </p>
        </section>

        <section>
          <h2>2. Conditions de retour</h2>
          <p>Pour être accepté, le produit retourné doit être :</p>
          <ul>
            <li>Dans son état d&apos;origine, non utilisé</li>
            <li>Dans son emballage d&apos;origine intact</li>
            <li>Accompagné de tous ses accessoires et documents</li>
            <li>Accompagné du numéro de commande MTECH-2026-XXXXX</li>
          </ul>
          <p>
            Tout produit endommagé, utilisé ou incomplet sera refusé et renvoyé
            au client à ses frais.
          </p>
        </section>

        <section>
          <h2>3. Produits non échangeables</h2>
          <p>
            Pour des raisons d&apos;hygiène et de sécurité, les produits suivants ne
            sont ni repris ni échangés :
          </p>
          <ul>
            <li>Vaporisateurs et produits vapes (ouverts ou utilisés)</li>
            <li>Produits For Woman (ouverts)</li>
            <li>Abonnements digitaux activés</li>
          </ul>
        </section>

        <section>
          <h2>4. Procédure de retour</h2>
          <p>
            Pour initier un retour, contactez-nous <strong>avant</strong> de
            renvoyer le produit :
          </p>
          <ul>
            <li>
              Via WhatsApp au <strong>+229 61 15 15 61</strong> avec votre
              numéro de commande et une photo du produit
            </li>
            <li>
              Par email à <strong>contact@mtechbenin.com</strong>
            </li>
          </ul>
          <p>
            Notre équipe vous confirmera la prise en charge et vous indiquera
            les modalités de retour dans les 24 heures.
          </p>
        </section>

        <section>
          <h2>5. Remboursement</h2>
          <p>
            Après réception et vérification du produit retourné, le
            remboursement est effectué dans un délai de{" "}
            <strong>3 à 5 jours ouvrables</strong> via Mobile Money (MTN ou
            Moov) sur le numéro utilisé lors du paiement.
          </p>
          <p>
            Les frais de livraison initiaux ne sont pas remboursés, sauf en cas
            d&apos;erreur de notre part ou de produit défectueux.
          </p>
        </section>

        <section>
          <h2>6. Produit défectueux</h2>
          <p>
            Si vous recevez un produit défectueux ou non conforme à votre
            commande, contactez-nous immédiatement avec des photos. MTECHBENIN
            prendra en charge l&apos;échange ou le remboursement intégral, frais de
            livraison inclus.
          </p>
        </section>
      </div>
    </LegalLayout>
  );
}
