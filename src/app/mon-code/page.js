import ShopLayout from "@/components/layout/ShopLayout";
import DemandeCodePage from "@/components/shop/DemandeCodePage";

export const metadata = {
  title: "Demander mon code — MTECHBENIN",
  description:
    "Recevez le code de vérification de votre abonnement sur votre WhatsApp.",
};

// Enveloppée comme toutes les autres pages publiques (/contact, /faq, /suivi,
// /panier…). Sans `ShopLayout`, le client atterrit ici sans Navbar, sans
// Footer et sans BottomNav — donc sans aucun moyen de revenir à la boutique,
// alors que cette page lui est justement donnée par mail et par WhatsApp.
export default function Page() {
  return (
    <ShopLayout>
      <DemandeCodePage />
    </ShopLayout>
  );
}
