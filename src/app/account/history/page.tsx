"use client"

import { createClient } from "@/lib/supabase/client"
import Image from "next/image"
import Link from "next/link"
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
        .select("*, products(id, name, slug, base_price, sale_price)")
        .eq("user_id", user.id)
        .order("viewed_at", { ascending: false })
        .limit(50)

      if (data && data.length > 0) {
        const productIds = data.map((item: any) => item.product_id)
        const { data: listed } = await supabase
          .from("product_listing")
          .select("id, main_image")
          .in("id", productIds)

        const imageMap = new Map((listed || []).map((p: any) => [p.id, p.main_image]))
        const enriched = data.map((item: any) => ({ ...item, mainImage: imageMap.get(item.product_id) || null }))
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
              <Link key={item.id} href={`/products/${p.slug}`} className="rounded-xl border border-gray-200 p-4 hover:border-gray-300">
                <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
                  {item.mainImage ? (
                    <Image src={item.mainImage} alt={p.name} fill className="object-cover" sizes="(max-width: 640px) 50vw, 33vw" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-gray-400">Sin imagen</div>
                  )}
                </div>
                <h3 className="mt-3 font-medium text-gray-900">{p.name}</h3>
                <p className="mt-1 font-semibold text-gray-900">${Number(p.sale_price || p.base_price).toLocaleString("es-CO")}</p>
                <p className="mt-1 text-xs text-gray-400">{new Date(item.viewed_at).toLocaleDateString("es-CO")}</p>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
