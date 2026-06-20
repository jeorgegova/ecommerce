import Breadcrumb from "@/components/layout/Breadcrumb"
import StoreLayout from "@/components/layout/StoreLayout"

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <StoreLayout>
      <Breadcrumb />
      {children}
    </StoreLayout>
  )
}
