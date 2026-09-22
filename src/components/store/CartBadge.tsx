"use client"

import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { readGuestCart } from "@/lib/cart/guest"

export default function CartBadge({ className, onClick, showLabel, showTotal }: { className?: string; onClick?: () => void; showLabel?: boolean; showTotal?: boolean }) {
  const [count, setCount] = useState(0)
  const [total, setTotal] = useState(0)
  const [pulse, setPulse] = useState(false)
  const pulseTimeout = useRef<NodeJS.Timeout | null>(null)
  const supabase = createClient()

  useEffect(() => {
    let cancelled = false

    const fetchCount = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) {
        if (!user) {
          const guestItems = readGuestCart()
          setCount(guestItems.reduce((sum, item) => sum + item.quantity, 0))
          if (showTotal && guestItems.length > 0) {
            const productIds = guestItems.map((item) => item.productId)
            const variantIds = guestItems.flatMap((item) => item.variantId ? [item.variantId] : [])
            const [{ data: products }, { data: variants }] = await Promise.all([
              supabase.from("products").select("id, base_price, sale_price, promotion_active").in("id", productIds),
              variantIds.length
                ? supabase.from("product_variants").select("id, price_adjustment").in("id", variantIds)
                : Promise.resolve({ data: [] }),
            ])
            if (cancelled) return

            const productMap = new Map((products || []).map((product) => [product.id, product]))
            const variantMap = new Map((variants || []).map((variant) => [variant.id, variant]))
            const guestTotal = guestItems.reduce((sum, item) => {
              const product = productMap.get(item.productId)
              if (!product) return sum
              const price = product.promotion_active && product.sale_price ? product.sale_price : product.base_price
              const adjustment = item.variantId ? variantMap.get(item.variantId)?.price_adjustment || 0 : 0
              return sum + (price + adjustment) * item.quantity
            }, 0)
            setTotal(guestTotal)
          } else {
            setTotal(0)
          }
        }
        return
      }

      const { count: itemCount } = await supabase
        .from("cart_items")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)

      if (!cancelled) setCount(itemCount ?? 0)

      if (showTotal) {
        const { data: items } = await supabase
          .from("cart_items")
          .select("quantity, products(base_price, sale_price, promotion_active)")
          .eq("user_id", user.id)

        if (items && !cancelled) {
          const sum = items.reduce((acc, item) => {
            const raw: unknown = item.products
            const p = Array.isArray(raw) ? raw[0] : raw
            if (!p) return acc
            const prod = p as { base_price: number; sale_price: number | null; promotion_active: boolean }
            const price = prod.promotion_active && prod.sale_price ? prod.sale_price : prod.base_price
            return acc + price * item.quantity
          }, 0)
          setTotal(sum)
        }
      }
    }

    fetchCount()

    const handleCartUpdated = (e: Event) => {
      const detail = (e as CustomEvent).detail as { deltaCount?: number; deltaTotal?: number } | undefined
      if (detail?.deltaCount) setCount((c) => Math.max(0, c + detail.deltaCount!))
      if (detail?.deltaTotal) setTotal((t) => Math.max(0, t + detail.deltaTotal!))
      setPulse(true)
      if (pulseTimeout.current) clearTimeout(pulseTimeout.current)
      pulseTimeout.current = setTimeout(() => setPulse(false), 400)
      fetchCount()
    }
    window.addEventListener("cart:updated", handleCartUpdated)

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
      window.removeEventListener("cart:updated", handleCartUpdated)
      if (pulseTimeout.current) clearTimeout(pulseTimeout.current)
      subscription.unsubscribe()
    }
  }, [supabase, showTotal])

  if (showTotal) {
    return (
      <Link href="/cart" data-cart-target className={`relative inline-flex items-center gap-2 transition-transform duration-200 ${pulse ? "scale-125" : "scale-100"} ${className || ""}`} onClick={onClick}>
        <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
        <span className="whitespace-nowrap text-sm font-semibold">
          {count} {count === 1 ? "item" : "items"} -{" "}
          <span className="text-[#C8102E]">
            ${total.toLocaleString("es-CO")}
          </span>
        </span>
      </Link>
    )
  }

  return (
    <Link href="/cart" data-cart-target className={`relative inline-flex items-center gap-2 transition-transform duration-200 ${pulse ? "scale-125" : "scale-100"} ${className || ""}`} onClick={onClick}>
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
