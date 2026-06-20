"use client"

import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

interface Suggestion {
  suggestion_type: "product" | "category"
  suggestion_text: string
  slug: string
}

export default function SearchBar() {
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (query.length < 2) {
      setSuggestions([])
      setOpen(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      const { data } = await supabase.rpc("autocomplete_products", {
        p_query: query,
      })
      setSuggestions(data || [])
      setOpen(true)
      setSelectedIndex(-1)
    }, 200)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, supabase])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
      const sug = suggestions[selectedIndex]
      if (sug.suggestion_type === "category") {
        router.push(`/categories/${sug.slug}`)
      } else {
        router.push(`/products/${sug.slug}`)
      }
    } else {
      router.push(`/search?q=${encodeURIComponent(query)}`)
    }
    setOpen(false)
    setQuery("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || suggestions.length === 0) return

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === "Escape") {
      setOpen(false)
    }
  }

  return (
    <div className="relative flex-1 max-w-lg">
      <form onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Buscar productos..."
          className="w-full rounded-full border border-gray-300 bg-gray-50 px-4 py-2 pl-10 text-sm placeholder-gray-400 focus:border-gray-900 focus:bg-white focus:outline-none"
        />
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </form>

      {open && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 z-50 mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg"
        >
          {suggestions.map((sug, i) => (
            <Link
              key={`${sug.suggestion_type}-${sug.slug}`}
              href={
                sug.suggestion_type === "category"
                  ? `/categories/${sug.slug}`
                  : `/products/${sug.slug}`
              }
              onClick={() => {
                setOpen(false)
                setQuery("")
              }}
              className={`flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 ${
                i === selectedIndex ? "bg-gray-50" : ""
              }`}
            >
              <span
                className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                  sug.suggestion_type === "product"
                    ? "bg-gray-100 text-gray-600"
                    : "bg-blue-50 text-blue-600"
                }`}
              >
                {sug.suggestion_type === "product" ? "Producto" : "Categoría"}
              </span>
              <span className="text-gray-900">{sug.suggestion_text}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
