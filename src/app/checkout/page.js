import ShopLayout from "@/components/layout/ShopLayout";
import CheckoutPage from "@/components/shop/CheckoutPage";

export const metadata = {
  title: "Checkout",
};

export default function Checkout() {
  return (
    <ShopLayout>
      <CheckoutPage />
    </ShopLayout>
  );
}
