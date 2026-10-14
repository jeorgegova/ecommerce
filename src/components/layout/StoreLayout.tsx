import BannerSlider from "@/components/store/BannerSlider"
import Footer from "@/components/layout/Footer"
import Header from "@/components/layout/Header"
import MobileBottomNav from "@/components/layout/MobileBottomNav"

export default function StoreLayout({
  children,
  showBanner = true,
}: {
  children: React.ReactNode
  showBanner?: boolean
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      {showBanner && <BannerSlider />}
      <main className="flex-1 pb-32">{children}</main>
      <Footer />
      <MobileBottomNav />
    </div>
  )
}
