import RecentlyViewed from "@/components/store/RecentlyViewed"
import StoreLayout from "@/components/layout/StoreLayout"
import { createClient } from "@/lib/supabase/server"
import Image from "next/image"
import Link from "next/link"

export default async function HomePage() {
  const supabase = await createClient()

  const [productsRes, categoriesRes, totalRes, stockRes, saleRes, newRes] = await Promise.all([
    supabase.from("product_listing").select("*").order("created_at", { ascending: false }).limit(20),
    supabase.from("categories").select("*").eq("is_active", true).order("sort_order", { ascending: true }).order("name", { ascending: true }),
    supabase.from("products").select("id, category_id, base_price", { count: "exact", head: false }).eq("status", "active"),
    supabase.from("products").select("id", { count: "exact", head: false }).eq("status", "active").gt("stock", 0),
    supabase.from("products").select("id", { count: "exact", head: false }).eq("status", "active").not("sale_price", "is", null),
    supabase.from("products").select("id", { count: "exact", head: false }).eq("status", "active").gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
  ])

  const products = productsRes.data || []
  const categories = categoriesRes.data || []
  const allProducts = totalRes.data || []
  const totalCount = totalRes.count || 0
  const stockCount = stockRes.count || 0
  const saleCount = saleRes.count || 0
  const newCount = newRes.count || 0

  const categoryCounts: Record<string, number> = {}
  for (const p of allProducts) {
    categoryCounts[p.category_id] = (categoryCounts[p.category_id] || 0) + 1
  }

  const lowPrice = allProducts.filter((p) => p.base_price < 50000).length
  const midPrice = allProducts.filter((p) => p.base_price >= 50000 && p.base_price <= 100000).length
  const highPrice = allProducts.filter((p) => p.base_price > 100000 && p.base_price <= 500000).length
  const topPrice = allProducts.filter((p) => p.base_price > 500000).length

  const roots = categories.filter((c) => !c.parent_id)
  const getChildren = (parentId: string) => categories.filter((c) => c.parent_id === parentId)

  const countIncludingChildren = (catId: string): number => {
    const children = getChildren(catId)
    const childSum = children.reduce((sum, c) => sum + countIncludingChildren(c.id), 0)
    return (categoryCounts[catId] || 0) + childSum
  }

  return (
    <StoreLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex gap-6">
          <aside className="hidden w-56 flex-shrink-0 xl:block">
            <div className="sticky top-24 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Categorías</h3>
                <div className="mt-3 space-y-1">
                  <Link href="/products" className="group flex items-center justify-between rounded-lg px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                    <span>Todos los productos</span>
                    <span className="text-xs text-gray-400 group-hover:text-gray-600">{totalCount}</span>
                  </Link>
                  {roots.map((cat) => {
                    const children = getChildren(cat.id)
                    const catCount = countIncludingChildren(cat.id)
                    return (
                      <div key={cat.id}>
                        <Link href={`/categories/${cat.slug}`} className="group flex items-center justify-between rounded-lg px-3 py-1.5 text-sm font-medium text-gray-900 hover:bg-gray-100">
                          <span>{cat.name}</span>
                          {catCount > 0 && <span className="text-xs text-gray-400 group-hover:text-gray-600">{catCount}</span>}
                        </Link>
                        {children.length > 0 && (
                          <div className="ml-3 mt-0.5 space-y-0.5">
                            {children.map((child) => {
                              const childCount = categoryCounts[child.id] || 0
                              return (
                                <Link key={child.id} href={`/categories/${child.slug}`} className="group flex items-center justify-between rounded-lg px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900">
                                  <span>{child.name}</span>
                                  {childCount > 0 && <span className="text-xs text-gray-400 group-hover:text-gray-600">{childCount}</span>}
                                </Link>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Precio</h3>
                <div className="mt-3 space-y-1">
                  {[
                    { label: "Menos de $50,000", href: "/search?min_price=0&max_price=50000", count: lowPrice },
                    { label: "$50,000 - $100,000", href: "/search?min_price=50000&max_price=100000", count: midPrice },
                    { label: "$100,000 - $500,000", href: "/search?min_price=100000&max_price=500000", count: highPrice },
                    { label: "Más de $500,000", href: "/search?min_price=500000", count: topPrice },
                  ].map((r) => (
                    <Link key={r.label} href={r.href} className="group flex items-center justify-between rounded-lg px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                      <span>{r.label}</span>
                      <span className="text-xs text-gray-400 group-hover:text-gray-600">{r.count}</span>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Filtros</h3>
                <div className="mt-3 space-y-2">
                  <Link href="/search?in_stock=true" className="group flex items-center justify-between rounded-lg px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                    <span>Solo en stock</span>
                    <span className="text-xs text-gray-400 group-hover:text-gray-600">{stockCount}</span>
                  </Link>
                  <Link href="/search?on_sale=true" className="group flex items-center justify-between rounded-lg px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                    <span>En oferta</span>
                    <span className="text-xs text-gray-400 group-hover:text-gray-600">{saleCount}</span>
                  </Link>
                  <Link href="/products?sort=newest" className="group flex items-center justify-between rounded-lg px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                    <span>Novedades</span>
                    <span className="text-xs text-gray-400 group-hover:text-gray-600">{newCount}</span>
                  </Link>
                </div>
              </div>
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
                <p className="mt-1 text-sm text-gray-500">{products.length} resultados</p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <Link key={product.id} href={`/products/${product.slug}`} className="group rounded-xl border border-gray-200 p-3 hover:border-gray-300 hover:shadow-sm transition-all">
                  <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
                    {product.main_image ? (
                      <Image src={product.main_image} alt={product.name} fill className="object-cover" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-400 text-xs">Sin imagen</div>
                    )}
                  </div>
                  <div className="mt-3">
                    <p className="text-xs text-gray-400">{product.category_name}</p>
                    <h3 className="mt-0.5 text-sm font-medium text-gray-900 leading-tight line-clamp-2 group-hover:text-gray-600">{product.name}</h3>
                    <div className="mt-1.5 flex items-baseline gap-1.5">
                      {product.sale_price ? (
                        <><span className="text-base font-semibold text-gray-900">${Number(product.sale_price).toLocaleString("es-CO")}</span><span className="text-xs text-gray-400 line-through">${Number(product.base_price).toLocaleString("es-CO")}</span></>
                      ) : (
                        <span className="text-base font-semibold text-gray-900">${Number(product.current_price).toLocaleString("es-CO")}</span>
                      )}
                    </div>
                    {product.avg_rating > 0 && <p className="mt-1 text-xs text-gray-400">★ {Number(product.avg_rating).toFixed(1)}</p>}
                  </div>
                </Link>
              ))}
            </div>

            {products.length === 0 && <p className="py-20 text-center text-gray-500">No hay productos disponibles.</p>}
          </div>

          <aside className="hidden w-56 flex-shrink-0 xl:block">
            <RecentlyViewed />
          </aside>
        </div>
      </div>
    </StoreLayout>
  )
}
