"use client"

import { createClient } from "@/lib/supabase/client"
import ProductCard from "@/components/store/ProductCard"
import { useSearchContext } from "@/components/store/SearchContext"
import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"

interface ProductItem {
  id: string; name: string; slug: string; base_price: number
  sale_price: number | null; promotion_active: boolean; current_price: number
  category_name?: string; avg_rating?: number; main_image?: string | null
}

interface CategoryNode { id: string; name: string; slug: string; parent_id: string | null }
type SortOption = "relevance" | "price_asc" | "price_desc" | "sales" | "rating" | "newest"

const PAGE_SIZE = 20

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "relevance", label: "Relevancia" }, { value: "price_asc", label: "Menor precio" },
  { value: "price_desc", label: "Mayor precio" }, { value: "sales", label: "Más vendidos" },
  { value: "rating", label: "Mejor valorados" }, { value: "newest", label: "Más nuevos" },
]

function getAllChildIds(parentId: string, categories: CategoryNode[]): string[] {
  const result: string[] = [parentId]
  for (const c of categories) { if (c.parent_id === parentId) result.push(...getAllChildIds(c.id, categories)) }
  return result
}

function buildTree(categories: CategoryNode[]): CategoryNode[] {
  const map = new Map<string, CategoryNode & { children: CategoryNode[] }>()
  const roots: (CategoryNode & { children: CategoryNode[] })[] = []
  for (const cat of categories) map.set(cat.id, { ...cat, children: [] })
  for (const cat of map.values()) {
    if (cat.parent_id && map.has(cat.parent_id)) {
      map.get(cat.parent_id)!.children.push(cat)
    } else {
      roots.push(cat)
    }
  }
  return roots
}

function CategoryTreeItem({
  cat, counts, activeId, level, onClick,
}: {
  cat: CategoryNode & { children?: CategoryNode[] }
  counts: Record<string, number>
  activeId: string | null
  level: number
  onClick: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(level === 0)
  const children = (cat as any).children as CategoryNode[] | undefined
  const hasChildren = children && children.length > 0
  const isActive = activeId === cat.id
  const count = counts[cat.id] || 0

  return (
    <div>
      <button
        onClick={() => {
          if (hasChildren) setExpanded(!expanded)
          onClick(cat.id)
        }}
        aria-pressed={isActive}
        className={`w-full text-left flex items-center gap-2 rounded-xl px-2.5 py-2.5 text-[13px] cursor-pointer transition-all duration-150 ${
          isActive ? "bg-[#f5f5f7] font-semibold text-[#1d1d1f]" : "text-gray-500 hover:bg-[#f5f5f7] hover:text-[#1d1d1f]"
        }`}
      >
        {hasChildren && (
          <svg className={`h-3 w-3 flex-shrink-0 text-gray-400 transition-transform ${expanded ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        )}
        {!hasChildren && <span className="w-3 flex-shrink-0" />}
            <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${isActive ? "bg-[#1d1d1f]" : "bg-transparent"}`} />
        <span className="flex-1 truncate">{cat.name}</span>
        {count > 0 && (
          <span className="text-[11px] tabular-nums text-gray-400">{count}</span>
        )}
      </button>
      {hasChildren && expanded && (
        <div className="ml-4 border-l border-gray-100 pl-2">
          {children!.map((child) => (
            <CategoryTreeItem key={child.id} cat={child} counts={counts} activeId={activeId} level={level + 1} onClick={onClick} />
          ))}
        </div>
      )}
    </div>
  )
}

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | "...")[] = []
  pages.push(1)
  if (current > 3) pages.push("...")
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) pages.push(i)
  if (current < total - 2) pages.push("...")
  pages.push(total)
  return pages
}

export default function ProductFilterEngine({
  initialProducts, initialTotal, initialCategories, initialImages, initialSearch,
}: {
  initialProducts: ProductItem[]; initialTotal: number; initialCategories: CategoryNode[]
  initialImages: Record<string, string[]>; initialSearch: string
}) {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { query: contextQuery, submitSearch } = useSearchContext()

  const urlSearch = searchParams.get("q") || ""
  const effectiveSearch = contextQuery || urlSearch || initialSearch

  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [sidebarSearch, setSidebarSearch] = useState(effectiveSearch)
  const [inStock, setInStock] = useState(false)
  const [onSale, setOnSale] = useState(false)
  const [sort, setSort] = useState<SortOption>("relevance")
  const [page, setPage] = useState(1)
  const [products, setProducts] = useState<ProductItem[]>(initialProducts)
  const [totalCount, setTotalCount] = useState(initialTotal)
  const [fetching, setFetching] = useState(false)
  const [productImagesMap, setProductImagesMap] = useState<Record<string, string[]>>(initialImages)
  const [filterStats, setFilterStats] = useState<{ categoryCounts: Record<string, number>; stockCount: number; saleCount: number }>({ categoryCounts: {}, stockCount: 0, saleCount: 0 })
  const [hasUserAction, setHasUserAction] = useState(false)

  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const pendingSearchRef = useRef(contextQuery)

  const categoryTree = useMemo(() => buildTree(initialCategories), [initialCategories])

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
    search: effectiveSearch, categoryId, inStock, onSale, sort, page,
  }), [effectiveSearch, categoryId, inStock, onSale, sort, page])

  const fetchProducts = useCallback(async (
    search: string, catId: string | null, inStk: boolean, onSl: boolean,
    srt: SortOption, pg: number
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

  const fetchCategoryStats = useCallback(async (
    search: string, _catId: string | null, inStk: boolean, onSl: boolean
  ) => {
    let q = supabase.from("products").select("category_id, stock, promotion_active, sale_price").eq("status", "active")
    if (search.trim()) q = q.or(`name.ilike.%${search.trim()}%,sku.ilike.%${search.trim()}%`)
    if (inStk) q = q.gt("stock", 0)
    if (onSl) q = q.eq("promotion_active", true).not("sale_price", "is", null)
    const { data } = await q
    if (!data) return
    const catCounts: Record<string, number> = {}
    let stkCount = 0, slCount = 0
    for (const p of (data as any[])) {
      if (p.stock > 0) stkCount++
      if (p.promotion_active && p.sale_price) slCount++
      if (p.category_id) catCounts[p.category_id] = (catCounts[p.category_id] || 0) + 1
    }
    const aggregated: Record<string, number> = {}
    const propagate = (catId: string): number => {
      if (aggregated[catId] !== undefined) return aggregated[catId]
      let total = catCounts[catId] || 0
      for (const c of initialCategories) {
        if (c.parent_id === catId) total += propagate(c.id)
      }
      aggregated[catId] = total
      return total
    }
    for (const cat of initialCategories) propagate(cat.id)
    setFilterStats({ categoryCounts: aggregated, stockCount: stkCount, saleCount: slCount })
  }, [supabase, initialCategories])

  useEffect(() => {
    fetchProducts(effectiveSearch, null, false, false, "relevance", 1)
    fetchCategoryStats(effectiveSearch, null, false, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!hasUserAction) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const fk = filtersKey
    debounceRef.current = setTimeout(() => {
      fetchProducts(fk.search, fk.categoryId, fk.inStock, fk.onSale, fk.sort, fk.page)
      fetchCategoryStats(fk.search, fk.categoryId, fk.inStock, fk.onSale)
    }, 250)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [filtersKey, hasUserAction, fetchProducts, fetchCategoryStats])

  useEffect(() => {
    if (contextQuery && contextQuery !== pendingSearchRef.current) {
      pendingSearchRef.current = contextQuery; setPage(1); setHasUserAction(true)
    }
  }, [contextQuery, submitSearch])

  useEffect(() => {
    setSidebarSearch(effectiveSearch)
  }, [effectiveSearch])

  const clearFilters = () => {
    setCategoryId(null); setInStock(false); setOnSale(false)
    setSort("relevance"); setPage(1); setHasUserAction(true)
    submitSearch("")
    router.replace("/", { scroll: false })
  }
  const handleSidebarSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const value = sidebarSearch.trim()
    if (!value) {
      clearFilters()
      return
    }
    submitSearch(value)
    setPage(1)
    setHasUserAction(true)
  }
  const applyFilter = (fn: () => void) => { fn(); setHasUserAction(true) }
  const filterCount = [categoryId, inStock, onSale, effectiveSearch ? true : false].filter(Boolean).length
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const allCatCount = initialCategories
    .filter((c) => !c.parent_id)
    .reduce((sum, c) => sum + (filterStats.categoryCounts[c.id] || 0), 0)

  return (
    <div>
      {/* Filtros Móviles */}
      <div className="lg:hidden px-3 pb-3">
        <div className="flex gap-2 items-center overflow-x-auto scrollbar-hide py-1">
          <button
            onClick={() => {
              const drawer = document.getElementById("mobile-filter-drawer")
              if (drawer) drawer.classList.remove("translate-y-full")
            }}
            className="inline-flex flex-shrink-0 touch-target items-center gap-1.5 rounded-full px-4 py-2 text-[12px] font-bold transition-all duration-200 active:scale-95 bg-gray-900 text-gray-100 shadow-sm"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
            </svg>
            Filtros
            {filterCount > 0 && (
              <span className="flex items-center justify-center h-4 w-4 rounded-full bg-gray-700 text-[9px] font-bold text-white leading-none">
                {filterCount}
              </span>
            )}
          </button>

          {filterCount === 0 ? (
            <span className="text-xs text-gray-400 italic px-1 flex-shrink-0">Sin filtros seleccionados</span>
          ) : (
            <>
              {categoryId && (
                <button
                  onClick={() => applyFilter(() => setCategoryId(null))}
                  className="inline-flex flex-shrink-0 items-center gap-1 bg-gray-100 text-gray-700 rounded-full px-3 py-1.5 text-[11px] font-medium border border-gray-200"
                >
                  {initialCategories.find(c => c.id === categoryId)?.name || "Categoría"}
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              {inStock && (
                <button onClick={() => applyFilter(() => setInStock(false))}
                  className="inline-flex flex-shrink-0 items-center gap-1 bg-gray-100 text-gray-700 rounded-full px-3 py-1.5 text-[11px] font-medium border border-gray-200">
                  En Stock
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              {onSale && (
                <button onClick={() => applyFilter(() => setOnSale(false))}
                  className="inline-flex flex-shrink-0 items-center gap-1 bg-gray-100 text-gray-700 rounded-full px-3 py-1.5 text-[11px] font-medium border border-gray-200">
                  En Oferta
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              {effectiveSearch && (
                <button onClick={clearFilters}
                  className="inline-flex flex-shrink-0 items-center gap-1 bg-gray-100 text-gray-700 rounded-full px-3 py-1.5 text-[11px] font-medium border border-gray-200">
                  &quot;{effectiveSearch.length > 15 ? effectiveSearch.slice(0, 15) + "..." : effectiveSearch}&quot;
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              {filterCount > 0 && (
                <button onClick={clearFilters}
                  className="inline-flex flex-shrink-0 items-center gap-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-full px-3 py-1.5 text-[11px] font-semibold border border-red-200 transition-all ml-auto cursor-pointer">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                  Limpiar filtros
                </button>
              )}
            </>
          )}
        </div>

        {/* Drawer Bottom Sheet */}
        <div id="mobile-filter-drawer"
          className="fixed inset-0 z-100 transform translate-y-full transition-transform duration-300 ease-out bg-black/40 backdrop-blur-xs flex flex-col justify-end"
          onClick={(e) => { if (e.target === e.currentTarget) e.currentTarget.classList.add("translate-y-full") }}>
          <div className="bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto flex flex-col shadow-2xl pb-safe">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-gray-900">Filtros</span>
                {filterCount > 0 && (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gray-900 px-1.5 text-[10px] font-extrabold text-white">{filterCount}</span>
                )}
              </div>
              <button onClick={() => { const d = document.getElementById("mobile-filter-drawer"); if (d) d.classList.add("translate-y-full") }}
                className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-5 space-y-6">
              {/* Categorías con árbol */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-2.5">Categorías</p>
                <div className="space-y-0.5">
                  <button
                    onClick={() => applyFilter(() => { setCategoryId(null); setPage(1) })}
                    className={`w-full text-left flex items-center gap-2 rounded-xl px-2.5 py-2.5 text-[13px] transition-all ${
                      !categoryId ? "bg-gray-100 font-semibold text-gray-900" : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${!categoryId ? "bg-gray-900" : "bg-transparent"}`} />
                    Todas las categorías
                    <span className="text-[11px] text-gray-400 ml-auto">{allCatCount}</span>
                  </button>
                  {categoryTree.map((cat) => (
                    <CategoryTreeItem key={cat.id} cat={cat} counts={filterStats.categoryCounts} activeId={categoryId}
                      level={0} onClick={(id) => applyFilter(() => { setCategoryId(categoryId === id ? null : id); setPage(1) })} />
                  ))}
                </div>
              </div>

              {/* Disponibilidad */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-2.5">Disponibilidad</p>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => applyFilter(() => { setInStock(!inStock); setPage(1) })}
                    className={`flex items-center justify-center gap-2 px-4 py-3 text-xs font-semibold rounded-xl border transition-all ${
                      inStock ? "bg-gray-100 text-gray-900 border-gray-300" : "bg-gray-50 text-gray-600 border-gray-200"
                    }`}>
                    <span className={`h-2.5 w-2.5 rounded-full ${inStock ? "bg-green-500" : "bg-gray-300"}`} />
                    En Stock ({filterStats.stockCount})
                  </button>
                  <button onClick={() => applyFilter(() => { setOnSale(!onSale); setPage(1) })}
                    className={`flex items-center justify-center gap-2 px-4 py-3 text-xs font-semibold rounded-xl border transition-all ${
                      onSale ? "bg-gray-100 text-gray-900 border-gray-300" : "bg-gray-50 text-gray-600 border-gray-200"
                    }`}>
                    <span className={`h-2.5 w-2.5 rounded-full ${onSale ? "bg-red-500 animate-pulse" : "bg-gray-300"}`} />
                    Ofertas ({filterStats.saleCount})
                  </button>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 flex gap-3 z-10">
              {filterCount > 0 && (
                <button onClick={() => { clearFilters(); const d = document.getElementById("mobile-filter-drawer"); if (d) d.classList.add("translate-y-full") }}
                  className="flex-1 py-3 text-xs font-bold rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors cursor-pointer">
                  <span className="flex items-center justify-center gap-1.5">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                    Limpiar filtros
                  </span>
                </button>
              )}
              <button onClick={() => { const d = document.getElementById("mobile-filter-drawer"); if (d) d.classList.add("translate-y-full") }}
                className="flex-2 py-3 bg-gray-800 text-white text-xs font-bold rounded-xl hover:bg-gray-900 transition-colors text-center shadow-md shadow-gray-900/5">
                Aplicar Filtros ({totalCount})
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Sidebar Desktop */}
        <aside className="hidden w-[236px] flex-shrink-0 lg:block mt-6">
          <div className="sticky top-24">
            <div className="px-1 pb-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[17px] font-semibold tracking-[-0.02em] text-[#1d1d1f]">Filtrar productos</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-gray-500">Encuentra una pieza por categoría.</p>
                </div>
                {filterCount > 0 && (
                  <button onClick={clearFilters} aria-label="Limpiar todos los filtros"
                    className="mt-0.5 inline-flex cursor-pointer items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium text-gray-500 transition-colors hover:bg-[#f5f5f7] hover:text-[#1d1d1f]">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                    Limpiar
                  </button>
                )}
              </div>
              <form onSubmit={handleSidebarSearch} className="relative mt-4">
                <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
                <input
                  value={sidebarSearch}
                  onChange={(e) => setSidebarSearch(e.target.value)}
                  placeholder="Nombre o SKU..."
                  aria-label="Buscar productos"
                  className="h-10 w-full rounded-xl border border-gray-200/80 bg-[#f5f5f7] pl-9 pr-3 text-[12px] text-[#1d1d1f] outline-none transition-colors placeholder:text-gray-400 hover:bg-white focus:border-gray-300 focus:bg-white"
                />
              </form>
            </div>

            <div className="space-y-7 border-t border-gray-200/70 pt-5">
              <div>
                <div className="mb-2.5 flex items-end justify-between">
                  <div>
                    <p className="text-[12px] font-medium text-[#1d1d1f]">Categorías</p>
                    <p className="mt-0.5 text-[11px] text-gray-400">Familias y modelos</p>
                  </div>
                  <span className="text-[11px] tabular-nums text-gray-400">{allCatCount}</span>
                </div>
                <div className="max-h-[390px] space-y-0.5 overflow-y-auto pr-1 scrollbar-hide">
                  <button
                    onClick={() => applyFilter(() => { setCategoryId(null); setPage(1) })}
                    aria-pressed={!categoryId}
                    className={`w-full cursor-pointer text-left flex items-center gap-2 rounded-xl px-2.5 py-2.5 text-[13px] transition-all ${
                      !categoryId ? "bg-[#f5f5f7] font-semibold text-[#1d1d1f]" : "text-gray-500 hover:bg-[#f5f5f7] hover:text-[#1d1d1f]"
                    }`}
                  >
                      <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${!categoryId ? "bg-[#1d1d1f]" : "bg-transparent"}`} />
                    <span className="flex-1">Todas las categorías</span>
                    <span className="text-[11px] tabular-nums text-gray-400">{allCatCount}</span>
                  </button>
                  {categoryTree.map((cat) => (
                    <CategoryTreeItem key={cat.id} cat={cat} counts={filterStats.categoryCounts} activeId={categoryId}
                      level={0} onClick={(id) => applyFilter(() => { setCategoryId(categoryId === id ? null : id); setPage(1) })} />
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2.5">
                  <p className="text-[12px] font-medium text-[#1d1d1f]">Disponibilidad</p>
                  <p className="mt-0.5 text-[11px] text-gray-400">Compra solo lo disponible</p>
                </div>
                <div className="space-y-1.5">
                  <button onClick={() => applyFilter(() => { setInStock(!inStock); setPage(1) })}
                    aria-pressed={inStock}
                    className={`w-full cursor-pointer text-left flex items-center justify-between rounded-xl border px-3 py-2.5 text-[13px] transition-all ${
                      inStock ? "border-gray-300 bg-[#f5f5f7] font-semibold text-[#1d1d1f]" : "border-gray-100 bg-[#f5f5f7]/70 text-gray-500 hover:border-gray-200 hover:bg-white"
                    }`}>
                    <span className="flex items-center gap-2.5">
                      <span className={`h-2 w-2 rounded-full ${inStock ? "bg-green-500" : "bg-gray-300"}`} />
                      En stock
                    </span>
                    <span className="text-[11px] tabular-nums text-gray-400">{filterStats.stockCount}</span>
                  </button>
                  <button onClick={() => applyFilter(() => { setOnSale(!onSale); setPage(1) })}
                    aria-pressed={onSale}
                    className={`w-full cursor-pointer text-left flex items-center justify-between rounded-xl border px-3 py-2.5 text-[13px] transition-all ${
                      onSale ? "border-gray-300 bg-[#f5f5f7] font-semibold text-[#1d1d1f]" : "border-gray-100 bg-[#f5f5f7]/70 text-gray-500 hover:border-gray-200 hover:bg-white"
                    }`}>
                    <span className="flex items-center gap-2.5">
                      <span className={`h-2 w-2 rounded-full ${onSale ? "bg-gray-700" : "bg-gray-300"}`} />
                      En oferta
                    </span>
                    <span className="text-[11px] tabular-nums text-gray-400">{filterStats.saleCount}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Products Grid */}
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
              <select value={sort} onChange={(e) => applyFilter(() => { setSort(e.target.value as SortOption); setPage(1) })}
                className="rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] sm:text-xs text-gray-600 focus:border-gray-300 focus:outline-none cursor-pointer transition-colors">
                {sortOptions.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
              </select>
            </div>
          </div>

          {products.length === 0 && !fetching ? (
            <div className="flex flex-col items-center justify-center py-28 text-center">
              <svg className="mb-5 h-14 w-14 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <p className="text-sm text-gray-400">{effectiveSearch ? `Sin resultados para "${effectiveSearch}"` : "No se encontraron productos"}</p>
              <button onClick={clearFilters} className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-gray-800 transition-colors cursor-pointer">Quitar filtros</button>
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

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="mt-12 flex items-center justify-center gap-1">
                  <button
                    onClick={() => applyFilter(() => setPage(page - 1))}
                    disabled={page === 1}
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-sm text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ←
                  </button>
                  {getPageNumbers(page, totalPages).map((p, i) =>
                    p === "..." ? (
                      <span key={`dots-${i}`} className="flex h-9 w-9 items-center justify-center text-sm text-gray-300">…</span>
                    ) : (
                      <button key={p} onClick={() => applyFilter(() => setPage(p))}
                        className={`flex h-9 min-w-[36px] items-center justify-center rounded-xl text-[13px] font-medium transition-all duration-200 ${
                          p === page ? "bg-gray-900 text-white shadow-sm" : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                  <button
                    onClick={() => applyFilter(() => setPage(page + 1))}
                    disabled={page === totalPages}
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-sm text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
