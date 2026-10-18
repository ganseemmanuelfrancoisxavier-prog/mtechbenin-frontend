import { notFound } from "next/navigation";
import ShopLayout from "@/components/layout/ShopLayout";
import ReparationEspace from "@/components/shop/ReparationEspace";

// Les espaces sont figés côté serveur (`enum RepairSpace`, voir
// ReparationHub) : une valeur hors de cette liste ne correspond à rien que
// l'API sache interroger. On la rejette ICI, avant tout rendu — un slug
// inventé doit tomber sur une vraie 404, pas sur un catalogue vide qui
// laisserait croire que l'espace existe mais n'a rien dedans.
const ESPACES_VALIDES = ["apple", "android", "pc"];

export default function ReparationEspacePage({ params }) {
  const { espace } = params;
  if (!ESPACES_VALIDES.includes(espace)) notFound();

  return (
    <ShopLayout>
      <ReparationEspace espace={espace} />
    </ShopLayout>
  );
}
