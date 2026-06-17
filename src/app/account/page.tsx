"use client"

import StoreLayout from "@/components/layout/StoreLayout"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<{ full_name: string; email: string } | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/login"); return }
      setUser(user)
      const { data: profile } = await supabase.from("profiles").select("full_name, email").eq("id", user.id).single()
      setProfile(profile)
      setLoading(false)
    }
    getData()
  }, [supabase, router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <StoreLayout>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {loading ? <p className="text-gray-600">Cargando...</p> : (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Mi Cuenta</h1>
                <p className="mt-1 text-sm text-gray-600">{profile?.full_name || user?.email}</p>
              </div>
              <button onClick={handleLogout} className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cerrar Sesión</button>
            </div>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <a href="/account/orders" className="rounded-xl border border-gray-200 p-6 hover:border-gray-300"><h2 className="text-lg font-semibold text-gray-900">Mis Pedidos</h2><p className="mt-1 text-sm text-gray-600">Historial y seguimiento</p></a>
              <a href="/account/addresses" className="rounded-xl border border-gray-200 p-6 hover:border-gray-300"><h2 className="text-lg font-semibold text-gray-900">Direcciones</h2><p className="mt-1 text-sm text-gray-600">Gestiona tus direcciones</p></a>
              <a href="/account/favorites" className="rounded-xl border border-gray-200 p-6 hover:border-gray-300"><h2 className="text-lg font-semibold text-gray-900">Favoritos</h2><p className="mt-1 text-sm text-gray-600">Productos guardados</p></a>
            </div>
          </>
        )}
      </div>
    </StoreLayout>
  )
}
