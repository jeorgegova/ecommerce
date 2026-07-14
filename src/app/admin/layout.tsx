"use client"

import AdminHeader from "@/components/admin/AdminHeader"
import AdminSidebar from "@/components/admin/AdminSidebar"
import MobileBottomNav from "@/components/layout/MobileBottomNav"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [userName, setUserName] = useState<string>("")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, full_name")
        .eq("id", user.id)
        .single()

      if (profile?.role !== "admin") {
        router.push("/")
        return
      }

      setUserName(profile.full_name || user.email || "")
      setIsAdmin(true)
    }
    checkAdmin()
  }, [supabase, router])

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }, [supabase, router])

  if (isAdmin === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
          <p className="mt-3 text-sm text-gray-500">Verificando acceso...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userName={userName}
        onLogout={handleLogout}
      />
      <div className="lg:pl-60">
        <AdminHeader />
        <main className="p-4 sm:p-6 lg:p-8 pb-32">{children}</main>
      </div>
      <MobileBottomNav />
    </div>
  )
}
