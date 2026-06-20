import StoreLayout from "@/components/layout/StoreLayout"
import { createClient } from "@/lib/supabase/server"
import Image from "next/image"
import Link from "next/link"

interface SearchProduct {
  id: string; name: string; slug: string; sku: string; short_description: string | null
  base_price: number; sale_price: number | null; current_price: number; stock: number
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

  const { data: rawProducts } = await supabase.rpc("search_products", {
    p_query: query, p_category_id: params.category || null,
    p_price_min: params.min_price ? Number(params.min_price) : null, p_price_max: params.max_price ? Number(params.max_price) : null,
    p_in_stock: params.in_stock === "true" ? true : params.in_stock === "false" ? false : null, p_on_sale: params.on_sale === "true" ? true : null,
    p_sort_by: sort, p_page: page, p_page_size: 20,
  })
  const products = (rawProducts as unknown as SearchProduct[]) || []
  const { data: rawFilters } = await supabase.rpc("get_product_filters", { p_query: query, p_category_id: params.category || null })
  const filters = (rawFilters as unknown as FilterValue[]) || []
  const { data: categories } = await supabase.from("categories").select("*").eq("is_active", true).order("sort_order")
  const totalCount = products.length > 0 ? Number(products[0].total_count) : 0
  const totalPages = Math.ceil(totalCount / 20)

  const sortOptions = [
    { value: "relevance", label: "Relevancia" }, { value: "price_asc", label: "Precio: Menor a Mayor" },
    { value: "price_desc", label: "Precio: Mayor a Menor" }, { value: "sales", label: "Más Vendidos" },
    { value: "rating", label: "Mejor Valorados" }, { value: "newest", label: "Más Nuevos" },
  ]

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
              <select value={sort} onChange={(e) => { const url = new URLSearchParams(); if (query) url.set("q", query); if (params.category) url.set("category", params.category); if (e.target.value) url.set("sort", e.target.value); window.location.href = `/search?${url.toString()}` }}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-gray-900 focus:outline-none">
                {sortOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            {products.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((product) => (
                  <Link key={product.id} href={`/products/${product.slug}`} className="group rounded-xl border border-gray-200 p-4 hover:border-gray-300">
                    <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
                      {product.main_image ? <Image src={product.main_image} alt={product.name} fill className="object-cover" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" />
                      : <div className="flex h-full items-center justify-center text-gray-400 text-sm">Sin imagen</div>}
                    </div>
                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-gray-900 group-hover:text-gray-600">{product.name}</h3>
                      <div className="mt-2 flex items-baseline gap-2">
                        {product.sale_price ? (
                          <><span className="text-lg font-semibold text-gray-900">${Number(product.sale_price).toLocaleString("es-CO")}</span><span className="text-sm text-gray-400 line-through">${Number(product.base_price).toLocaleString("es-CO")}</span></>
                        ) : (
                          <span className="text-lg font-semibold text-gray-900">${Number(product.current_price).toLocaleString("es-CO")}</span>
                        )}
                      </div>
                    </div>
                  </Link>
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
