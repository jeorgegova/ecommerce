"use client"

import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { useEffect, useState } from "react"

interface ProductStock {
  id: string; name: string; slug: string; sku: string; stock: number; status: string
  has_variants: boolean; low_stock_threshold: number; stock_bar_max: number
  category_name?: string; sales_count?: number
}

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<ProductStock[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "low" | "out">("all")
  const supabase = createClient()

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase
        .from("products")
        .select("*, categories(name)")
        .order("stock", { ascending: true })

      const mapped = (data || []).map((p: any) => ({
        id: p.id, name: p.name, slug: p.slug, sku: p.sku, stock: Number(p.stock ?? 0),
        status: p.status, has_variants: p.has_variants ?? false,
        low_stock_threshold: Number(p.low_stock_threshold ?? 5),
        stock_bar_max: Number(p.stock_bar_max ?? 20),
        category_name: p.categories?.name,
        sales_count: p.sales_count,
      }))

      setProducts(mapped)
      setLoading(false)
    }
    fetchProducts()
  }, [supabase])

  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= p.low_stock_threshold && !p.has_variants).length
  const outOfStockCount = products.filter((p) => p.stock === 0 && !p.has_variants).length
  const variantCount = products.filter((p) => p.has_variants).length

  const filtered = products.filter((p) => {
    if (p.has_variants) return false
    if (filter === "low") return p.stock > 0 && p.stock <= p.low_stock_threshold
    if (filter === "out") return p.stock === 0
    return true
  })

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="space-y-2">
          <div className="h-7 w-32 rounded bg-gray-200" />
          <div className="h-4 w-48 rounded bg-gray-200" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-gray-200 p-5">
              <div className="h-4 w-16 rounded bg-gray-200" />
              <div className="mt-2 h-7 w-10 rounded bg-gray-200" />
            </div>
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-6 rounded-lg border border-gray-100 p-4">
              <div className="h-4 w-32 rounded bg-gray-200" />
              <div className="h-4 w-20 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">
            {products.length} productos en total · {variantCount} con variantes
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nuevo Producto
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <button
          onClick={() => setFilter("all")}
          className={`rounded-xl border px-5 py-4 text-left transition-colors ${
            filter === "all"
              ? "border-gray-900 bg-gray-50 ring-1 ring-gray-900"
              : "border-gray-200 bg-white hover:border-gray-300"
          }`}
        >
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Total</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{products.length}</p>
        </button>
        <button
          onClick={() => setFilter("low")}
          className={`rounded-xl border px-5 py-4 text-left transition-colors ${
            filter === "low"
              ? "border-amber-400 bg-amber-50 ring-1 ring-amber-400"
              : "border-gray-200 bg-white hover:border-amber-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Stock Bajo</p>
            {lowStockCount > 0 && (
              <span className="inline-flex items-center justify-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                {lowStockCount}
              </span>
            )}
          </div>
          <p className="mt-1 text-2xl font-bold text-amber-600">{lowStockCount}</p>
        </button>
        <button
          onClick={() => setFilter("out")}
          className={`rounded-xl border px-5 py-4 text-left transition-colors ${
            filter === "out"
              ? "border-red-400 bg-red-50 ring-1 ring-red-400"
              : "border-gray-200 bg-white hover:border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Sin Stock</p>
            {outOfStockCount > 0 && (
              <span className="inline-flex items-center justify-center rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-700">
                {outOfStockCount}
              </span>
            )}
          </div>
          <p className="mt-1 text-2xl font-bold text-red-600">{outOfStockCount}</p>
        </button>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <svg className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <p className="mt-3 text-sm font-medium text-gray-900">
              {filter === "all" ? "Sin productos" : filter === "low" ? "Sin productos con stock bajo" : "Sin productos agotados"}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {filter === "all" ? "Creá tu primer producto para empezar." : "¡Buen trabajo! Todos los productos tienen stock suficiente."}
            </p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Producto</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hidden sm:table-cell">Categoría</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Stock</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 hidden sm:table-cell">Ventas</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filtered.map((p) => {
                const isOut = p.stock === 0
                const isLow = p.stock > 0 && p.stock <= p.low_stock_threshold
                const barPct = Math.min(100, (p.stock / p.stock_bar_max) * 100)

                return (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className={`h-2 w-2 flex-shrink-0 rounded-full ${
                          isOut ? "bg-red-400" : isLow ? "bg-amber-400" : "bg-green-400"
                        }`} />
                        <span className="text-sm font-medium text-gray-900">{p.name}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 font-mono">{p.sku}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 hidden sm:table-cell">
                      {p.category_name || "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isOut ? "bg-red-400" : isLow ? "bg-amber-400" : "bg-green-500"
                            }`}
                            style={{ width: `${barPct}%` }}
                          />
                        </div>
                        <span className={`text-sm font-medium tabular-nums ${
                          isOut ? "text-red-600" : isLow ? "text-amber-600" : "text-gray-700"
                        }`}>
                          {p.stock}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-500 hidden sm:table-cell">
                      {p.sales_count ?? 0}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="font-medium text-gray-900 hover:text-gray-600 transition-colors"
                      >
                        Gestionar
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {filtered.length > 0 && (
        <div className="mt-4 flex items-center gap-4 text-[11px] text-gray-400">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-green-400" />
            Stock ok
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            Stock bajo
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-400" />
            Sin stock
          </div>
        </div>
      )}
    </div>
  )
}
