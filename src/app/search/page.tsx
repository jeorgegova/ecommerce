import StoreLayout from "@/components/layout/StoreLayout"
import SortSelect from "@/components/store/SortSelect"
import ProductCard from "@/components/store/ProductCard"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"

interface SearchProduct {
  id: string; name: string; slug: string; sku: string; short_description: string | null
  base_price: number; sale_price: number | null; promotion_active: boolean; current_price: number; stock: number
  has_variants: boolean; main_image: string | null; avg_rating: number | null
  reviews_count: number; sales_count: number; total_count: number
}

interface FilterValue { attribute_id: string; attribute_name: string; attribute_slug: string; filter_type: string; value: string; value_slug: string; product_count: number }

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string; sort?: string; min_price?: string; max_price?: string; in_stock?: string; on_sale?: string; page?: string }> }) {
  const params = await searchParams
  const query = params.q || ""
  const sort = params.sort || "relevance"
  const page = Math.max(1, Number(params.page) || 1)
  const supabase = await createClient()

  let { data: rawProducts } = await supabase.rpc("search_products", {
    p_query: query, p_category_id: params.category || null,
    p_price_min: params.min_price ? Number(params.min_price) : null, p_price_max: params.max_price ? Number(params.max_price) : null,
    p_in_stock: params.in_stock === "true" ? true : params.in_stock === "false" ? false : null, p_on_sale: params.on_sale === "true" ? true : null,
    p_sort_by: sort, p_page: page, p_page_size: 20,
  })

  // Fallback ILIKE si la búsqueda full-text no encuentra nada
  if ((!rawProducts || rawProducts.length === 0) && query) {
    const { data: fallbackProducts } = await supabase
      .from("products")
      .select("id, name, slug, sku, short_description, base_price, sale_price, promotion_active, stock, has_variants, avg_rating, reviews_count, sales_count, product_images(url, is_main)")
      .eq("status", "active")
      .or(`name.ilike.%${query}%,sku.ilike.%${query}%`)
      .order("sales_count", { ascending: false })
      .range(0, 19)

    if (fallbackProducts && fallbackProducts.length > 0) {
      const fbCount = fallbackProducts.length
      rawProducts = fallbackProducts.map((p: any) => {
        const images = p.product_images
        const mainImage = Array.isArray(images)
          ? images.find((img: any) => img.is_main)?.url || images[0]?.url || null
          : null
        return {
          id: p.id, name: p.name, slug: p.slug, sku: p.sku,
          short_description: p.short_description, base_price: p.base_price,
          sale_price: p.sale_price, promotion_active: p.promotion_active,
          current_price: p.sale_price ?? p.base_price,
          stock: p.stock, has_variants: p.has_variants,
          main_image: mainImage,
          avg_rating: p.avg_rating, reviews_count: p.reviews_count,
          sales_count: p.sales_count, total_count: fbCount,
        }
      })
    }
  }

  const products = (rawProducts as unknown as SearchProduct[]) || []

  // Batch-fetch all images for the displayed products (for hover swap effect)
  const productIds = products.map((p) => p.id)
  let productImagesMap: Record<string, string[]> = {}
  if (productIds.length > 0) {
    const { data: allImages } = await supabase
      .from("product_images")
      .select("product_id, url, is_main")
      .in("product_id", productIds)
      .order("sort_order")
    if (allImages) {
      for (const img of allImages) {
        if (!productImagesMap[img.product_id]) productImagesMap[img.product_id] = []
        productImagesMap[img.product_id].push(img.url)
      }
    }
  }
  const { data: rawFilters } = await supabase.rpc("get_product_filters", { p_query: query, p_category_id: params.category || null })
  const filters = (rawFilters as unknown as FilterValue[]) || []
  const { data: categories } = await supabase.from("categories").select("*").eq("is_active", true).order("sort_order")
  const totalCount = products.length > 0 ? Number(products[0].total_count) : 0
  const totalPages = Math.ceil(totalCount / 20)

  const currentParams: Record<string, string> = {}
  if (query) currentParams.q = query
  if (params.category) currentParams.category = params.category

  return (
    <StoreLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {query && <h1 className="text-2xl font-bold text-gray-900 mb-6">Resultados para &ldquo;{query}&rdquo;</h1>}
        <div className="flex gap-8">
          <aside className="hidden w-64 flex-shrink-0 lg:block">
            <div className="sticky top-24 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Categoría</h3>
                <div className="mt-3 space-y-2">
                  <Link href={`/search?q=${query}`} className={`block text-sm ${!params.category ? "font-medium text-gray-900" : "text-gray-600 hover:text-gray-900"}`}>Todas</Link>
                  {categories?.map((cat) => (
                    <Link key={cat.id} href={`/search?q=${query}&category=${cat.id}&sort=${sort}`}
                      className={`block text-sm ${params.category === cat.id ? "font-medium text-gray-900" : "text-gray-600 hover:text-gray-900"}`}>{cat.name}</Link>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Disponibilidad</h3>
                <div className="mt-3 space-y-2">
                  <Link href={`/search?q=${query}&in_stock=true`} className={`block text-sm ${params.in_stock === "true" ? "font-medium text-gray-900" : "text-gray-600 hover:text-gray-900"}`}>Solo en stock</Link>
                  <Link href={`/search?q=${query}&on_sale=true`} className={`block text-sm ${params.on_sale === "true" ? "font-medium text-gray-900" : "text-gray-600 hover:text-gray-900"}`}>En oferta</Link>
                </div>
              </div>
              <Link href="/search" className="block text-sm font-medium text-gray-500 hover:text-gray-900">Limpiar filtros</Link>
            </div>
          </aside>
          <div className="flex-1">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-gray-600">{totalCount.toLocaleString("es-CO")} resultados</p>
              <SortSelect currentSort={sort} currentParams={currentParams} />
            </div>
            {products.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((product) => (
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
                    }}
                    images={productImagesMap[product.id] || (product.main_image ? [product.main_image] : [])}
                  />
                ))}
              </div>
            ) : (
              <div className="py-20 text-center"><p className="text-gray-500">{query ? `No encontramos resultados para "${query}".` : "No hay productos que coincidan con los filtros."}</p></div>
            )}
            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((p) => (
                  <Link key={p} href={`/search?q=${query}&sort=${sort}&page=${p > 1 ? p : ""}`}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm ${p === page ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"}`}>{p}</Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </StoreLayout>
  )
}
