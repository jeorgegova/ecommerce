"use client"

import { createClient } from "@/lib/supabase/client"
import { useSearchContext } from "@/components/store/SearchContext"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { usePathname } from "next/navigation"
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
  const pathname = usePathname()
  const supabase = createClient()
  const { submitSearch } = useSearchContext()

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.length < 2) { setSuggestions([]); setOpen(false); return }
    debounceRef.current = setTimeout(async () => {
      const { data } = await supabase.rpc("autocomplete_products", { p_query: query })
      setSuggestions(data || []); setOpen(true); setSelectedIndex(-1)
    }, 200)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, supabase])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) && !inputRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
      const sug = suggestions[selectedIndex]
      router.push(sug.suggestion_type === "category" ? `/categories/${sug.slug}` : `/products/${sug.slug}`)
    } else {
      if (pathname === "/") { submitSearch(query.trim()) }
      else { router.push(`/?q=${encodeURIComponent(query)}`) }
    }
    setOpen(false); setQuery("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || suggestions.length === 0) return
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1)) }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex((prev) => Math.max(prev - 1, 0)) }
    else if (e.key === "Escape") { setOpen(false); inputRef.current?.blur() }
  }

  return (
    <div className="relative w-full max-w-lg">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => suggestions.length > 0 && setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar..."
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-gray-300 focus:bg-white focus:outline-none focus:ring-0 hover:border-gray-300"
          />
          {query.length > 0 && (
            <button type="button" onClick={() => { setQuery(""); setSuggestions([]); setOpen(false); inputRef.current?.focus() }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>
      </form>

      {open && suggestions.length > 0 && (
        <div ref={dropdownRef} className="absolute top-full left-0 right-0 z-50 mt-2 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl shadow-gray-100 animate-scale-in origin-top">
          <div className="px-2 py-1.5">
            {suggestions.map((sug, i) => (
              <Link
                key={`${sug.suggestion_type}-${sug.slug}`}
                href={sug.suggestion_type === "category" ? `/categories/${sug.slug}` : `/products/${sug.slug}`}
                onClick={() => { setOpen(false); setQuery("") }}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                  i === selectedIndex ? "bg-gray-50" : "hover:bg-gray-50"
                }`}
              >
                <span className={`flex-shrink-0 rounded-lg px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                  sug.suggestion_type === "product" ? "bg-gray-100 text-gray-500" : "bg-blue-50 text-blue-600"
                }`}>{sug.suggestion_type === "product" ? "Prod." : "Cat."}</span>
                <span className="text-gray-700 truncate">{sug.suggestion_text}</span>
              </Link>
            ))}
          </div>
          <div className="border-t border-gray-50 px-4 py-2.5">
            <button
              type="button"
              onClick={handleSubmit}
              className="flex w-full items-center justify-center gap-1.5 text-[13px] font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              Buscar &ldquo;{query}&rdquo;
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
