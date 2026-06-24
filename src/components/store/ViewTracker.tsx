"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useRef } from "react"

export default function ViewTracker({ productId, productName, productSlug, productPrice, productSalePrice, productImage }: {
  productId: string
  productName?: string
  productSlug?: string
  productPrice?: number
  productSalePrice?: number | null
  productImage?: string | null
}) {
  const supabase = createClient()
  const tracked = useRef(false)

  useEffect(() => {
    if (tracked.current) return
    tracked.current = true

    const track = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        await supabase.from("view_history").upsert(
          { user_id: user.id, product_id: productId, viewed_at: new Date().toISOString() },
          { onConflict: "user_id, product_id", ignoreDuplicates: false }
        )

        await supabase.from("product_views").upsert(
          { product_id: productId, user_id: user.id, viewed_at: new Date().toISOString() },
          { onConflict: "product_id, user_id", ignoreDuplicates: false }
        )
      } else {
        await supabase.from("product_views").insert({ product_id: productId })

        if (productName && productSlug) {
          const stored = localStorage.getItem("gogi_recent")
          let recent: any[] = stored ? JSON.parse(stored) : []
          recent = recent.filter((r: any) => r.product_id !== productId)
          recent.unshift({ product_id: productId, product_name: productName, product_slug: productSlug, product_price: productPrice || 0, product_sale_price: productSalePrice || null, product_image: productImage || null, viewed_at: new Date().toISOString() })
          localStorage.setItem("gogi_recent", JSON.stringify(recent.slice(0, 10)))
        }
      }

      const { data: current } = await supabase.from("products").select("views_count").eq("id", productId).single()
      if (current) {
        await supabase.from("products").update({ views_count: (current.views_count || 0) + 1 }).eq("id", productId)
      }
    }

    track()
  }, [productId, supabase, productName, productSlug, productPrice, productSalePrice])

  return null
}
