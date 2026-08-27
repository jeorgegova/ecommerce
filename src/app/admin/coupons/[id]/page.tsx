import CouponForm from "@/components/admin/CouponForm"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"

export default async function EditCouponPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data, error } = await supabase.from("coupons").select("*").eq("id", id).single()
  if (error || !data) notFound()

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center gap-2 text-sm">
        <Link href="/admin/coupons" className="text-gray-500 hover:text-gray-700">Cupones</Link>
        <span className="text-gray-300">/</span>
        <span className="font-medium text-gray-900">Editar {data.code}</span>
      </div>
      <h1 className="mt-3 text-2xl font-bold text-gray-900">Editar cupón</h1>
      <CouponForm coupon={data as any} />
    </div>
  )
}
