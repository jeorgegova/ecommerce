"use client"

import Breadcrumb from "@/components/layout/Breadcrumb"
import StoreLayout from "@/components/layout/StoreLayout"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
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
        .select("role")
        .eq("id", user.id)
        .single()

      if (profile?.role !== "admin") {
        router.push("/")
        return
      }

      setIsAdmin(true)
    }
    checkAdmin()
  }, [supabase, router])

  if (isAdmin === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-600">Verificando acceso...</p>
      </div>
    )
  }

  return (
    <StoreLayout>
      <Breadcrumb />
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </StoreLayout>
  )
}
