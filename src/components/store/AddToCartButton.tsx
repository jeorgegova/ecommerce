"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface AddToCartButtonProps {
  productId: string
  variantId?: string | null
  stock: number
  hasVariants: boolean
}

export default function AddToCartButton({
  productId,
  variantId,
  stock,
  hasVariants,
}: AddToCartButtonProps) {
  const [loading, setLoading] = useState(false)
  const [added, setAdded] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleClick = async () => {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push("/login?redirect=" + encodeURIComponent(window.location.pathname))
      return
    }

    const newItem = {
      user_id: user.id,
      product_id: productId,
      variant_id: variantId || null,
      quantity: 1,
    }

    const { data: existing } = await supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("user_id", user.id)
      .eq("product_id", productId)
      .maybeSingle()

    if (existing) {
      await supabase
        .from("cart_items")
        .update({ quantity: existing.quantity + 1 })
        .eq("id", existing.id)
    } else {
      await supabase.from("cart_items").insert(newItem)
    }

    setAdded(true)
    setLoading(false)
    setTimeout(() => setAdded(false), 2000)
  }

  if (stock <= 0 && !hasVariants) {
    return (
      <p className="text-sm text-red-500">Producto agotado</p>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="rounded-full bg-gray-900 px-8 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
    >
      {loading ? "Agregando..." : added ? "✓ Agregado" : "Agregar al Carrito"}
    </button>
  )
}
