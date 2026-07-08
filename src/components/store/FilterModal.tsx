"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

interface PriceRange {
  label: string
  href: string
  count: number
  active: boolean
}

interface AttributeGroup {
  name: string
  slug: string
  values: { value: string; valueSlug: string; count: number }[]
}

interface FilterModalProps {
  query: string
  activeCategoryId: string | null
  activeInStock: boolean
  activeOnSale: boolean
  activeMinPrice: string | null
  activeMaxPrice: string | null
  activeAttributeFilters: Record<string, string>
  categories: { id: string; name: string }[]
  priceRanges: PriceRange[]
  attributeGroups: AttributeGroup[]
}

export default function FilterModal({
  query,
  activeCategoryId,
  activeInStock,
  activeOnSale,
  activeMinPrice,
  activeMaxPrice,
  activeAttributeFilters,
  categories,
  priceRanges,
  attributeGroups,
}: FilterModalProps) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => {
    setOpen(false)
  }, [query, activeCategoryId, activeInStock, activeOnSale, activeMinPrice, activeMaxPrice])

  const buildParams = (overrides: Record<string, string | undefined>) => {
    const p = new URLSearchParams()
    if (query) p.set("q", query)
    const cat = overrides.category !== undefined ? overrides.category : activeCategoryId
    if (cat) p.set("category", cat)
    const stock = overrides.in_stock !== undefined ? overrides.in_stock : (activeInStock ? "true" : undefined)
    if (stock) p.set("in_stock", stock)
    const sale = overrides.on_sale !== undefined ? overrides.on_sale : (activeOnSale ? "true" : undefined)
    if (sale) p.set("on_sale", sale)
    const minP = overrides.min_price !== undefined ? overrides.min_price : activeMinPrice
    if (minP) p.set("min_price", minP)
    const maxP = overrides.max_price !== undefined ? overrides.max_price : activeMaxPrice
    if (maxP) p.set("max_price", maxP)
    // Attribute filters
    for (const [k, v] of Object.entries(activeAttributeFilters)) {
      const key = `f_${k}`
      if (overrides[key] !== undefined) {
        if (overrides[key]) p.set(key, overrides[key]!)
      } else if (v) {
        p.set(key, v)
      }
    }
    for (const [k, v] of Object.entries(overrides)) {
      if (v && k.startsWith("f_") && !(k in activeAttributeFilters)) p.set(k, v)
      if (v && !k.startsWith("f_") && !Object.keys(activeAttributeFilters).includes(k) && k !== "category" && k !== "in_stock" && k !== "on_sale" && k !== "min_price" && k !== "max_price") {
        p.set(k, v)
      }
    }
    return p.toString()
  }

  const activeFilterCount = [
    activeCategoryId, activeInStock, activeOnSale, activeMinPrice, activeMaxPrice,
    ...Object.values(activeAttributeFilters),
  ].filter(Boolean).length

  if (!mounted) return null

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setOpen(true)}
        className="relative flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:border-gray-300"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
        </svg>
        Filtros
        {activeFilterCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gray-900 text-[10px] font-bold text-white">
            {activeFilterCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center">
          <div className="fixed inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-xl max-h-[85vh] overflow-y-auto animate-slide-up">
            <div className="sticky top-0 z-10 flex items-center justify-between bg-white px-5 py-4 border-b border-gray-100 rounded-t-3xl sm:rounded-t-2xl">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
                {activeFilterCount > 0 && (
                  <span className="inline-flex h-6 items-center rounded-full bg-gray-900 px-2 text-xs font-medium text-white">
                    {activeFilterCount} activos
                  </span>
                )}
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-5 py-4 space-y-6">
              {categories.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Categorías</h3>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/search?${buildParams({ category: "" })}`}
                      className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${!activeCategoryId ? "bg-gray-900 text-white" : "border border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                      Todas
                    </Link>
                    {categories.map((cat) => (
                      <Link key={cat.id} href={`/search?${buildParams({ category: cat.id })}`}
                        className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${activeCategoryId === cat.id ? "bg-gray-900 text-white" : "border border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Precio</h3>
                <div className="space-y-1">
                  {priceRanges.map((range) => (
                    <Link key={range.label} href={range.href}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${range.active ? "bg-gray-100 font-medium text-gray-900" : "text-gray-600 hover:bg-gray-50"}`}>
                      <span>{range.label}</span>
                      <span className="text-xs text-gray-400">{range.count}</span>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Disponibilidad</h3>
                <div className="space-y-1">
                  <Link href={`/search?${buildParams({ in_stock: activeInStock ? undefined : "true" })}`}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${activeInStock ? "bg-gray-100 font-medium text-gray-900" : "text-gray-600 hover:bg-gray-50"}`}>
                    <span className={`flex h-5 w-5 items-center justify-center rounded border-2 ${activeInStock ? "border-gray-900 bg-gray-900" : "border-gray-300"}`}>
                      {activeInStock && <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                    </span>
                    Solo en stock
                  </Link>
                  <Link href={`/search?${buildParams({ on_sale: activeOnSale ? undefined : "true" })}`}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${activeOnSale ? "bg-gray-100 font-medium text-gray-900" : "text-gray-600 hover:bg-gray-50"}`}>
                    <span className={`flex h-5 w-5 items-center justify-center rounded border-2 ${activeOnSale ? "border-gray-900 bg-gray-900" : "border-gray-300"}`}>
                      {activeOnSale && <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                    </span>
                    En oferta
                  </Link>
                </div>
              </div>

              {attributeGroups.length > 0 && attributeGroups.map((group) => (
                <div key={group.slug} className="border-t border-gray-100 pt-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">{group.name}</h3>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {group.values.map((v) => {
                      const attrKey = `f_${group.slug}`
                      const isActive = activeAttributeFilters[group.slug] === v.value
                      return (
                        <Link
                          key={v.valueSlug}
                          href={`/search?${buildParams({ [attrKey]: isActive ? "" : v.value })}`}
                          className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                            isActive ? "bg-gray-100 font-medium text-gray-900" : "text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          <span>{v.value}</span>
                          <span className="text-xs text-gray-400">{v.count}</span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}

              {activeFilterCount > 0 && (
                <div className="border-t border-gray-100 pt-4">
                  <Link href={`/search${query ? `?q=${query}` : ""}`}
                    className="flex items-center justify-center rounded-full border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    Limpiar filtros
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
