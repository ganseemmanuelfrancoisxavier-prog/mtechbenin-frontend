import ShopLayout from "@/components/layout/ShopLayout";
import HeroSection from "@/components/shop/HeroSection";
import CategoriesSection from "@/components/shop/CategoriesSection";
import FeaturedProducts from "@/components/shop/FeaturedProducts";
import SubscriptionsSection from "@/components/shop/SubscriptionsSection";
import ClientGallery from "@/components/shop/ClientGallery";
import SocialProofSection from "@/components/shop/SocialProofSection";
import AdvertisingSection from "@/components/shop/AdvertisingSection";
import StatisticsSection from "@/components/shop/StatisticsSection";
import HomeDataBootstrap from "@/components/shop/HomeDataBootstrap";

export default function HomePage() {
  return (
    <ShopLayout>
      <HomeDataBootstrap>
        <HeroSection />
        <CategoriesSection />
        <FeaturedProducts />
        <SubscriptionsSection />
        <AdvertisingSection />
        <StatisticsSection />
        <ClientGallery />
        <SocialProofSection />
      </HomeDataBootstrap>
    </ShopLayout>
  );
}
