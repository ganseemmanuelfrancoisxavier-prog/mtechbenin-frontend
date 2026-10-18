import ShopLayout from "@/components/layout/ShopLayout";
import CartPage from "@/components/shop/CartPage";

export const metadata = {
  title: "Mon Panier",
};

export default function Panier() {
  return (
    <ShopLayout>
      <CartPage />
    </ShopLayout>
  );
}
