"use client"

import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { useEffect, useState } from "react"

interface ProductStock {
  id: string; name: string; slug: string; sku: string; stock: number; status: string; has_variants: boolean
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
        id: p.id, name: p.name, slug: p.slug, sku: p.sku, stock: p.stock,
        status: p.status, has_variants: p.has_variants, category_name: p.categories?.name,
        sales_count: p.sales_count,
      }))

      setProducts(mapped)
      setLoading(false)
    }
    fetchProducts()
  }, [supabase])

  const filtered = products.filter((p) => {
    if (filter === "low") return p.stock > 0 && p.stock <= 5 && !p.has_variants
    if (filter === "out") return p.stock === 0 && !p.has_variants
    return true
  })

  const stockColor = (stock: number, hasVariants: boolean) => {
    if (hasVariants) return "text-gray-500"
    if (stock === 0) return "text-red-600 font-semibold"
    if (stock <= 5) return "text-yellow-600 font-semibold"
    return "text-green-600"
  }

  if (loading) return <p className="text-gray-600">Cargando...</p>

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventario</h1>
          <p className="mt-1 text-sm text-gray-600">{products.length} productos</p>
        </div>
        <div className="flex gap-2">
          {(["all", "low", "out"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${filter === f ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
              {f === "all" ? "Todos" : f === "low" ? "Stock Bajo" : "Sin Stock"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Producto</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">SKU</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Categoría</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Stock</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Ventas</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{p.name}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{p.sku}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{p.category_name || "—"}</td>
                <td className={`whitespace-nowrap px-6 py-4 text-right text-sm ${stockColor(p.stock, p.has_variants)}`}>
                  {p.has_variants ? "Variantes" : p.stock}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-500">{p.sales_count}</td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                  <Link href={`/admin/products/${p.id}`} className="font-medium text-gray-900 hover:text-gray-600">Gestionar</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
