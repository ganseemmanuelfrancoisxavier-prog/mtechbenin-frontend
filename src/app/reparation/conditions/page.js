import LegalLayout from "@/components/layout/LegalLayout";

// Texte de repli, servi tant que la page `conditions-reparation` n'existe pas
// dans Panel → Pages légales, ou si l'API ne répond pas.
//
// C'est un PREMIER JET, rédigé à partir des règles de fonctionnement décidées
// avec le propriétaire — pas un texte juridique validé. Il vaut mieux qu'une
// page vide, et il est fait pour être remplacé depuis le panel : dès qu'une
// page portant ce slug existe, elle prend le dessus sans toucher au code.
const STATIC_CONTENT = `
<h2>1. Objet</h2>
<p>Les présentes conditions régissent le service de réparation d'appareils électroniques proposé par MTECHBENIN : téléphones, tablettes et ordinateurs portables. Toute demande de réparation implique leur acceptation.</p>

<h2>2. Prix</h2>
<p>Les prix sont affichés en Francs CFA (FCFA), toutes pièces et main-d'œuvre comprises pour la réparation choisie. Le prix appliqué est celui en vigueur <strong>le jour de la commande</strong>. Un devis obtenu à l'avance est indicatif et reste valable cinq jours ; passé ce délai, ou si les tarifs changent, le prix du jour s'applique.</p>
<p>Lorsqu'une pièce existe en plusieurs qualités, le prix dépend de la qualité choisie.</p>

<h2>3. Paiement</h2>
<p>La réparation est <strong>payée intégralement à la commande</strong>, via la plateforme sécurisée FedaPay (MTN Mobile Money, Moov Money, Celtiis, Visa / MasterCard). Aucune intervention n'est engagée avant confirmation du paiement.</p>

<h2>4. Récupération et restitution de l'appareil</h2>
<p>Après paiement, un livreur vient récupérer l'appareil à l'adresse et au créneau indiqués. <strong>L'enlèvement et la restitution sont inclus dans le prix</strong> de la réparation.</p>
<p>La restitution est convenue directement avec vous par WhatsApp une fois la réparation terminée.</p>
<p>Le service n'est assuré que dans les zones desservies par MTECHBENIN.</p>

<h2>5. Sauvegarde de vos données</h2>
<p>Il vous appartient de <strong>sauvegarder vos données avant de remettre l'appareil</strong>. Certaines réparations imposent une réinitialisation. MTECHBENIN ne peut être tenu responsable de la perte de données, photos, messages ou applications.</p>
<p>Retirez si possible votre carte SIM et votre carte mémoire, et désactivez les verrouillages qui empêcheraient le test de l'appareil après réparation.</p>

<h2>6. État de l'appareil</h2>
<p>À l'arrivée du livreur, l'état de l'appareil est constaté d'un commun accord, par photos échangées sur WhatsApp. Cet échange fait foi en cas de désaccord ultérieur.</p>

<h2>7. Diagnostic</h2>
<p>Si vous ignorez l'origine de la panne, vous pouvez demander un diagnostic en décrivant le problème. <strong>Le diagnostic lui-même est gratuit</strong> ; seuls des frais d'enlèvement peuvent être demandés avant l'envoi du livreur, et ils vous sont annoncés à l'avance.</p>
<p>Ces frais couvrent le déplacement : ils restent acquis et ne sont pas déduits de la réparation qui suivrait. Après analyse, nous vous contactons pour vous proposer la réparation nécessaire et son prix. Vous restez libre de l'accepter ou non.</p>

<h2>8. Appareil irréparable</h2>
<p>Si l'appareil se révèle irréparable, ou si la réparation s'avère impossible dans des conditions raisonnables, la demande est annulée et <strong>vous êtes remboursé, déduction faite des frais de déplacement</strong>. L'appareil vous est restitué en l'état.</p>
<p>Lorsque cela vous a été indiqué au préalable, les frais de diagnostic, de main-d'œuvre ou de pièces déjà engagés restent dus.</p>
<p>Dans le cas où une pièce aurait été commandée spécifiquement pour votre appareil, les conditions applicables à cette commande vous sont précisées avant son achat ou son installation.</p>

<h2>9. Écart entre le devis et la réparation réelle</h2>
<p>Si, l'appareil en main, la réparation nécessaire diffère de celle commandée, nous vous contactons avant toute intervention. Selon le cas, un complément peut être demandé, un remboursement effectué, ou la demande annulée. <strong>Rien n'est engagé sans votre accord.</strong></p>

<h2>10. Délais</h2>
<p>Les délais annoncés par réparation sont indicatifs et courent à compter de la réception de l'appareil dans nos ateliers. Ils peuvent varier selon la disponibilité des pièces. Vous êtes informé de l'avancement à chaque étape par WhatsApp, et pouvez suivre votre demande à tout moment avec sa référence.</p>

<h2>11. Suivi</h2>
<p>Chaque demande reçoit une référence au format <strong>REP-AAAA-XXXXXXXX</strong>. Conservez-la : elle permet de suivre l'avancement de la réparation. Ne la communiquez pas à des tiers.</p>

<h2>12. Garantie</h2>
<p>La réparation effectuée et la pièce remplacée bénéficient d'une garantie commerciale de <strong>trois (3) jours</strong> à compter de la remise de l'appareil. Passé ce délai, la garantie commerciale de la pièce concernée est considérée comme expirée.</p>
<p>La garantie ne couvre notamment pas :</p>
<ul>
  <li>les chutes ou chocs ;</li>
  <li>les fissures ou cassures ;</li>
  <li>le contact avec un liquide ;</li>
  <li>l'oxydation ou la corrosion ;</li>
  <li>la mauvaise utilisation de l'appareil ;</li>
  <li>les dommages accidentels ;</li>
  <li>une intervention ou manipulation effectuée par un tiers ;</li>
  <li>une nouvelle panne sans rapport avec la réparation effectuée ;</li>
  <li>tout dommage survenu après la remise de l'appareil au client.</li>
</ul>
<p>Toute demande de prise en charge sous garantie est soumise à un contrôle de l'appareil par MTECHBENIN afin de déterminer l'origine du problème.</p>

<h2>13. Pièces remplacées</h2>
<p>Les pièces remplacées peuvent, selon les cas, être :</p>
<ul>
  <li>conservées par MTECHBENIN ;</li>
  <li>remises au client sur demande ;</li>
  <li>conservées temporairement pour des besoins de diagnostic, de contrôle ou de garantie.</li>
</ul>
<p>Lorsque le client souhaite récupérer les pièces remplacées, il doit en faire la demande au moment de la réparation ou avant la restitution de l'appareil, lorsque cela est possible.</p>

<h2>14. Appareils non récupérés</h2>
<p>Après la fin de la réparation, le client dispose d'un délai de <strong>30 jours</strong> pour récupérer son appareil.</p>
<p>Après un délai de <strong>90 jours</strong>, l'appareil peut être considéré comme abandonné, sous réserve du droit applicable.</p>
<p>MTECHBENIN ne garantit pas l'état, le bon fonctionnement ou la conservation de l'appareil au-delà du délai de récupération prévu. Les éventuelles détériorations liées à la durée de stockage, aux conditions de conservation, à l'usure naturelle ou à l'évolution d'une panne préexistante ne pourront être imputées à MTECHBENIN.</p>

<h2>15. Limitation de responsabilité</h2>
<p>MTECHBENIN met en œuvre les moyens nécessaires afin d'effectuer les diagnostics et réparations avec soin et professionnalisme.</p>
<p>Toutefois, aucune garantie de résultat ne peut être donnée avant diagnostic lorsqu'un appareil présente des dommages importants, une oxydation avancée, plusieurs défauts ou une panne dont l'origine n'est pas immédiatement identifiable.</p>
<p>La réparation d'un appareil ancien, fortement endommagé ou ayant déjà fait l'objet d'une intervention extérieure peut comporter des risques particuliers. MTECHBENIN informe le client, dans la mesure du possible, des risques identifiés avant toute intervention.</p>

<h2>16. Acceptation des conditions</h2>
<p>Le dépôt de l'appareil, l'acceptation du devis ou le paiement total ou partiel de la réparation vaut acceptation des présentes Conditions générales de réparation.</p>
<p>Le client reconnaît avoir pris connaissance des présentes conditions et les accepter avant ou au moment de la prise en charge de son appareil.</p>
<p>Les présentes conditions s'appliquent à l'ensemble des réparations effectuées par MTECHBENIN, sauf conditions particulières expressément convenues avec le client.</p>

<h2>17. Contact</h2>
<p>Pour toute question relative à une réparation, contactez MTECHBENIN par WhatsApp ou par téléphone au <strong>+229 60 50 63 20</strong>, ou par e-mail à <strong>contact@mtechbenin.com</strong>.</p>
<p>MTECHBENIN — Réparation • Maintenance • Vente d'accessoires — Cotonou, Bénin — mtechbenin.com</p>
`;

export const metadata = {
  title: "Conditions générales de réparation | MTECHBENIN",
  description:
    "Prix, paiement, enlèvement, diagnostic, délais et restitution — les conditions du service de réparation MTECHBENIN.",
};

export default async function ConditionsReparationPage() {
  let page = null;
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const res = await fetch(`${apiUrl}/api/legal/conditions-reparation`, {
      next: { revalidate: 300 },
    });
    if (res.ok) {
      const d = await res.json();
      if (d.page?.content) page = d.page;
    }
  } catch {}

  return (
    <LegalLayout
      title={page?.title || "Conditions générales de réparation"}
      lastUpdated={page?.updatedAt || null}
      htmlContent={page?.content || STATIC_CONTENT}
    />
  );
}
