"use client"

import { createClient } from "@/lib/supabase/client"
import ProductCard from "@/components/store/ProductCard"
import { useSearchContext } from "@/components/store/SearchContext"
import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import { useSearchParams } from "next/navigation"

interface ProductItem {
  id: string; name: string; slug: string; base_price: number
  sale_price: number | null; promotion_active: boolean; current_price: number
  category_name?: string; avg_rating?: number; main_image?: string | null
}

interface CategoryNode { id: string; name: string; slug: string; parent_id: string | null }
interface PriceRange { label: string; min: number | null; max: number | null; count: number; active: boolean }
type SortOption = "relevance" | "price_asc" | "price_desc" | "sales" | "rating" | "newest"

const PAGE_SIZE = 20

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "relevance", label: "Relevancia" }, { value: "price_asc", label: "Menor precio" },
  { value: "price_desc", label: "Mayor precio" }, { value: "sales", label: "Más vendidos" },
  { value: "rating", label: "Mejor valorados" }, { value: "newest", label: "Más nuevos" },
]

function FilterButton({ onClick, active, children, count }: { onClick: () => void; active: boolean; children: React.ReactNode; count?: number }) {
  return (
    <button onClick={onClick}
      className={`w-full text-left flex items-center justify-between rounded-xl px-3 py-2.5 text-[13px] transition-all duration-150 ${
        active ? "bg-gray-50 font-medium text-gray-900 ring-1 ring-gray-200/80" : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
      }`}>
      <span className="flex items-center gap-2.5">
        <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 transition-colors ${active ? "bg-gray-900" : "bg-transparent"}`} />
        {children}
      </span>
      {count !== undefined && (
        <span className={`text-[11px] tabular-nums ${active ? "text-gray-400" : "text-gray-300"}`}>{count.toLocaleString("es-CO")}</span>
      )}
    </button>
  )
}

export default function ProductFilterEngine({
  initialProducts, initialTotal, initialCategories, initialImages, initialSearch,
}: {
  initialProducts: ProductItem[]; initialTotal: number; initialCategories: CategoryNode[]
  initialImages: Record<string, string[]>; initialSearch: string
}) {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const { query: contextQuery, submitSearch } = useSearchContext()

  const urlSearch = searchParams.get("q") || ""
  const effectiveSearch = contextQuery || urlSearch || initialSearch

  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [minPrice, setMinPrice] = useState<number | null>(null)
  const [maxPrice, setMaxPrice] = useState<number | null>(null)
  const [inStock, setInStock] = useState(false)
  const [onSale, setOnSale] = useState(false)
  const [sort, setSort] = useState<SortOption>("relevance")
  const [page, setPage] = useState(1)
  const [products, setProducts] = useState<ProductItem[]>(initialProducts)
  const [totalCount, setTotalCount] = useState(initialTotal)
  const [fetching, setFetching] = useState(false)
  const [productImagesMap, setProductImagesMap] = useState<Record<string, string[]>>(initialImages)
  const [priceRanges, setPriceRanges] = useState<PriceRange[]>([])
  const [filterStats, setFilterStats] = useState<{ categoryCounts: Record<string, number>; stockCount: number; saleCount: number }>({ categoryCounts: {}, stockCount: 0, saleCount: 0 })
  const [hasUserAction, setHasUserAction] = useState(false)

  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const pendingSearchRef = useRef(contextQuery)

  const rootMap = useMemo(() => {
    const map: Record<string, string> = {}
    const findRoot = (id: string): string => {
      const cat = initialCategories.find(c => c.id === id)
      if (!cat || !cat.parent_id) return id
      return findRoot(cat.parent_id)
    }
    for (const cat of initialCategories) map[cat.id] = findRoot(cat.id)
    return map
  }, [initialCategories])

  const filtersKey = useMemo(() => ({
    search: effectiveSearch, categoryId, minPrice, maxPrice, inStock, onSale, sort, page,
  }), [effectiveSearch, categoryId, minPrice, maxPrice, inStock, onSale, sort, page])

  const fetchProducts = useCallback(async (
    search: string, catId: string | null, minP: number | null, maxP: number | null,
    inStk: boolean, onSl: boolean, srt: SortOption, pg: number
  ) => {
    setFetching(true)
    try {
      let q = supabase.from("products")
        .select("id, name, slug, base_price, sale_price, promotion_active, stock, avg_rating, category_id",
          { count: "exact", head: false }).eq("status", "active")
      if (search.trim()) q = q.or(`name.ilike.%${search.trim()}%,sku.ilike.%${search.trim()}%`)
      if (catId) q = q.in("category_id", getAllChildIds(catId, initialCategories))
      if (inStk) q = q.gt("stock", 0)
      if (onSl) q = q.eq("promotion_active", true).not("sale_price", "is", null)
      if (minP !== null) q = q.gte("base_price", minP)
      if (maxP !== null) q = q.lte("base_price", maxP)
      if (srt === "sales") q = q.order("sales_count", { ascending: false })
      else if (srt === "rating") q = q.order("avg_rating", { ascending: false, nullsFirst: false })
      else if (srt === "newest") q = q.order("created_at", { ascending: false })
      else q = q.order("created_at", { ascending: false })
      q = q.range((pg - 1) * PAGE_SIZE, pg * PAGE_SIZE - 1)

      const { data, count } = await q
      if (!data) { setProducts([]); setTotalCount(0); return }

      const typed = data as any[]
      const mapped: ProductItem[] = typed.map((p) => ({
        id: p.id, name: p.name, slug: p.slug, base_price: p.base_price,
        sale_price: p.sale_price, promotion_active: p.promotion_active,
        current_price: p.sale_price || p.base_price, avg_rating: p.avg_rating,
      }))
      if (srt === "price_asc") mapped.sort((a, b) => a.current_price - b.current_price)
      else if (srt === "price_desc") mapped.sort((a, b) => b.current_price - a.current_price)

      const ids = mapped.map((p) => p.id)
      const { data: allImages } = await supabase.from("product_images")
        .select("product_id, url").in("product_id", ids).order("sort_order")
      const imagesMap: Record<string, string[]> = {}
      if (allImages) for (const img of allImages) {
        if (!imagesMap[img.product_id]) imagesMap[img.product_id] = []
        imagesMap[img.product_id].push(img.url)
      }
      setProducts(mapped); setTotalCount(count || 0); setProductImagesMap(imagesMap)
    } finally { setFetching(false) }
  }, [supabase, initialCategories])

  const fetchPriceRanges = useCallback(async (
    search: string, catId: string | null, minP: number | null, maxP: number | null,
    inStk: boolean, onSl: boolean
  ) => {
    let q = supabase.from("products").select("base_price, sale_price, promotion_active, category_id, stock").eq("status", "active")
    if (search.trim()) q = q.or(`name.ilike.%${search.trim()}%,sku.ilike.%${search.trim()}%`)
    if (catId) q = q.in("category_id", getAllChildIds(catId, initialCategories))
    if (inStk) q = q.gt("stock", 0)
    if (onSl) q = q.eq("promotion_active", true).not("sale_price", "is", null)
    const { data } = await q
    if (!data) return
    const prices = (data as any[]).map((p: any) => p.promotion_active && p.sale_price ? p.sale_price : p.base_price)
    setPriceRanges([
      { label: "Todos", min: null, max: null, count: prices.length, active: minP === null && maxP === null },
      { label: "Menos de $50,000", min: null, max: 50000, count: prices.filter((p: number) => p < 50000).length, active: maxP === 50000 && minP === null },
      { label: "$50,000 – $100,000", min: 50000, max: 100000, count: prices.filter((p: number) => p >= 50000 && p <= 100000).length, active: minP === 50000 && maxP === 100000 },
      { label: "$100,000 – $500,000", min: 100000, max: 500000, count: prices.filter((p: number) => p > 100000 && p <= 500000).length, active: minP === 100000 && maxP === 500000 },
      { label: "Más de $500,000", min: 500000, max: null, count: prices.filter((p: number) => p > 500000).length, active: minP === 500000 && maxP === null },
    ])
    const catCounts: Record<string, number> = {}
    let stkCount = 0, slCount = 0
    for (const p of (data as any[])) {
      if (p.stock > 0) stkCount++
      if (p.promotion_active && p.sale_price) slCount++
      const rootId = rootMap[p.category_id]
      if (rootId) catCounts[rootId] = (catCounts[rootId] || 0) + 1
    }
    setFilterStats({ categoryCounts: catCounts, stockCount: stkCount, saleCount: slCount })
  }, [supabase, initialCategories, rootMap])

  useEffect(() => { fetchPriceRanges(initialSearch, null, null, null, false, false) }, [])

  useEffect(() => {
    if (!hasUserAction) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const fk = filtersKey
    debounceRef.current = setTimeout(() => {
      fetchProducts(fk.search, fk.categoryId, fk.minPrice, fk.maxPrice, fk.inStock, fk.onSale, fk.sort, fk.page)
      fetchPriceRanges(fk.search, fk.categoryId, fk.minPrice, fk.maxPrice, fk.inStock, fk.onSale)
    }, 250)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [filtersKey, hasUserAction, fetchProducts, fetchPriceRanges])

  useEffect(() => {
    if (contextQuery && contextQuery !== pendingSearchRef.current) {
      pendingSearchRef.current = contextQuery; setPage(1); setHasUserAction(true); submitSearch("")
    }
  }, [contextQuery, submitSearch])

  const clearFilters = () => {
    setCategoryId(null); setMinPrice(null); setMaxPrice(null)
    setInStock(false); setOnSale(false); setSort("relevance"); setPage(1); setHasUserAction(true)
  }
  const applyFilter = (fn: () => void) => { fn(); setHasUserAction(true) }
  const filterCount = [categoryId, inStock, onSale, minPrice !== null, maxPrice !== null].filter(Boolean).length
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const roots = initialCategories.filter((c) => !c.parent_id)

  const mobileChips = [
    { label: "Todos", active: !categoryId && !inStock && !onSale && minPrice === null && maxPrice === null, count: totalCount },
    ...roots.slice(0, 8).map((cat) => ({ label: cat.name, active: categoryId === cat.id, count: filterStats.categoryCounts[cat.id] || 0 })),
    { label: "Stock", active: inStock, count: filterStats.stockCount }, { label: "Ofertas", active: onSale, count: filterStats.saleCount },
  ]

  const handleChipClick = (index: number, label: string) => {
    applyFilter(() => {
      if (index === 0) clearFilters()
      else if (index <= Math.min(roots.length, 8)) {
        const cat = roots[index - 1]; setCategoryId((prev) => prev === cat.id ? null : cat.id); setPage(1)
      } else if (label === "Stock") { setInStock((p) => !p); setPage(1) }
      else if (label === "Ofertas") { setOnSale((p) => !p); setPage(1) }
    })
  }

  return (
    <div>
      {/* Filtros Móviles */}
      <div className="lg:hidden px-3 pb-3">
        <div className="flex gap-2 items-center overflow-x-auto scrollbar-hide py-1">
          {/* Botón principal de Filtros que abre el Drawer */}
          <button
            onClick={() => {
              const drawer = document.getElementById("mobile-filter-drawer")
              if (drawer) drawer.classList.remove("translate-y-full")
            }}
            className={`inline-flex flex-shrink-0 touch-target items-center gap-1.5 rounded-full px-4 py-2 text-[12px] font-bold transition-all duration-200 active:scale-95 bg-colombia-yellow text-col-blue-dark border border-colombia-yellow/50 shadow-sm`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
            </svg>
            Filtros
            {filterCount > 0 && (
              <span className="flex items-center justify-center h-4 w-4 rounded-full bg-colombia-red text-[9px] font-bold text-white leading-none">
                {filterCount}
              </span>
            )}
          </button>

          {/* Chips rápidos de estado activo para fácil lectura y remoción */}
          {filterCount === 0 ? (
            <span className="text-xs text-gray-400 italic px-1 flex-shrink-0">
              Sin filtros seleccionados
            </span>
          ) : (
            <>
              {categoryId && (
                <button
                  onClick={() => applyFilter(() => setCategoryId(null))}
                  className="inline-flex flex-shrink-0 items-center gap-1 bg-colombia-blue/10 text-colombia-blue rounded-full px-3 py-1.5 text-[11px] font-medium border border-colombia-blue/20"
                >
                  {initialCategories.find(c => c.id === categoryId)?.name || "Categoría"}
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              )}

              {(minPrice !== null || maxPrice !== null) && (
                <button
                  onClick={() => applyFilter(() => { setMinPrice(null); setMaxPrice(null) })}
                  className="inline-flex flex-shrink-0 items-center gap-1 bg-colombia-blue/10 text-colombia-blue rounded-full px-3 py-1.5 text-[11px] font-medium border border-colombia-blue/20"
                >
                  Precio
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              )}

              {inStock && (
                <button
                  onClick={() => applyFilter(() => setInStock(false))}
                  className="inline-flex flex-shrink-0 items-center gap-1 bg-colombia-blue/10 text-colombia-blue rounded-full px-3 py-1.5 text-[11px] font-medium border border-colombia-blue/20"
                >
                  En Stock
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              )}

              {onSale && (
                <button
                  onClick={() => applyFilter(() => setOnSale(false))}
                  className="inline-flex flex-shrink-0 items-center gap-1 bg-colombia-blue/10 text-colombia-blue rounded-full px-3 py-1.5 text-[11px] font-medium border border-colombia-blue/20"
                >
                  En Oferta
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              )}

              {filterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-[11px] font-medium text-colombia-red hover:underline ml-auto flex-shrink-0 px-2"
                >
                  Limpiar
                </button>
              )}
            </>
          )}
        </div>

        {/* Drawer Bottom Sheet para Filtros */}
        <div
          id="mobile-filter-drawer"
          className="fixed inset-0 z-100 transform translate-y-full transition-transform duration-300 ease-out bg-black/40 backdrop-blur-xs flex flex-col justify-end"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              e.currentTarget.classList.add("translate-y-full")
            }
          }}
        >
          <div className="bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto flex flex-col shadow-2xl pb-safe">
            {/* Cabecera del Drawer */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-gray-900">Filtros de Búsqueda</span>
                {filterCount > 0 && (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-colombia-blue px-1.5 text-[10px] font-extrabold text-white">
                    {filterCount}
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  const drawer = document.getElementById("mobile-filter-drawer")
                  if (drawer) drawer.classList.add("translate-y-full")
                }}
                className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Contenido de los Filtros (Ordenar se quitó de aquí para no duplicar) */}
            <div className="p-5 space-y-6">

              {/* Categorías */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-colombia-blue mb-2.5">Categorías de Repuestos</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => applyFilter(() => { setCategoryId(null); setPage(1) })}
                    className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all ${
                      !categoryId
                        ? "bg-colombia-blue text-white border-colombia-blue shadow-sm"
                        : "bg-gray-50 text-gray-600 border-gray-200"
                    }`}
                  >
                    Todas ({totalCount})
                  </button>
                  {roots.map((cat) => {
                    const count = filterStats.categoryCounts[cat.id] || 0
                    return (
                      <button
                        key={cat.id}
                        onClick={() => applyFilter(() => { setCategoryId(categoryId === cat.id ? null : cat.id); setPage(1) })}
                        className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all ${
                          categoryId === cat.id
                            ? "bg-colombia-blue text-white border-colombia-blue shadow-sm"
                            : "bg-gray-50 text-gray-600 border-gray-200"
                        }`}
                      >
                        {cat.name} ({count})
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Rango de Precios */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-colombia-blue mb-2.5">Rango de Precio</p>
                <div className="space-y-2">
                  {priceRanges.map((r) => (
                    <button
                      key={r.label}
                      onClick={() => applyFilter(() => { setMinPrice(r.min); setMaxPrice(r.max); setPage(1) })}
                      className={`w-full flex items-center justify-between px-4 py-3 text-xs font-semibold rounded-xl border transition-all ${
                        r.active
                          ? "bg-colombia-yellow/10 text-col-blue-dark border-colombia-yellow font-bold"
                          : "bg-gray-50 text-gray-600 border-gray-200"
                      }`}
                    >
                      <span>{r.label}</span>
                      <span className="text-[10px] text-gray-400">({r.count})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Disponibilidad */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-colombia-blue mb-2.5">Disponibilidad</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => applyFilter(() => { setInStock(!inStock); setPage(1) })}
                    className={`flex items-center justify-center gap-2 px-4 py-3 text-xs font-semibold rounded-xl border transition-all ${
                      inStock
                        ? "bg-colombia-yellow/10 text-col-blue-dark border-colombia-yellow"
                        : "bg-gray-50 text-gray-600 border-gray-200"
                    }`}
                  >
                    <span className={`h-2.5 w-2.5 rounded-full ${inStock ? "bg-green-500" : "bg-gray-300"}`} />
                    En Stock ({filterStats.stockCount})
                  </button>

                  <button
                    onClick={() => applyFilter(() => { setOnSale(!onSale); setPage(1) })}
                    className={`flex items-center justify-center gap-2 px-4 py-3 text-xs font-semibold rounded-xl border transition-all ${
                      onSale
                        ? "bg-colombia-yellow/10 text-col-blue-dark border-colombia-yellow"
                        : "bg-gray-50 text-gray-600 border-gray-200"
                    }`}
                  >
                    <span className={`h-2.5 w-2.5 rounded-full ${onSale ? "bg-red-500 animate-pulse" : "bg-gray-300"}`} />
                    Ofertas ({filterStats.saleCount})
                  </button>
                </div>
              </div>
            </div>

            {/* Footer del Drawer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 flex gap-3 z-10">
              {filterCount > 0 && (
                <button
                  onClick={() => {
                    clearFilters()
                    const drawer = document.getElementById("mobile-filter-drawer")
                    if (drawer) drawer.classList.add("translate-y-full")
                  }}
                  className="flex-1 py-3 text-xs font-bold rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 transition-colors"
                >
                  Limpiar Todo
                </button>
              )}
              <button
                onClick={() => {
                  const drawer = document.getElementById("mobile-filter-drawer")
                  if (drawer) drawer.classList.add("translate-y-full")
                }}
                className="flex-2 py-3 bg-col-blue-dark text-white text-xs font-bold rounded-xl hover:bg-colombia-blue transition-colors text-center shadow-md shadow-colombia-blue/10"
              >
                Aplicar Filtros ({totalCount})
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-8">
        <aside className="hidden w-[200px] flex-shrink-0 xl:block">
          <div className="sticky top-24 space-y-6">
            <div>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Filtros</p>
                {filterCount > 0 && (
                  <button onClick={clearFilters} className="text-[11px] font-medium text-gray-400 hover:text-gray-700 transition-colors">
                    Limpiar
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Ordenar</p>
                  <select value={sort} onChange={(e) => applyFilter(() => { setSort(e.target.value as SortOption); setPage(1) })}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-[13px] text-gray-600 focus:border-gray-300 focus:outline-none focus:ring-0 cursor-pointer hover:border-gray-300 transition-colors">
                    {sortOptions.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                  </select>
                </div>

                <div>
                  <p className="mb-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Categoría</p>
                  <div className="space-y-0.5">
                    <FilterButton active={!categoryId} count={totalCount} onClick={() => applyFilter(() => { setCategoryId(null); setPage(1) })}>Todas</FilterButton>
                    {roots.map((cat) => (
                      <FilterButton key={cat.id} active={categoryId === cat.id} count={filterStats.categoryCounts[cat.id] || 0} onClick={() => applyFilter(() => { setCategoryId((prev) => prev === cat.id ? null : cat.id); setPage(1) })}>{cat.name}</FilterButton>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Precio</p>
                  <div className="space-y-0.5">
                    {priceRanges.map((r) => (
                      <FilterButton key={r.label} active={r.active} count={r.count} onClick={() => applyFilter(() => { setMinPrice(r.min); setMaxPrice(r.max); setPage(1) })}>{r.label}</FilterButton>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Disponibilidad</p>
                  <div className="space-y-0.5">
                    <FilterButton active={inStock} count={filterStats.stockCount} onClick={() => applyFilter(() => { setInStock((p) => !p); setPage(1) })}>En stock</FilterButton>
                    <FilterButton active={onSale} count={filterStats.saleCount} onClick={() => applyFilter(() => { setOnSale((p) => !p); setPage(1) })}>En oferta</FilterButton>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex-1 min-w-0 px-2 lg:px-0">
          <div className="mb-4 flex items-center justify-between gap-2 lg:mb-6">
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-bold tracking-tight text-gray-900 truncate lg:text-2xl">
                {effectiveSearch ? `"${effectiveSearch}"` : "Productos"}
              </h1>
              <p className="text-[10px] sm:text-[13px] text-gray-400 tabular-nums">
                {totalCount.toLocaleString("es-CO")} resultado{totalCount !== 1 ? "s" : ""}
              </p>
            </div>
            
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="hidden sm:inline text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Ordenar:</span>
              <select
                value={sort}
                onChange={(e) => applyFilter(() => { setSort(e.target.value as SortOption); setPage(1) })}
                className="rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] sm:text-xs text-gray-600 focus:border-gray-300 focus:outline-none cursor-pointer transition-colors"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {products.length === 0 && !fetching ? (
            <div className="flex flex-col items-center justify-center py-28 text-center">
              <svg className="mb-5 h-14 w-14 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <p className="text-sm text-gray-400">{effectiveSearch ? `Sin resultados para "${effectiveSearch}"` : "No se encontraron productos"}</p>
              <button onClick={clearFilters} className="mt-4 text-[13px] font-medium text-gray-900 hover:underline">Quitar filtros</button>
            </div>
          ) : (
            <>
              <div className={`grid grid-cols-3 gap-1.5 sm:gap-2 lg:gap-5 lg:grid-cols-3 xl:grid-cols-4 transition-opacity duration-200 ${fetching ? "opacity-60" : "opacity-100"}`}>
                {products.map((product, i) => (
                  <div key={product.id} className="animate-card-in" style={{ animationDelay: `${i * 40}ms`, animationFillMode: "backwards" }}>
                    <ProductCard
                      product={{
                        id: product.id, name: product.name, slug: product.slug,
                        base_price: product.base_price, sale_price: product.sale_price,
                        promotion_active: product.promotion_active, current_price: product.current_price,
                        category_name: product.category_name, avg_rating: product.avg_rating,
                      }}
                      images={productImagesMap[product.id] || (product.main_image ? [product.main_image] : [])}
                    />
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-12 flex items-center justify-center gap-1.5">
                  {page > 1 && (
                    <button onClick={() => applyFilter(() => setPage(page - 1))}
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-sm text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors">←</button>
                  )}
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
                    <button key={p} onClick={() => applyFilter(() => setPage(p))}
                      className={`flex h-9 w-9 items-center justify-center rounded-xl text-[13px] font-medium transition-all duration-200 ${
                        p === page ? "bg-gray-900 text-white shadow-sm" : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                      }`}>{p}</button>
                  ))}
                  {page < totalPages && (
                    <button onClick={() => applyFilter(() => setPage(page + 1))}
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-sm text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors">→</button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function getAllChildIds(parentId: string, categories: CategoryNode[]): string[] {
  const result: string[] = [parentId]
  for (const c of categories) { if (c.parent_id === parentId) result.push(...getAllChildIds(c.id, categories)) }
  return result
}
