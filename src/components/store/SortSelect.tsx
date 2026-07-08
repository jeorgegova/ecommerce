"use client"

import { useRouter } from "next/navigation"

const sortOptions = [
  { value: "relevance", label: "Relevancia" },
  { value: "price_asc", label: "Precio: Menor a Mayor" },
  { value: "price_desc", label: "Precio: Mayor a Menor" },
  { value: "sales", label: "Más Vendidos" },
  { value: "rating", label: "Mejor Valorados" },
  { value: "newest", label: "Más Nuevos" },
]

export default function SortSelect({ currentSort, currentParams }: { currentSort: string; currentParams: Record<string, string> }) {
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(currentParams)
    if (e.target.value) {
      params.set("sort", e.target.value)
    } else {
      params.delete("sort")
    }
    params.delete("page")
    router.push(`/search?${params.toString()}`)
  }

  return (
    <select
      value={currentSort}
      onChange={handleChange}
      className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-gray-900 focus:outline-none"
    >
      {sortOptions.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}
