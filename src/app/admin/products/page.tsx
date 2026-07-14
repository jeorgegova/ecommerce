"use client"

import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
  main_image?: string | null
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [toggling, setToggling] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase
        .from("products")
        .select("*, categories(name)")
        .order("created_at", { ascending: false })

      const prodIds = (data || []).map((p: any) => p.id)
      let imageMap: Record<string, string> = {}
      if (prodIds.length > 0) {
        const { data: images } = await supabase
          .from("product_images")
          .select("product_id, url")
          .in("product_id", prodIds)
          .eq("is_main", true)
        if (images) {
          for (const img of images) {
            if (!imageMap[img.product_id]) imageMap[img.product_id] = img.url
          }
        }
      }

      setProducts((data || []).map((p: any) => ({ ...p, main_image: imageMap[p.id] || null })))
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
    <div className="mx-auto max-w-7xl">
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

      <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200 max-lg:hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-12 px-2 py-3"></th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Producto</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">SKU</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Categoría</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Precio</th>
              <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Promoción</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Stock</th>
              <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Estado</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filtered.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/admin/products/${product.id}`)}>
                <td className="px-2 py-4">
                  <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-gray-50 overflow-hidden flex items-center justify-center">
                    {product.main_image ? (
                      <img src={product.main_image} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                      <svg className="h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4"><div className="text-sm font-medium text-gray-900">{product.name}</div></td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{product.sku}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{product.categories?.name || "—"}</td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900 font-medium">${Number(product.base_price).toLocaleString("es-CO")}</td>
                <td className="whitespace-nowrap px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    {product.sale_price ? (
                      <>
                        <span className="text-xs text-gray-500">Oferta</span>
                        <button onClick={(e) => { e.stopPropagation(); togglePromotion(product) }} disabled={toggling === product.id}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none motion-reduce:transition-none ${
                            product.promotion_active ? "bg-green-500" : "bg-gray-200"
                          } ${toggling === product.id ? "opacity-50" : ""}`} role="switch" aria-checked={product.promotion_active} title={product.promotion_active ? "Desactivar promoción" : "Activar promoción"}>
                          <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out motion-reduce:transition-none ${
                            product.promotion_active ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                        <span className="text-xs font-medium text-green-600">${Number(product.sale_price).toLocaleString("es-CO")}</span>
                      </>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-500">{product.stock}</td>
                <td className="whitespace-nowrap px-6 py-4 text-center">
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusBadge(product.status)}`}>{product.status}</span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                  <Link href={`/admin/products/${product.id}`} onClick={(e) => e.stopPropagation()} className="font-medium text-gray-900 hover:text-gray-600">Editar</Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="px-6 py-12 text-center text-sm text-gray-500">No se encontraron productos</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:hidden">
        {filtered.map((product) => (
          <div key={product.id} onClick={() => router.push(`/admin/products/${product.id}`)}
            className="rounded-xl border border-gray-200 bg-white transition-colors hover:border-gray-300 active:bg-gray-50 cursor-pointer">
            <div className="aspect-[4/3] bg-gray-50 flex items-center justify-center overflow-hidden">
              {product.main_image ? (
                <img src={product.main_image} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <svg className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
              )}
            </div>
            <div className="p-3">
              <div className="flex items-start justify-between gap-1">
                <span className="text-xs font-semibold text-gray-900 leading-tight line-clamp-2">{product.name}</span>
                <span className={`inline-flex flex-shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium ${statusBadge(product.status)}`}>{product.status}</span>
              </div>
              <p className="mt-0.5 text-[10px] text-gray-400">{product.sku} · {product.categories?.name || "—"}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-xs font-semibold text-gray-900">${Number(product.base_price).toLocaleString("es-CO")}</span>
                {product.sale_price ? (
                  <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-medium ${
                    product.promotion_active ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-500"
                  }`}>
                    <span className={`inline-block h-1 w-1 rounded-full ${product.promotion_active ? "bg-green-500" : "bg-gray-300"}`} />
                    ${Number(product.sale_price).toLocaleString("es-CO")}
                  </span>
                ) : null}
                {product.sale_price && (
                  <span className="flex items-center gap-1 text-[9px] text-gray-500">
                    Oferta
                    <button onClick={(e) => { e.stopPropagation(); togglePromotion(product) }} disabled={toggling === product.id}
                      className={`relative inline-flex h-4 w-7 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        product.promotion_active ? "bg-green-500" : "bg-gray-200"
                      } ${toggling === product.id ? "opacity-50" : ""}`} role="switch" aria-checked={product.promotion_active} title={product.promotion_active ? "Desactivar promoción" : "Activar promoción"}>
                      <span className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        product.promotion_active ? "translate-x-3" : "translate-x-0"}`} />
                    </button>
                  </span>
                )}
                <span className="text-[10px] text-gray-500">
                  Stock: <strong className={product.stock <= 0 ? "text-red-600" : "text-gray-900"}>{product.stock}</strong>
                </span>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center text-sm text-gray-500">No se encontraron productos</div>
        )}
      </div>
    </div>
  )
}
