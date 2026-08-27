import CouponForm from "@/components/admin/CouponForm"
import Link from "next/link"

export default function NewCouponPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center gap-2 text-sm">
        <Link href="/admin/coupons" className="text-gray-500 hover:text-gray-700">Cupones</Link>
        <span className="text-gray-300">/</span>
        <span className="font-medium text-gray-900">Nuevo</span>
      </div>
      <h1 className="mt-3 text-2xl font-bold text-gray-900">Nuevo cupón</h1>
      <p className="mt-1 text-sm text-gray-500">Parametriza código, tipo, valor y vigencia.</p>
      <CouponForm />
    </div>
  )
}
