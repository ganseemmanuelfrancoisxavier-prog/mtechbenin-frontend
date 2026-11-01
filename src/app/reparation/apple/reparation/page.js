import ShopLayout from "@/components/layout/ShopLayout";
import ReparationEspace from "@/components/shop/ReparationEspace";

export const metadata = {
  title: "Réparation Apple | MTECHBENIN",
  description: "Choisissez votre modèle d’iPhone ou d’appareil Apple à réparer.",
};

export default function ReparationAppleModelesPage() {
  return (
    <ShopLayout>
      <ReparationEspace espace="apple" />
    </ShopLayout>
  );
}
