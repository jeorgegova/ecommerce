"use client"

import { useCartStore, type CartItemRow } from "@/stores/cart"
import { getDisplayImageUrl, isSupabaseStorageUrl } from "@/lib/utils/image"
import { AnimatePresence, motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { useEffect } from "react"

const unitPriceOf = (item: CartItemRow) => {
  const product = item.products
  const price = product?.sale_price && product.promotion_active ? product.sale_price : (product?.base_price ?? 0)
  return price + (item.product_variants?.price_adjustment || 0)
}

const mainImageOf = (item: CartItemRow) => {
  const images = item.products?.product_images
  if (!Array.isArray(images) || images.length === 0) return null
  return images.find((img) => img.is_main)?.url || images[0]?.url || null
}

export default function CartContent() {
  const items = useCartStore((state) => state.items)
  const itemsLoaded = useCartStore((state) => state.itemsLoaded)
  const error = useCartStore((state) => state.error)
  const initCart = useCartStore((state) => state.initCart)
  const loadItems = useCartStore((state) => state.loadItems)
  const setQuantity = useCartStore((state) => state.setQuantity)

  useEffect(() => {
    void initCart()
  }, [initCart])

  useEffect(() => {
    if (!itemsLoaded) void loadItems()
  }, [itemsLoaded, loadItems])

  const updateQuantity = (item: CartItemRow, quantity: number) => {
    void setQuantity({ product_id: item.product_id, variant_id: item.variant_id }, quantity)
  }

  const removeItem = (item: CartItemRow) => {
    void setQuantity({ product_id: item.product_id, variant_id: item.variant_id }, 0)
  }

  const subtotal = items.reduce((sum, item) => sum + unitPriceOf(item) * item.quantity, 0)

  if (!itemsLoaded) return <p className="text-gray-600 py-12 text-center">Cargando carrito...</p>

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
          <AnimatePresence initial={false}>
            {items.map((item) => {
              const unitPrice = unitPriceOf(item)
              const mainImage = mainImageOf(item)
              const product = item.products
              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -32, scale: 0.96, transition: { duration: 0.18 } }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="flex gap-4 rounded-xl border border-gray-200 p-4"
                >
                  <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    {mainImage ? (
                      <Image src={getDisplayImageUrl(mainImage)} alt={product?.name ?? "Producto"} fill unoptimized={!isSupabaseStorageUrl(mainImage)} className="object-cover" sizes="96px" />
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      {product ? (
                        <Link href={`/products/${product.slug}`} className="font-medium text-gray-900 hover:text-gray-600">{product.name}</Link>
                      ) : (
                        <span className="font-medium text-gray-500">Producto no disponible</span>
                      )}
                      {item.product_variants && <p className="text-sm text-gray-500">{item.product_variants.name}</p>}
                      <p className="mt-1 text-sm font-medium text-gray-900">
                        €{unitPrice.toLocaleString("es-CO")}
                        {product?.sale_price && product.promotion_active && (
                          <> <span className="text-xs text-gray-400 line-through font-normal">€{(product.base_price + (item.product_variants?.price_adjustment || 0)).toLocaleString("es-CO")}</span></>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button onClick={() => updateQuantity(item, item.quantity - 1)} disabled={item.quantity <= 1}
                          aria-label="Restar una unidad"
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:border-gray-900 disabled:opacity-50">−</button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item, item.quantity + 1)}
                          aria-label="Sumar una unidad"
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:border-gray-900">+</button>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-medium text-gray-900">€{(unitPrice * item.quantity).toLocaleString("es-CO")}</span>
                        <button onClick={() => removeItem(item)} aria-label="Eliminar del carrito" className="text-sm text-gray-400 transition-colors hover:text-red-500">×</button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
        <div>
          <div className="sticky top-24 rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900">Resumen</h2>
            <div className="mt-4 space-y-3">
              <div className="flex justify-between text-sm"><span className="text-gray-600">Subtotal</span><span className="font-medium">€{subtotal.toLocaleString("es-CO")}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-600">Envío</span><span className="text-gray-900">Por calcular</span></div>
              <div className="border-t border-gray-200 pt-3 flex justify-between"><span className="font-semibold">Total</span><span className="font-semibold">€{subtotal.toLocaleString("es-CO")}</span></div>
            </div>
            {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
            <Link href="/cart/checkout" className="mt-6 block w-full rounded-full bg-gray-900 px-6 py-3 text-sm font-medium text-white text-center hover:bg-gray-800">Generar proforma</Link>
            <Link href="/products" className="mt-3 block text-center text-sm text-gray-500 hover:text-gray-900">Seguir comprando</Link>
          </div>
        </div>
      </div>
    </div>
  )
}