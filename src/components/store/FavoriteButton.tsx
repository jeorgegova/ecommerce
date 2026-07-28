"use client"

import { createClient } from "@/lib/supabase/client"
import { useAuthModal } from "@/stores/auth-modal"
import { useEffect, useState } from "react"

export default function FavoriteButton({ productId }: { productId: string }) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [loading, setLoading] = useState(true)
  const [bouncing, setBouncing] = useState(false)
  const supabase = createClient()
  const { openAuth } = useAuthModal()

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("product_id", productId)
        .maybeSingle()

      setIsFavorite(!!data)
      setLoading(false)
    }
    check()
  }, [supabase, productId])

  const toggle = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      openAuth("login", window.location.pathname)
      return
    }

    if (isFavorite) {
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("product_id", productId)
      setIsFavorite(false)
    } else {
      await supabase.from("favorites").insert({ user_id: user.id, product_id: productId })
      setIsFavorite(true)
      setBouncing(true)
      setTimeout(() => setBouncing(false), 600)
    }
  }

  if (loading) {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">
        <svg className="h-4 w-4 animate-pulse text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </div>
    )
  }

  return (
    <button
      onClick={toggle}
      className={`group relative flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 ${
        isFavorite
          ? "bg-red-50 text-red-500 shadow-sm shadow-red-100 hover:bg-red-100"
          : "bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
      }`}
      aria-label={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
    >
      <svg
        className={`h-[18px] w-[18px] transition-all duration-300 ${
          bouncing ? "scale-125" : "scale-100"
        } ${
          isFavorite ? "fill-red-500 stroke-red-500" : "fill-none stroke-current group-hover:stroke-gray-600"
        }`}
        viewBox="0 0 24 24"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    </button>
  )
}
