import ShopLayout from "@/components/layout/ShopLayout";
import ProductPage from "@/components/shop/ProductPage";

export default function Produit({ params }) {
  return (
    <ShopLayout>
      <ProductPage key={params.slug} slug={params.slug} />
    </ShopLayout>
  );
}
