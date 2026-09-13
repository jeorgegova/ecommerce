import BannerSlider from "@/components/store/BannerSlider"
import BenefitsSection from "@/components/store/BenefitsSection"
import ShowcaseSection from "@/components/store/ShowcaseSection"
import FeaturesSection from "@/components/store/FeaturesSection"
import FeaturedProductsSection from "@/components/store/FeaturedProductsSection"
import TestimonialsSection from "@/components/store/TestimonialsSection"
import StoreLayout from "@/components/layout/StoreLayout"

export default function HomePage() {
  return (
    <StoreLayout overlayHeader>
      <BannerSlider />
      <BenefitsSection />
      <ShowcaseSection />
      <FeaturesSection />
      <FeaturedProductsSection />
      <TestimonialsSection />
    </StoreLayout>
  )
}
