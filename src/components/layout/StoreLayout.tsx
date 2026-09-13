import BannerSlider from "@/components/store/BannerSlider"
import BenefitsSection from "@/components/store/BenefitsSection"
import ShowcaseSection from "@/components/store/ShowcaseSection"
import FeaturesSection from "@/components/store/FeaturesSection"
import FeaturedProductsSection from "@/components/store/FeaturedProductsSection"
import TestimonialsSection from "@/components/store/TestimonialsSection"
import Footer from "@/components/layout/Footer"
import Header from "@/components/layout/Header"
import MobileBottomNav from "@/components/layout/MobileBottomNav"
import ScrollToTop from "@/components/layout/ScrollToTop"

export default function StoreLayout({
  children,
  overlayHeader = false,
}: {
  children: React.ReactNode
  overlayHeader?: boolean
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className={`flex-1 pb-32 ${overlayHeader ? "" : "pt-14 lg:pt-16"}`}>{children}</main>
      <Footer />
      <MobileBottomNav />
      <ScrollToTop />
    </div>
  )
}
