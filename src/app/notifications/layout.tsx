import Footer from "@/components/layout/Footer"
import Header from "@/components/layout/Header"
import MobileBottomNav from "@/components/layout/MobileBottomNav"

export default function NotificationsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50/80">
      <Header />
      <main className="flex-1 pb-32">{children}</main>
      <Footer />
      <MobileBottomNav />
    </div>
  )
}
