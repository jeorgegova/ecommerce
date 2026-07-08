"use client"

import AuthModal from "@/components/auth/AuthModal"
import { SearchProvider } from "@/components/store/SearchContext"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <SearchProvider>
        {children}
        <AuthModal />
      </SearchProvider>
    </QueryClientProvider>
  )
}
