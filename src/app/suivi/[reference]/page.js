import ShopLayout from "@/components/layout/ShopLayout";
import SuiviPage from "@/components/shop/SuiviPage";

export const metadata = {
  title: "Suivi de commande",
};

export default function Suivi({ params }) {
  return (
    <ShopLayout>
      <SuiviPage reference={params.reference} />
    </ShopLayout>
  );
}
