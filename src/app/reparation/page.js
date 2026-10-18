import ShopLayout from "@/components/layout/ShopLayout";
import ReparationHub from "@/components/shop/ReparationHub";

export const metadata = {
  title: "Réparation d'appareils",
  description:
    "Réparation d'iPhone, de smartphones Androïd et d'ordinateurs portables au Bénin. Prix affiché immédiatement, appareil récupéré chez vous.",
};

export default function Reparation() {
  return (
    <ShopLayout>
      <ReparationHub />
    </ShopLayout>
  );
}
