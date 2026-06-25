import RecentlyViewed from "@/components/store/RecentlyViewed"
import ProductCard from "@/components/store/ProductCard"
import StoreLayout from "@/components/layout/StoreLayout"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"

export default async function HomePage() {
  const supabase = await createClient()

  const [productsRes, categoriesRes, totalRes, stockRes, saleRes, newRes] = await Promise.all([
    supabase.from("product_listing").select("*").order("created_at", { ascending: false }).limit(20),
    supabase.from("categories").select("*").eq("is_active", true).order("sort_order", { ascending: true }).order("name", { ascending: true }),
    supabase.from("products").select("id, category_id, base_price, sale_price, promotion_active", { count: "exact", head: false }).eq("status", "active"),
    supabase.from("products").select("id", { count: "exact", head: false }).eq("status", "active").gt("stock", 0),
    supabase.from("products").select("id", { count: "exact", head: false }).eq("status", "active").eq("promotion_active", true).not("sale_price", "is", null),
    supabase.from("products").select("id", { count: "exact", head: false }).eq("status", "active").gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
  ])

  const products = productsRes.data || []

  const productIds = products.map((p: any) => p.id)
  let productImagesMap: Record<string, string[]> = {}
  if (productIds.length > 0) {
    const { data: allImages } = await supabase
      .from("product_images")
      .select("product_id, url")
      .in("product_id", productIds)
      .order("sort_order")
    if (allImages) {
      for (const img of allImages) {
        if (!productImagesMap[img.product_id]) productImagesMap[img.product_id] = []
        productImagesMap[img.product_id].push(img.url)
      }
    }
  }
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

  const effectivePrice = (p: any) => (p.promotion_active && p.sale_price ? p.sale_price : p.base_price)

  const lowPrice = allProducts.filter((p) => effectivePrice(p) < 50000).length
  const midPrice = allProducts.filter((p) => effectivePrice(p) >= 50000 && effectivePrice(p) <= 100000).length
  const highPrice = allProducts.filter((p) => effectivePrice(p) > 100000 && effectivePrice(p) <= 500000).length
  const topPrice = allProducts.filter((p) => effectivePrice(p) > 500000).length

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
              {products.map((product: any) => (
                <ProductCard
                  key={product.id}
                  product={{
                    id: product.id,
                    name: product.name,
                    slug: product.slug,
                    base_price: product.base_price,
                    sale_price: product.sale_price,
                    promotion_active: product.promotion_active,
                    current_price: product.current_price,
                    category_name: product.category_name,
                    avg_rating: product.avg_rating,
                  }}
                  images={productImagesMap[product.id] || (product.main_image ? [product.main_image] : [])}
                />
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
