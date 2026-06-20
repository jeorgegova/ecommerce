"use client"

import FavoriteButton from "@/components/store/FavoriteButton"
import ProductCard from "@/components/store/ProductCard"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"

interface Favorite {
  id: string
  product_id: string
  created_at: string
  products: { id: string; name: string; slug: string; base_price: number; sale_price: number | null; promotion_active: boolean; stock: number; has_variants: boolean } | null
  mainImage: string | null
  allImages: string[]
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
        .select("*, products(id, name, slug, base_price, sale_price, promotion_active, stock, has_variants)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (data && data.length > 0) {
        const productIds = data.map((f: any) => f.product_id)
        const [{ data: listed }, { data: allImages }] = await Promise.all([
          supabase.from("product_listing").select("id, main_image").in("id", productIds),
          supabase.from("product_images").select("product_id, url").in("product_id", productIds).order("sort_order"),
        ])

        const imageMap = new Map<string, string[]>()
        if (allImages) {
          for (const img of allImages) {
            if (!imageMap.has(img.product_id)) imageMap.set(img.product_id, [])
            imageMap.get(img.product_id)!.push(img.url)
          }
        }

        const enriched = data.map((f: any) => ({
          ...f,
          allImages: imageMap.get(f.product_id) || [],
          mainImage: (listed || []).find((p: any) => p.id === f.product_id)?.main_image || null,
        }))
        setFavorites(enriched)
      } else {
        setFavorites(data || [])
      }
      setLoading(false)
    }
    fetch()
  }, [supabase])

  return (
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
            const images = fav.allImages.length > 0 ? fav.allImages : (fav.mainImage ? [fav.mainImage] : [])

            return (
              <div key={fav.id} className="group relative">
                <ProductCard
                  product={{
                    id: p.id,
                    name: p.name,
                    slug: p.slug,
                    base_price: p.base_price,
                    sale_price: p.sale_price,
                    promotion_active: p.promotion_active,
                    current_price: (p.sale_price && p.promotion_active) ? p.sale_price : p.base_price,
                  }}
                  images={images}
                />
                <div className="absolute right-4 top-4">
                  <FavoriteButton productId={p.id} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
