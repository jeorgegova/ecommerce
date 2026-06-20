"use client"

import { createClient } from "@/lib/supabase/client"
import Image from "next/image"
import Link from "next/link"
import { useCallback, useEffect, useState } from "react"

interface CartItem {
  id: string
  product_id: string
  variant_id: string | null
  quantity: number
  created_at: string
  products: { id: string; name: string; slug: string; sku: string; base_price: number; sale_price: number | null; promotion_active: boolean; stock: number; has_variants: boolean; product_images: { url: string; is_main: boolean }[] }
  product_variants: { id: string; name: string; sku: string; price_adjustment: number; stock: number } | null
}

export default function CartContent() {
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = createClient()

  const fetchCart = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    setUserId(user.id)
    const { data } = await supabase.from("cart_items").select("*, products(*, product_images(url, is_main)), product_variants(*)").eq("user_id", user.id).order("created_at")
    setItems(data || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchCart() }, [fetchCart])

  const updateQuantity = async (itemId: string, newQty: number) => {
    if (newQty < 1) return
    setUpdating(itemId)
    await supabase.from("cart_items").update({ quantity: newQty }).eq("id", itemId)
    setItems((prev) => prev.map((item) => item.id === itemId ? { ...item, quantity: newQty } : item))
    setUpdating(null)
  }

  const removeItem = async (itemId: string) => {
    await supabase.from("cart_items").delete().eq("id", itemId)
    setItems((prev) => prev.filter((item) => item.id !== itemId))
  }

  const subtotal = items.reduce((sum, item) => {
    const price = (item.products.sale_price && item.products.promotion_active) ? item.products.sale_price : item.products.base_price
    const adjustment = item.product_variants?.price_adjustment || 0
    return sum + (price + adjustment) * item.quantity
  }, 0)

  if (loading) return <p className="text-gray-600 py-12 text-center">Cargando carrito...</p>

  if (items.length === 0) return (
    <div className="py-24 text-center">
      <p className="text-gray-500">Tu carrito está vacío</p>
      <Link href="/products" className="mt-4 inline-block rounded-full bg-gray-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-800">Ver productos</Link>
    </div>
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900">Carrito</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const price = (item.products.sale_price && item.products.promotion_active) ? item.products.sale_price : item.products.base_price
            const adjustment = item.product_variants?.price_adjustment || 0
            const unitPrice = price + adjustment
            return (
              <div key={item.id} className="flex gap-4 rounded-xl border border-gray-200 p-4">
                <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  {(() => {
                    const images = item.products.product_images
                    const mainImage = Array.isArray(images)
                      ? images.find((img: any) => img.is_main)?.url || images[0]?.url || null
                      : null
                    return mainImage ? (
                      <Image src={mainImage} alt={item.products.name} fill className="object-cover" sizes="96px" />
                    ) : null
                  })()}
                </div>
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <Link href={`/products/${item.products.slug}`} className="font-medium text-gray-900 hover:text-gray-600">{item.products.name}</Link>
                    {item.product_variants && <p className="text-sm text-gray-500">{item.product_variants.name}</p>}
                    <p className="mt-1 text-sm font-medium text-gray-900">
                      ${unitPrice.toLocaleString("es-CO")}
                      {item.products.sale_price && item.products.promotion_active && (
                        <> <span className="text-xs text-gray-400 line-through font-normal">${Number(item.products.base_price + adjustment).toLocaleString("es-CO")}</span></>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={updating === item.id || item.quantity <= 1}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:border-gray-900 disabled:opacity-50">−</button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} disabled={updating === item.id}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:border-gray-900 disabled:opacity-50">+</button>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-medium text-gray-900">${(unitPrice * item.quantity).toLocaleString("es-CO")}</span>
                      <button onClick={() => removeItem(item.id)} className="text-sm text-gray-400 hover:text-red-500">×</button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        <div>
          <div className="sticky top-24 rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900">Resumen</h2>
            <div className="mt-4 space-y-3">
              <div className="flex justify-between text-sm"><span className="text-gray-600">Subtotal</span><span className="font-medium">${subtotal.toLocaleString("es-CO")}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-600">Envío</span><span className="text-gray-900">Por calcular</span></div>
              <div className="border-t border-gray-200 pt-3 flex justify-between"><span className="font-semibold">Total</span><span className="font-semibold">${subtotal.toLocaleString("es-CO")}</span></div>
            </div>
            <Link href="/cart/checkout" className="mt-6 block w-full rounded-full bg-gray-900 px-6 py-3 text-sm font-medium text-white text-center hover:bg-gray-800">Ir a pagar</Link>
            <Link href="/products" className="mt-3 block text-center text-sm text-gray-500 hover:text-gray-900">Seguir comprando</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
