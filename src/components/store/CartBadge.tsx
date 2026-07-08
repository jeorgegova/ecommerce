"use client"

import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function CartBadge({ className, onClick, showLabel }: { className?: string; onClick?: () => void; showLabel?: boolean }) {
  const [count, setCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    let cancelled = false

    const fetchCount = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) return

      const { count: itemCount } = await supabase
        .from("cart_items")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)

      if (!cancelled) setCount(itemCount ?? 0)
    }

    fetchCount()

    const handleVisibility = () => {
      if (document.visibilityState === "visible") fetchCount()
    }
    document.addEventListener("visibilitychange", handleVisibility)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchCount()
    })

    return () => {
      cancelled = true
      document.removeEventListener("visibilitychange", handleVisibility)
      subscription.unsubscribe()
    }
  }, [supabase])

  return (
    <Link href="/cart" className={`relative inline-flex items-center gap-2 ${className || ""}`} onClick={onClick}>
      <svg className="h-6 w-6 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M2.25 2.25a.75.75 0 000 1.5h1.386c.17 0 .318.114.362.278l2.558 9.592a3.752 3.752 0 00-2.806 3.63c0 .414.336.75.75.75h15.75a.75.75 0 000-1.5H5.378A2.25 2.25 0 017.5 15h11.218a2.25 2.25 0 002.163-1.684l2.25-8.25A2.25 2.25 0 0020.97 2.25H5.256l-.624-2.34A1.862 1.862 0 003.636.75H2.25a.75.75 0 000 1.5zm7.5 17.25a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm6.75 0a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" />
      </svg>
      {showLabel && <span>Carrito</span>}
      {count > 0 && (
        <span className="absolute -top-2 -right-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gray-900 px-1 text-[11px] font-bold text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  )
}
