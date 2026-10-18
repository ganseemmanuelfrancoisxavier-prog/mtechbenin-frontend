import ShopLayout from "@/components/layout/ShopLayout";
import CataloguePage from "@/components/shop/CataloguePage";

export default function CatalogueCategorie({ params }) {
  return (
    <ShopLayout>
      <CataloguePage initialCategory={params.categorie} />
    </ShopLayout>
  );
}
