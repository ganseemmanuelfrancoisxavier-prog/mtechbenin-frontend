import ShopLayout from "@/components/layout/ShopLayout";
import SuiviPage from "@/components/shop/SuiviPage";

export const metadata = {
  title: "Suivi de commande — MTECHBENIN",
  description: "Suivez votre commande en temps réel grâce à votre référence.",
};

export default function SuiviIndex() {
  return (
    <ShopLayout>
      <SuiviPage reference={null} />
    </ShopLayout>
  );
}
