"use client"

import AuthModal from "@/components/auth/AuthModal"
import FlyToCartLayer from "@/components/store/FlyToCartLayer"
import { SearchProvider } from "@/components/store/SearchContext"
import { useCartStore } from "@/stores/cart"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useEffect, useState } from "react"

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
  const initCart = useCartStore((state) => state.initCart)

  useEffect(() => {
    void initCart()
  }, [initCart])

  return (
    <QueryClientProvider client={queryClient}>
      <SearchProvider>
        {children}
        <FlyToCartLayer />
        <AuthModal />
      </SearchProvider>
    </QueryClientProvider>
  )
}
