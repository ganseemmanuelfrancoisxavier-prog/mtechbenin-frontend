import ShopLayout from "@/components/layout/ShopLayout";
import ReparationDiagnostic from "@/components/shop/ReparationDiagnostic";

export const metadata = { title: "Demander un diagnostic" };

export default function DiagnosticPage({ searchParams }) {
  return (
    <ShopLayout>
      <ReparationDiagnostic modeleSlug={searchParams?.modele || ""} />
    </ShopLayout>
  );
}
