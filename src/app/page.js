import ShopLayout from "@/components/layout/ShopLayout";
import HeroSection from "@/components/shop/HeroSection";
import CategoriesSection from "@/components/shop/CategoriesSection";
import FeaturedProducts from "@/components/shop/FeaturedProducts";
import SubscriptionsSection from "@/components/shop/SubscriptionsSection";
import ClientGallery from "@/components/shop/ClientGallery";
import SocialProofSection from "@/components/shop/SocialProofSection";
import AdvertisingSection from "@/components/shop/AdvertisingSection";
import StatisticsSection from "@/components/shop/StatisticsSection";

export default function HomePage() {
  return (
    <ShopLayout>
      <HeroSection />
      <CategoriesSection />
      <FeaturedProducts />
      <SubscriptionsSection />
      <AdvertisingSection />
      <StatisticsSection />
      <ClientGallery />
      <SocialProofSection />
    </ShopLayout>
  );
}
