import { notFound } from "next/navigation";
import ShopLayout from "@/components/layout/ShopLayout";
import ReparationModele from "@/components/shop/ReparationModele";

// Même garde-fou que l'écran parent : un espace hors de l'énumération
// serveur est une 404, pas un cas que le composant doive gérer.
const ESPACES_VALIDES = ["apple", "android", "pc"];

export default function ReparationModelePage({ params }) {
  const { espace, modele } = params;
  if (!ESPACES_VALIDES.includes(espace)) notFound();

  return (
    <ShopLayout>
      <ReparationModele espace={espace} slug={modele} />
    </ShopLayout>
  );
}
