"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect } from "react"

export default function ViewTracker({ productId }: { productId: string }) {
  const supabase = createClient()

  useEffect(() => {
    const track = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        await supabase.from("view_history").insert({ user_id: user.id, product_id: productId })
      }

      await supabase.from("product_views").insert({
        product_id: productId,
        user_id: user?.id || null,
      })

      await supabase.from("products").update({ views_count: (await supabase.from("products").select("views_count").eq("id", productId).single()).data!.views_count + 1 }).eq("id", productId)
    }

    track()
  }, [productId, supabase])

  return null
}
