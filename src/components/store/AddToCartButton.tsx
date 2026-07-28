"use client"

import { createClient } from "@/lib/supabase/client"
import { useAuthModal } from "@/stores/auth-modal"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

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
  const [cartQty, setCartQty] = useState(0)
  const [animating, setAnimating] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { openAuth } = useAuthModal()

  useEffect(() => {
    const checkCart = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from("cart_items")
        .select("quantity")
        .eq("user_id", user.id)
        .eq("product_id", productId)
        .maybeSingle()
      if (data) setCartQty(data.quantity)
    }
    checkCart()
  }, [supabase, productId])

  const handleAdd = async () => {
    setLoading(true)
    setAnimating(false)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      openAuth("login", window.location.pathname)
      setLoading(false)
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
      setCartQty(existing.quantity + 1)
    } else {
      await supabase.from("cart_items").insert(newItem)
      setCartQty(1)
    }

    setAdded(true)
    setAnimating(true)
    setLoading(false)
    setTimeout(() => {
      setAdded(false)
      setAnimating(false)
    }, 1800)
  }

  const handleQtyChange = async (delta: number) => {
    const newQty = cartQty + delta
    if (newQty < 0) return

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: existing } = await supabase
      .from("cart_items")
      .select("id")
      .eq("user_id", user.id)
      .eq("product_id", productId)
      .maybeSingle()

    if (newQty === 0 && existing) {
      await supabase.from("cart_items").delete().eq("id", existing.id)
      setCartQty(0)
    } else if (existing) {
      await supabase.from("cart_items").update({ quantity: newQty }).eq("id", existing.id)
      setCartQty(newQty)
    }
    setLoading(false)
  }

  if (stock <= 0 && !hasVariants) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
        <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
        <span className="text-sm font-medium text-red-600">Producto agotado</span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {cartQty > 0 ? (
        <div className="flex items-stretch gap-2">
          <button
            onClick={() => handleQtyChange(-1)}
            disabled={loading}
            className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-gray-200 text-gray-600 transition-all hover:border-gray-300 hover:bg-gray-50 active:scale-95 disabled:opacity-50"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
            </svg>
          </button>

          <div className="flex flex-1 items-center justify-center rounded-xl border-2 border-gray-200 bg-gray-50">
            <span className="text-sm font-semibold text-gray-900">
              {cartQty} en el carrito
            </span>
          </div>

          <button
            onClick={() => handleQtyChange(1)}
            disabled={loading || (stock > 0 && cartQty >= stock)}
            className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-gray-200 text-gray-600 transition-all hover:border-gray-300 hover:bg-gray-50 active:scale-95 disabled:opacity-50"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        </div>
      ) : (
        <button
          onClick={handleAdd}
          disabled={loading}
          className={`group relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl px-6 py-3.5 text-sm font-semibold text-white transition-all duration-300 disabled:cursor-not-allowed ${
            added
              ? "bg-green-500 shadow-lg shadow-green-200"
              : "bg-gray-900 shadow-md shadow-gray-200 hover:bg-gray-800 hover:shadow-lg hover:shadow-gray-300 active:scale-[0.98]"
          }`}
        >
          {loading && !added ? (
            <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : added ? (
            <svg className={`h-5 w-5 ${animating ? "animate-bounce" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          ) : (
            <svg className="h-5 w-5 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 003 3h4.5a3 3 0 003-3l1.5-6.75H5.197m2.303 10.5H7.5m4.5 0a3 3 0 01-3-3m6 0a3 3 0 01-3 3m0 0v1.5a1.5 1.5 0 01-3 0v-1.5" />
            </svg>
          )}

          <span>{added ? "Agregado" : "Agregar al Carrito"}</span>
        </button>
      )}

      {cartQty > 0 && (
        <button
          onClick={() => router.push("/cart")}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-gray-200 px-6 py-3 text-sm font-semibold text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98]"
        >
          Ir al carrito
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </button>
      )}

      {stock > 0 && stock <= 5 && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-amber-600">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          Quedan solo {stock} unidades
        </p>
      )}
    </div>
  )
}
