"use client"

import StoreLayout from "@/components/layout/StoreLayout"
import FavoriteButton from "@/components/store/FavoriteButton"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { useEffect, useState } from "react"

interface Favorite {
  id: string
  product_id: string
  created_at: string
  products: { id: string; name: string; slug: string; base_price: number; sale_price: number | null; stock: number; has_variants: boolean } | null
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from("favorites")
        .select("*, products(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      setFavorites(data || [])
      setLoading(false)
    }
    fetch()
  }, [supabase])

  return (
    <StoreLayout>
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-bold text-gray-900">Favoritos</h1>

        {loading ? (
          <p className="mt-8 text-gray-600">Cargando...</p>
        ) : favorites.length === 0 ? (
          <div className="mt-12 text-center">
            <p className="text-gray-500">No tienes favoritos aún</p>
            <Link href="/products" className="mt-4 inline-block rounded-full bg-gray-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-800">
              Ver productos
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favorites.map((fav) => {
              if (!fav.products) return null
              const p = fav.products
              const currentPrice = p.sale_price || p.base_price

              return (
                <div key={fav.id} className="group relative rounded-xl border border-gray-200 p-4 hover:border-gray-300">
                  <Link href={`/products/${p.slug}`}>
                    <div className="aspect-square rounded-lg bg-gray-100" />
                    <div className="mt-3">
                      <h3 className="font-medium text-gray-900 group-hover:text-gray-600">{p.name}</h3>
                      <p className="mt-1 font-semibold text-gray-900">${Number(currentPrice).toLocaleString("es-CO")}</p>
                    </div>
                  </Link>
                  <div className="absolute right-4 top-4">
                    <FavoriteButton productId={p.id} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </StoreLayout>
  )
}
