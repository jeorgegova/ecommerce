"use client"

import { useTopProducts } from "@/lib/dashboard/hooks"
import Link from "next/link"

export default function TopProducts() {
  const { data: products, isLoading } = useTopProducts(10)

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="h-5 w-40 rounded bg-gray-200 shimmer-bg mb-4" />
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 rounded-lg bg-gray-100 shimmer-bg" />)}</div>
      </div>
    )
  }

  if (!products || products.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="text-[15px] font-semibold text-gray-900">Más vendidos</h3>
        <p className="mt-3 text-[13px] text-gray-400">Sin datos en este período</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-[15px] font-semibold text-gray-900">Más vendidos</h3>
      <div className="space-y-1">
        {products.slice(0, 5).map((p, i) => (
          <Link key={p.product_id} href={`/admin/products/${p.product_id}`}
            className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-gray-50">
            <span className="w-5 text-center text-[12px] font-bold text-gray-400">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-gray-900 truncate">{p.product_name}</p>
              <div className="mt-0.5 flex items-center gap-2 text-[11px] text-gray-400">
                <span>{p.total_sold} vendidos</span>
                <span>·</span>
                <span className="text-emerald-600">${Number(p.total_revenue).toLocaleString("es-CO")}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
