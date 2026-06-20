"use client"

import ProductCard from "@/components/store/ProductCard"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"

export default function HistoryPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from("view_history")
        .select("*, products(id, name, slug, base_price, sale_price, promotion_active)")
        .eq("user_id", user.id)
        .order("viewed_at", { ascending: false })
        .limit(50)

      if (data && data.length > 0) {
        const productIds = data.map((item: any) => item.product_id)
        const { data: allImages } = await supabase
          .from("product_images")
          .select("product_id, url")
          .in("product_id", productIds)
          .order("sort_order")

        const imageMap = new Map<string, string[]>()
        if (allImages) {
          for (const img of allImages) {
            if (!imageMap.has(img.product_id)) imageMap.set(img.product_id, [])
            imageMap.get(img.product_id)!.push(img.url)
          }
        }

        const enriched = data.map((item: any) => ({
          ...item,
          allImages: imageMap.get(item.product_id) || [],
        }))
        setItems(enriched)
      } else {
        setItems(data || [])
      }
      setLoading(false)
    }
    fetch()
  }, [supabase])

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900">Vistos Recientemente</h1>
      {loading ? <p className="mt-8 text-gray-600">Cargando...</p> : items.length === 0 ? (
        <p className="mt-12 text-center text-gray-500">No has visto productos aún</p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item: any) => {
            const p = item.products
            if (!p) return null
            return (
              <div key={item.id}>
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
                  images={item.allImages || []}
                />
                <p className="mt-1 text-xs text-gray-400">{new Date(item.viewed_at).toLocaleDateString("es-CO")}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
