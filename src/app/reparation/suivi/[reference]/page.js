import ShopLayout from "@/components/layout/ShopLayout";
import ReparationSuivi from "@/components/shop/ReparationSuivi";

export const metadata = { title: "Suivi de réparation" };

export default function SuiviReparationPage({ params }) {
  return (
    <ShopLayout>
      <ReparationSuivi reference={params.reference} />
    </ShopLayout>
  );
}
