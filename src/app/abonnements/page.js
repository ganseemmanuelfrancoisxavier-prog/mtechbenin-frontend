import ShopLayout from "@/components/layout/ShopLayout";
import AbonnementsHub from "@/components/shop/AbonnementsHub";

export const metadata = {
  title: "Abonnements Digitaux",
  description:
    "Netflix, Spotify, Apple Music, Disney+ et plus — au meilleur prix au Bénin.",
};

export default function Abonnements() {
  return (
    <ShopLayout>
      <AbonnementsHub />
    </ShopLayout>
  );
}
