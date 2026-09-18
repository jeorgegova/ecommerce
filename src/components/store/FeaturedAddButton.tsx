"use client"

import { createClient } from "@/lib/supabase/client"
import { flyToCart, notifyCartUpdated } from "@/lib/cart/fly"
import { useAuthModal } from "@/stores/auth-modal"
import { useState } from "react"

export default function FeaturedAddButton({
  productId,
  stock,
  hasVariants,
  price,
}: {
  productId: string
  stock: number
  hasVariants: boolean
  price: number
}) {
  const [loading, setLoading] = useState(false)
  const [added, setAdded] = useState(false)
  const supabase = createClient()
  const { openAuth } = useAuthModal()

  if (stock <= 0 && !hasVariants) {
    return (
      <span className="flex h-10 w-full items-center justify-center rounded-full border border-gray-200 bg-gray-50 px-6 text-xs font-bold uppercase tracking-widest text-gray-400">
        Agotado
      </span>
    )
  }

  const handleAdd = async (e: React.MouseEvent<HTMLButtonElement>) => {
    const buttonRect = e.currentTarget.getBoundingClientRect()
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      openAuth("login", window.location.pathname)
      setLoading(false)
      return
    }

    flyToCart(buttonRect)

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
      await supabase
        .from("cart_items")
        .insert({ user_id: user.id, product_id: productId, quantity: 1 })
    }

    notifyCartUpdated(1, price)
    setAdded(true)
    setLoading(false)
    setTimeout(() => setAdded(false), 1800)
  }

  return (
    <button
      onClick={handleAdd}
      disabled={loading}
      className={`flex h-10 w-full items-center justify-center gap-2 rounded-full px-6 text-xs font-bold uppercase tracking-widest text-white transition-colors duration-200 disabled:opacity-60 ${
        added ? "bg-emerald-600" : "bg-[#C8102E] hover:bg-[#9E0C24]"
      }`}
    >
      {loading ? (
        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : added ? (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      ) : null}
      {added ? "Agregado" : "Agregar al carrito"}
    </button>
  )
}
