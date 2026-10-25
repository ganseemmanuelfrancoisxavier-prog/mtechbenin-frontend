import ShopLayout from "@/components/layout/ShopLayout";
import SmartphonePurchaseHub from "@/components/shop/SmartphonePurchaseHub";

export const metadata = {
  title: "Smartphones et appareils | MTECHBENIN",
  description: "Choisissez votre iPhone, Android, ordinateur ou tablette dans le catalogue MTECHBENIN.",
};

export default function SmartphonesPage() {
  return (
    <ShopLayout>
      <SmartphonePurchaseHub />
    </ShopLayout>
  );
}
