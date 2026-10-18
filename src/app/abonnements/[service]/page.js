import ShopLayout from "@/components/layout/ShopLayout";
import AbonnementDetail from "@/components/shop/AbonnementDetail";

export default function AbonnementPage({ params }) {
  return (
    <ShopLayout>
      <AbonnementDetail slug={params.service} />
    </ShopLayout>
  );
}
