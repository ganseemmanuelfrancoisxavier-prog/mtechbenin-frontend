import { Suspense } from "react";
import ShopLayout from "@/components/layout/ShopLayout";
import ReparationCommande from "@/components/shop/ReparationCommande";

export const metadata = { title: "Demande de réparation" };

// La sélection arrive par la barre d'adresse : `?modele=<slug>&options=<id,id>`.
// Les lire impose `useSearchParams`, qui exige une frontière `Suspense` — sans
// elle, Next bascule toute la page en rendu dynamique au build.
export default function CommandeReparationPage({ searchParams }) {
  return (
    <ShopLayout>
      <Suspense fallback={null}>
        <ReparationCommande
          modeleSlug={searchParams?.modele || ""}
          optionsParam={searchParams?.options || ""}
        />
      </Suspense>
    </ShopLayout>
  );
}
