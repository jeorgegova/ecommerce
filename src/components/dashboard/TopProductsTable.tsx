"use client"

import Link from "next/link"
import { useTopProducts } from "@/lib/dashboard/hooks"
import { formatCompactCurrency, formatNumber, getInitials } from "@/lib/dashboard/utils"

export default function TopProductsTable() {
  const { data: products, isLoading } = useTopProducts(30, 10)

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="h-4 w-40 rounded bg-gray-200 shimmer-bg mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-10 w-10 shrink-0 rounded-lg bg-gray-200 shimmer-bg" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-32 rounded bg-gray-200 shimmer-bg" />
                <div className="h-2.5 w-20 rounded bg-gray-200 shimmer-bg" />
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
          Productos más vendidos
        </h3>
        <p className="text-sm text-gray-400">Sin ventas en el período</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Productos más vendidos
        </h3>
        <Link
          href="/admin/products"
          className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          Ver todos
        </Link>
      </div>
      <div className="overflow-x-auto -mx-5">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-5 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Producto
              </th>
              <th className="px-5 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Categoría
              </th>
              <th className="px-5 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Ventas
              </th>
              <th className="px-5 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Stock
              </th>
              <th className="px-5 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Ingresos
              </th>
              <th className="px-5 py-2 text-right" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {products.slice(0, 5).map((product) => (
              <tr key={product.product_id} className="group transition-colors hover:bg-gray-50">
                <td className="px-5 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100 text-xs font-medium text-gray-500">
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
                    <span className="text-sm font-medium text-gray-900 truncate max-w-[160px]">
                      {product.product_name}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-2.5 text-xs text-gray-500">
                  {product.category_name || "—"}
                </td>
                <td className="px-5 py-2.5 text-right text-sm font-semibold text-gray-900 tabular-nums">
                  {formatNumber(product.total_sold)}
                </td>
                <td className="px-5 py-2.5 text-right">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      product.stock <= 5
                        ? "bg-red-50 text-red-700"
                        : product.stock <= 20
                          ? "bg-amber-50 text-amber-700"
                          : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {product.stock}
                  </span>
                </td>
                <td className="px-5 py-2.5 text-right text-sm font-semibold text-gray-900 tabular-nums">
                  {formatCompactCurrency(product.total_revenue)}
                </td>
                <td className="px-5 py-2.5 text-right">
                  <Link
                    href={`/admin/products/${product.product_id}`}
                    className="text-xs font-medium text-gray-400 opacity-0 transition-all group-hover:opacity-100 hover:text-gray-900"
                  >
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
