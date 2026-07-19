"use client"

import Link from "next/link"
import { useLowStock } from "@/lib/dashboard/hooks"
import { getSeverityColor, getSeverityDot, getInitials } from "@/lib/dashboard/utils"

export default function LowStockProducts() {
  const { data: products, isLoading } = useLowStock()

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="h-4 w-36 rounded bg-gray-200 shimmer-bg mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-10 w-10 shrink-0 rounded-lg bg-gray-200 shimmer-bg" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-28 rounded bg-gray-200 shimmer-bg" />
                <div className="h-2.5 w-16 rounded bg-gray-200 shimmer-bg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!products || products.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Productos con bajo stock
        </h3>
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100">
            <svg className="h-3.5 w-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <p className="text-sm font-medium text-emerald-700">Todo en buen stock</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Bajo stock
        </h3>
        <Link
          href="/admin/inventory"
          className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          Actualizar inventario
        </Link>
      </div>
      <div className="space-y-2">
        {products.map((product) => (
          <div
            key={product.product_id}
            className={`flex items-center gap-3 rounded-lg border p-3 transition-all hover:shadow-sm ${getSeverityColor(product.severity)}`}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white text-xs font-medium text-gray-500">
              {product.main_image ? (
                <img
                  src={product.main_image}
                  alt={product.product_name}
                  className="h-full w-full object-cover"
                />
              ) : (
                getInitials(product.product_name)
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${getSeverityDot(product.severity)}`} />
                <p className="text-sm font-medium text-gray-900 truncate">
                  {product.product_name}
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                SKU: {product.sku} · Stock: {product.stock} / {product.low_stock_threshold}
              </p>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/60">
                <div
                  className={`h-full rounded-full transition-all ${
                    product.severity === "critico"
                      ? "bg-red-500"
                      : product.severity === "bajo"
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                  }`}
                  style={{
                    width: `${Math.min((product.stock / product.low_stock_threshold) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
            <Link
              href={`/admin/inventory`}
              className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-900 hover:text-white"
            >
              {product.severity === "critico" ? "Reabastecer" : "Actualizar"}
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
