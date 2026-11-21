import ShopLayout from "@/components/layout/ShopLayout";
import ClientAccountPage from "@/components/shop/ClientAccountPage";

export const metadata = {
  title: "Mon compte client — MTECHBENIN",
  description: "Créez votre compte client et retrouvez vos commandes MTECHBENIN.",
};

export default function Page() {
  return (
    <ShopLayout>
      <ClientAccountPage />
    </ShopLayout>
  );
}
