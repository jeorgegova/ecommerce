"use client"

import { useRouter } from "next/navigation"
import { useRef, useState } from "react"

export default function DynamicSearchInput({
  initialQuery,
  currentParams,
}: {
  initialQuery: string
  currentParams: Record<string, string>
}) {
  const [value, setValue] = useState(initialQuery)
  const router = useRouter()
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const navigate = (q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const params = new URLSearchParams(currentParams)
    if (q.trim()) {
      params.set("q", q.trim())
    } else {
      params.delete("q")
    }
    params.delete("page")
    router.replace(`/search?${params.toString()}`)
  }

  return (
    <form
      key={initialQuery}
      onSubmit={(e) => {
        e.preventDefault()
        if (debounceRef.current) clearTimeout(debounceRef.current)
        navigate(value)
      }}
      className="flex-1 min-w-0"
    >
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>
        <input
          defaultValue={initialQuery}
          onChange={(e) => {
            const v = e.target.value
            setValue(v)
            if (debounceRef.current) clearTimeout(debounceRef.current)
            debounceRef.current = setTimeout(() => navigate(v), 400)
          }}
          placeholder="Buscar productos..."
          className="block w-full rounded-full border border-gray-200 bg-white pl-9 pr-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
        />
      </div>
    </form>
  )
}
