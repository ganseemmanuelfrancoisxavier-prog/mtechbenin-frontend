import ShopLayout from "@/components/layout/ShopLayout";
import RecherchePage from "@/components/shop/RecherchePage";

export const metadata = { title: "Recherche | MTECHBENIN" };

export default function RecherchePageRoute({ searchParams }) {
  const query = searchParams?.q || "";
  return (
    <ShopLayout>
      <RecherchePage initialQuery={query} />
    </ShopLayout>
  );
}
