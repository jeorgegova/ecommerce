"use client"

import { createClient } from "@/lib/supabase/client"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"

interface ViewedProduct {
  id?: string
  product_id: string
  product_name: string
  product_slug: string
  product_price: number
  product_sale_price: number | null
  product_promotion_active: boolean
  product_image: string | null
  viewed_at: string
}

export default function RecentlyViewed() {
  const [items, setItems] = useState<ViewedProduct[]>([])
  const supabase = createClient()

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data } = await supabase
          .from("view_history")
          .select("*, products(name, slug, base_price, sale_price, promotion_active, product_images(url, is_main))")
          .eq("user_id", user.id)
          .order("viewed_at", { ascending: false })
          .limit(5)

        if (data) {
          setItems(
            data
              .filter((item: any) => item.products)
              .map((item: any) => {
                const images = item.products?.product_images
                const mainImage = Array.isArray(images)
                  ? images.find((img: any) => img.is_main)?.url || images[0]?.url || null
                  : null
                return {
                  product_id: item.product_id,
                  product_name: item.products.name,
                  product_slug: item.products.slug,
                  product_price: item.products.base_price,
                  product_sale_price: item.products.sale_price,
                  product_promotion_active: item.products.promotion_active,
                  product_image: mainImage,
                  viewed_at: item.viewed_at,
                }
              })
          )
        }
      } else {
        const stored = localStorage.getItem("gogi_recent")
        if (stored) {
          try {
            setItems(JSON.parse(stored).slice(0, 5))
          } catch {}
        }
      }
    }
    fetch()
  }, [supabase])

  if (items.length === 0) return null

  return (
    <div className="sticky top-24">
      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Vistos recientemente</h3>
      <div className="mt-3 space-y-3">
        {items.map((item) => (
          <Link
            key={item.product_id + item.viewed_at}
            href={`/products/${item.product_slug}`}
            className="group flex gap-3 rounded-lg border border-gray-100 p-2 hover:border-gray-200 hover:bg-gray-50 transition-all"
          >
            <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
              {item.product_image ? (
                <Image src={item.product_image} alt={item.product_name} width={56} height={56} className="h-full w-full object-cover" />
              ) : null}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-900 leading-tight line-clamp-2 group-hover:text-gray-600">{item.product_name}</p>
              <p className="mt-0.5 flex items-baseline gap-1.5">
                {item.product_sale_price && item.product_promotion_active ? (
                  <>
                    <span className="text-xs font-semibold text-gray-900">${Number(item.product_sale_price).toLocaleString("es-CO")}</span>
                    <span className="text-[10px] text-gray-400 line-through">${Number(item.product_price).toLocaleString("es-CO")}</span>
                  </>
                ) : (
                  <span className="text-xs font-semibold text-gray-900">${Number(item.product_price).toLocaleString("es-CO")}</span>
                )}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
