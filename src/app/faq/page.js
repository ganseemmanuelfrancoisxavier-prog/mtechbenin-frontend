import ShopLayout from "@/components/layout/ShopLayout";
import FaqAccordion from "@/components/shop/FaqAccordion";

// FAQ statique en fallback si l'API est indisponible
const STATIC_FAQS = [
  { id: "s1", category: "Commandes", question: "Comment passer une commande ?", answer: "Ajoutez vos produits au panier, puis cliquez sur 'Commander'. Renseignez votre nom, WhatsApp et adresse GPS, choisissez votre créneau et payez via FedaPay (MTN MoMo, Moov Money, Celtiis, Visa/MasterCard). Vous recevrez une confirmation instantanée sur WhatsApp." },
  { id: "s2", category: "Commandes", question: "Comment suivre ma commande ?", answer: "Après paiement, vous recevez un numéro de commande (MTECH-2026-XXXXX). Rendez-vous sur mtechbenin.com/suivi et entrez ce numéro pour voir l'état en temps réel." },
  { id: "s3", category: "Commandes", question: "Puis-je modifier ou annuler ma commande ?", answer: "Vous pouvez annuler ou modifier votre commande dans les 30 minutes suivant le paiement en contactant notre équipe sur WhatsApp. Passé ce délai, la commande est déjà en préparation." },
  { id: "s4", category: "Paiement", question: "Quels modes de paiement acceptez-vous ?", answer: "Nous acceptons MTN Mobile Money, Moov Money, Celtiis, BMO, Coris Money et Visa/MasterCard. Tous les paiements sont sécurisés via la plateforme FedaPay." },
  { id: "s5", category: "Paiement", question: "Le paiement est-il sécurisé ?", answer: "Oui, tous les paiements sont traités par FedaPay, une plateforme certifiée et sécurisée. Nous ne stockons jamais vos informations bancaires ou de Mobile Money." },
  { id: "s6", category: "Livraison", question: "Dans quelles villes livrez-vous ?", answer: "Nous livrons à Cotonou (1 000 FCFA, 2-4h), Abomey-Calavi (1 500 FCFA, 3-6h), Porto-Novo (2 000 FCFA, 24h) et d'autres villes sur devis." },
  { id: "s7", category: "Abonnements Digitaux", question: "Comment reçois-je mes identifiants après achat ?", answer: "Après confirmation du paiement, vous recevez automatiquement vos identifiants (email, mot de passe, profil) par WhatsApp et email en moins de 5 minutes." },
  { id: "s8", category: "Abonnements Digitaux", question: "Que se passe-t-il si Netflix envoie un code de vérification ?", answer: "Vous devez d'abord nous le demander : écrivez « CODE » sur notre WhatsApp, ou saisissez votre numéro sur la page « Demander mon code » du site. Nous transmettons alors sur votre WhatsApp le prochain code reçu pour votre abonnement. Une demande reste valable 15 minutes ; si vous ne recevez rien, refaites-en une." },
  { id: "s9", category: "Retours", question: "Quelle est votre politique de retour ?", answer: "Vous disposez de 7 jours après réception pour demander un retour. Le produit doit être non utilisé et dans son emballage d'origine. Contactez-nous sur WhatsApp avant tout renvoi." },
];

export const metadata = { title: "FAQ | MTECHBENIN" };

export default async function FAQPage() {
  let faqs = null;
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const res = await fetch(`${apiUrl}/api/faq`, { next: { revalidate: 60 } });
    if (res.ok) {
      const data = await res.json();
      if (data.faqs?.length > 0) faqs = data.faqs;
    }
  } catch {}

  return (
    <ShopLayout>
      <FaqAccordion faqs={faqs || STATIC_FAQS} />
    </ShopLayout>
  );
}
