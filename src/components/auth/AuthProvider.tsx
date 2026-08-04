"use client"

import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/stores/auth"
import { useEffect } from "react"

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const refresh = useAuthStore((s) => s.refresh)

  useEffect(() => {
    refresh()

    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) {
        refresh()
      } else {
        useAuthStore.setState({ user: null, loading: false, userName: undefined, isAdmin: false })
      }
    })

    return () => subscription.unsubscribe()
  }, [refresh])

  return <>{children}</>
}
