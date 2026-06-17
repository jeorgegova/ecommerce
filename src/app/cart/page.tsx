import StoreLayout from "@/components/layout/StoreLayout"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import CartContent from "./CartContent"

export default async function CartPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login?redirect=/cart")

  return (
    <StoreLayout>
      <CartContent />
    </StoreLayout>
  )
}
