"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

interface SearchContextType {
  query: string
  setQuery: (q: string) => void
  submitSearch: (q: string) => void
}

const SearchContext = createContext<SearchContextType>({
  query: "",
  setQuery: () => {},
  submitSearch: () => {},
})

export function SearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("")

  const submitSearch = useCallback((q: string) => {
    setQuery(q)
  }, [])

  return (
    <SearchContext.Provider value={{ query, setQuery, submitSearch }}>
      {children}
    </SearchContext.Provider>
  )
}

export function useSearchContext() {
  return useContext(SearchContext)
}
