import { notFound } from "next/navigation";
import LegalLayout from "@/components/layout/LegalLayout";

export const dynamic = "force-dynamic";

function getApiOrigins() {
  const configured = [process.env.API_SERVER_URL, process.env.NEXT_PUBLIC_API_URL];
  const origins = configured.flatMap((value) => {
    if (!value) return [];
    try { return [new URL(value).origin]; } catch { return []; }
  });
  return [...new Set([...origins, "https://mtechbenin-backend-xp3i.onrender.com"])];
}

const CGR_CONTENT = `<h2>Article 1 – Dépôt et état de l’appareil</h2><ol><li>Tout appareil confié à MTECHBENIN fait l’objet d’un enregistrement lors de son dépôt.</li><li>Le client doit signaler tous les défauts connus, les pannes antérieures, les chutes, les contacts avec un liquide et les précédentes interventions.</li><li>Les dommages physiques visibles sont consignés dans la fiche de dépôt.</li><li>MTECHBENIN ne peut être tenue responsable des défauts préexistants non causés par son intervention.</li><li>Le client reconnaît que l’ouverture d’un appareil peut révéler des défauts internes invisibles lors du dépôt.</li></ol>
<h2>Article 2 – Diagnostic et frais</h2><ol><li>Le diagnostic permet d’identifier l’origine probable de la panne.</li><li>Les frais de diagnostic sont communiqués au client avant leur réalisation.</li><li>Le diagnostic ne constitue pas une garantie de réparation.</li><li>En cas de refus du devis après diagnostic, les frais préalablement annoncés et acceptés restent dus.</li><li>Une panne peut présenter plusieurs origines. Le premier diagnostic ne garantit donc pas la détection de tous les défauts.</li></ol>
<h2>Article 3 – Autorisation de réparation</h2><ol><li>Aucune réparation payante ne sera effectuée sans validation préalable du client.</li><li>Le devis accepté constitue une autorisation d’intervention pour les travaux qui y sont mentionnés.</li><li>Toute intervention supplémentaire nécessitant un coût additionnel doit être soumise à l’approbation du client.</li><li>Une fois la commande de pièces spécifiques validée, les frais engagés ne sont pas automatiquement remboursables en cas d’annulation, sous réserve des droits légaux du client.</li></ol>
<h2>Article 4 – Données et informations personnelles</h2><ol><li>Le client est entièrement responsable de la sauvegarde de ses données avant le dépôt.</li><li>MTECHBENIN recommande de sauvegarder les données importantes avant toute intervention.</li><li>MTECHBENIN ne garantit pas la conservation des données en cas de panne préexistante, de défaillance matérielle, de réinitialisation nécessaire ou d’incident technique non imputable à sa faute.</li><li>Le client doit retirer ses cartes SIM, cartes mémoire et objets personnels.</li><li>Les codes de déverrouillage ne doivent être communiqués que lorsqu’ils sont indispensables aux tests et avec l’accord du client.</li><li>MTECHBENIN s’engage à respecter la confidentialité des données auxquelles elle pourrait avoir accès.</li></ol>
<h2>Article 5 – Pièces et composants</h2><ol><li>Les pièces utilisées peuvent être d’origine, compatibles ou reconditionnées selon le devis accepté.</li><li>La nature de la pièce est communiquée au client avant intervention.</li><li>MTECHBENIN ne peut garantir la disponibilité permanente des pièces détachées.</li><li>Les pièces apportées par le client sont installées sous sa responsabilité quant à leur provenance et leur qualité, sans exonérer MTECHBENIN de sa responsabilité concernant la qualité de son intervention.</li><li>Les défauts provenant d’une pièce fournie par le client ne sont pas couverts par la garantie commerciale de MTECHBENIN.</li></ol>
<h2>Article 6 – Délais de réparation</h2><ol><li>Les délais annoncés sont indicatifs, sauf engagement écrit contraire.</li><li>Les retards liés à l’approvisionnement, aux fournisseurs, aux difficultés techniques ou à des circonstances indépendantes de MTECHBENIN ne constituent pas automatiquement une faute.</li><li>Le client sera informé des retards importants lorsque cela est possible.</li><li>MTECHBENIN ne peut être tenue responsable des conséquences indirectes d’un retard qui ne lui est pas imputable.</li></ol>
<h2>Article 7 – Paiement et restitution</h2><ol><li>Le paiement intégral de la prestation est exigible avant la restitution de l’appareil, sauf accord particulier.</li><li>Un acompte peut être demandé avant toute commande de pièces ou intervention spécifique.</li><li>Le client s’engage à régler les prestations qu’il a autorisées et effectivement réalisées.</li><li>En cas de non-paiement, MTECHBENIN se réserve le droit de suspendre la restitution de l’appareil dans les limites autorisées par la législation applicable.</li><li>Aucun appareil ne sera remis à une personne autre que le client ou son représentant dûment autorisé.</li></ol>
<h2>Article 8 – Garantie commerciale de 48 heures</h2><ol><li>MTECHBENIN accorde une garantie commerciale de 48 heures à compter de la date et de l’heure de restitution de l’appareil.</li><li>Cette garantie couvre exclusivement le défaut directement lié à l’intervention réalisée ou à la pièce remplacée, dans les limites de la prestation.</li><li>Le client doit présenter son reçu ou sa facture pour toute demande de prise en charge.</li><li>Toute réclamation fait l’objet d’un contrôle technique.</li><li>La garantie commerciale ne couvre pas les chutes et chocs après restitution, les infiltrations de liquide et l’oxydation, les mauvaises manipulations, les interventions effectuées par un autre réparateur, les nouvelles pannes sans rapport avec la réparation initiale, les défauts préexistants non concernés par l’intervention et les dommages résultant d’une utilisation non conforme de l’appareil.</li><li>Une intervention non autorisée par MTECHBENIN sur la zone réparée peut entraîner la perte de la garantie commerciale sur cette intervention, sous réserve des droits légaux du client.</li><li>La garantie commerciale de 48 heures ne supprime pas les garanties et protections obligatoires prévues par la législation applicable.</li></ol>
<h2>Article 9 – Appareils oxydés, endommagés ou déjà réparés</h2><p>Le client reconnaît que les appareils ayant subi une oxydation, une chute, une surchauffe, un court-circuit ou une réparation antérieure peuvent présenter des risques supplémentaires.</p><ol><li>La réparation peut ne pas aboutir.</li><li>D’autres composants peuvent être défectueux.</li><li>Certaines fonctions peuvent rester indisponibles en raison de dommages préexistants.</li><li>MTECHBENIN peut refuser une intervention lorsqu’elle présente un risque technique disproportionné.</li><li>Le client sera informé des risques identifiés avant de donner son accord.</li></ol>
<h2>Article 10 – Tests et validation</h2><ol><li>MTECHBENIN effectue les tests techniquement possibles après réparation.</li><li>Le client est invité à vérifier le fonctionnement de son appareil lors du retrait.</li><li>Les défauts constatés avant l’intervention ne peuvent être considérés comme des défauts nouvellement causés par la réparation sans examen technique.</li><li>La signature du bon de retrait confirme la réception de l’appareil et les observations faites lors de la restitution. Elle ne vaut pas renonciation aux droits légaux du client.</li></ol>
<h2>Article 11 – Appareils non récupérés</h2><ol><li>Le client est informé lorsque son appareil est prêt.</li><li>Il est invité à le récupérer dans un délai raisonnable.</li><li>En cas de non-récupération prolongée, MTECHBENIN effectue une relance par les coordonnées communiquées lors du dépôt.</li><li>D’éventuels frais de conservation ne peuvent être appliqués que s’ils ont été préalablement communiqués et acceptés.</li><li>MTECHBENIN ne peut vendre, détruire ou s’approprier un appareil abandonné sans respecter les procédures légales applicables.</li></ol>
<h2>Article 12 – Limites de responsabilité</h2><p>MTECHBENIN ne saurait être tenue responsable des pannes préexistantes non causées par son intervention, des défauts internes non détectables lors du diagnostic initial, des pertes de données résultant d’une défaillance non imputable à sa faute, des dommages causés par une utilisation inappropriée après restitution, ni des conséquences d’une intervention réalisée par un tiers après la réparation.</p><p>Toutefois, ces exclusions ne s’appliquent pas aux dommages résultant d’une faute de MTECHBENIN ou aux responsabilités qui ne peuvent légalement être exclues.</p>
<h2>Article 13 – Refus de réparation</h2><p>MTECHBENIN se réserve le droit de refuser une intervention notamment lorsque l’appareil présente un risque technique ou de sécurité, les pièces nécessaires sont indisponibles, le coût de la réparation est disproportionné par rapport à l’état de l’appareil, l’intervention demandée est techniquement impossible ou le client refuse les conditions techniques nécessaires à la réparation.</p><p>Le client sera informé du motif du refus et des éventuels frais préalablement acceptés.</p>
<h2>Article 14 – Réclamations et litiges</h2><p>Toute réclamation doit être adressée à MTECHBENIN avec le justificatif de dépôt ou de paiement.</p><p>MTECHBENIN privilégie une résolution amiable des différends.</p><p>À défaut de règlement amiable, le litige sera soumis aux juridictions compétentes de la République du Bénin.</p>
<h2>Article 15 – Acceptation</h2><p>Le client reconnaît avoir pris connaissance des présentes Conditions Générales de Réparation et les accepter avant validation de sa commande.</p><p>La validation du devis et l’autorisation de réparation constituent l’accord du client sur les prestations demandées.</p>
<p><strong>MTECHBENIN</strong><br>Votre technologie, notre expertise.<br>Site officiel : mtechbenin.com<br>Cotonou – République du Bénin.</p>`;

async function fetchLegalPage(slug) {
  if (slug === "conditions-reparation") {
    return {
      slug,
      title: "Conditions générales de réparation",
      content: CGR_CONTENT,
      updatedAt: "2026-11-28T00:00:00.000Z",
    };
  }

  for (const origin of getApiOrigins()) {
    try {
      const response = await fetch(
        `${origin}/api/legal/${encodeURIComponent(slug)}`,
        { cache: "no-store" },
      );
      if (!response.ok) continue;
      const data = await response.json();
      if (data.page?.content) return data.page;
    } catch {}
  }
  return null;
}


export async function generateMetadata({ params }) {
  const { slug } = await params;
  const page = await fetchLegalPage(slug);
  return { title: page?.title ? `${page.title} | MTECHBENIN` : "Page légale | MTECHBENIN" };
}

export default async function PublicLegalPage({ params }) {
  const { slug } = await params;
  const page = await fetchLegalPage(slug);
  if (!page) notFound();
  return <LegalLayout title={page.title} lastUpdated={page.updatedAt} htmlContent={page.content} />;
}
