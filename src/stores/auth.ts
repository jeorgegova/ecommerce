import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { create } from "zustand"

interface AuthState {
  user: User | null
  loading: boolean
  userName: string | undefined
  isAdmin: boolean
  setUser: (user: User | null) => void
  refresh: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  userName: undefined,
  isAdmin: false,

  setUser: (user) => {
    if (user) {
      set({ user, loading: false })
    } else {
      set({ user: null, loading: false, userName: undefined, isAdmin: false })
    }
  },

  refresh: async () => {
    const supabase = createClient()
    const { data } = await supabase.auth.getUser()
    if (data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, full_name")
        .eq("id", data.user.id)
        .single()
      set({
        user: data.user,
        loading: false,
        isAdmin: profile?.role === "admin",
        userName: profile?.full_name || data.user.email?.split("@")[0],
      })
    } else {
      set({ user: null, loading: false, userName: undefined, isAdmin: false })
    }
  },
}))
