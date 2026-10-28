import ShopLayout from "@/components/layout/ShopLayout";
import IPhoneCatalogue from "@/components/shop/IPhoneCatalogue";

export const metadata = {
  title: "Tous les iPhone | MTECHBENIN",
  description: "Choisissez votre iPhone, sa capacité et sa couleur sur MTECHBENIN.",
};

export default function IPhoneCataloguePage() {
  return (
    <ShopLayout>
      <IPhoneCatalogue />
    </ShopLayout>
  );
}
