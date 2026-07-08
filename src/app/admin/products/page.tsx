"use client"

import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { useEffect, useState } from "react"

interface Product {
  id: string
  name: string
  slug: string
  sku: string
  base_price: number
  sale_price: number | null
  promotion_active: boolean
  stock: number
  status: string
  is_featured: boolean
  created_at: string
  categories: { name: string } | null
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [toggling, setToggling] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase
        .from("products")
        .select("*, categories(name)")
        .order("created_at", { ascending: false })

      setProducts(data || [])
      setLoading(false)
    }
    fetchProducts()
  }, [supabase])

  const togglePromotion = async (product: Product) => {
    if (!product.sale_price) return
    setToggling(product.id)

    const { error } = await supabase
      .from("products")
      .update({ promotion_active: !product.promotion_active })
      .eq("id", product.id)

    if (!error) {
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, promotion_active: !p.promotion_active } : p))
      )
    }
    setToggling(null)
  }

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  )

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: "bg-gray-50 text-gray-500",
      active: "bg-green-50 text-green-700",
      inactive: "bg-yellow-50 text-yellow-700",
      discontinued: "bg-red-50 text-red-700",
    }
    return styles[status] || styles.draft
  }

  if (loading) return <p className="text-gray-600">Cargando...</p>

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{products.length} productos</p>
        </div>
        <Link
          href="/admin/products/new"
          className="rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Nuevo Producto
        </Link>
      </div>

      <div className="mt-6">
        <input
          type="text"
          placeholder="Buscar productos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="block w-full max-w-sm rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
        />
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Producto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                SKU
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Categoría
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Precio
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                Promoción
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Stock
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                Estado
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filtered.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{product.name}</div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {product.sku}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {product.categories?.name || "—"}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900 font-medium">
                  ${Number(product.base_price).toLocaleString("es-CO")}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    {product.sale_price ? (
                      <>
                        <button
                          onClick={() => togglePromotion(product)}
                          disabled={toggling === product.id}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none motion-reduce:transition-none ${
                            product.promotion_active ? "bg-green-500" : "bg-gray-200"
                          } ${toggling === product.id ? "opacity-50" : ""}`}
                          role="switch"
                          aria-checked={product.promotion_active}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out motion-reduce:transition-none ${
                              product.promotion_active ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                        <span className="text-xs font-medium text-green-600">
                          ${Number(product.sale_price).toLocaleString("es-CO")}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-500">
                  {product.stock}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-center">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusBadge(product.status)}`}
                  >
                    {product.status}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                  <Link
                    href={`/admin/products/${product.id}`}
                    className="font-medium text-gray-900 hover:text-gray-600"
                  >
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-sm text-gray-500">
                  No se encontraron productos
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
