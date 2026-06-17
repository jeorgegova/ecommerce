"use client"

import StoreLayout from "@/components/layout/StoreLayout"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface CartItem {
  id: string
  product_id: string
  variant_id: string | null
  quantity: number
  products: { id: string; name: string; slug: string; base_price: number; sale_price: number | null; stock: number }
  product_variants: { id: string; name: string; price_adjustment: number } | null
}

interface Address {
  id: string; name: string; full_name: string; phone: string | null
  address_line_1: string; address_line_2: string | null; city: string
  state: string; postal_code: string; country: string; is_default: boolean
}

export default function CheckoutPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/login"); return }

      const { data: items } = await supabase.from("cart_items").select("*, products(*), product_variants(*)").eq("user_id", user.id)
      setCartItems(items || [])

      const { data: addr } = await supabase.from("addresses").select("*").eq("user_id", user.id).order("is_default", { ascending: false })
      setAddresses(addr || [])
      const defaultAddr = addr?.find((a) => a.is_default) || addr?.[0]
      if (defaultAddr) setSelectedAddressId(defaultAddr.id)

      setLoading(false)
    }
    fetchData()
  }, [supabase, router])

  const subtotal = cartItems.reduce((sum, item) => {
    const price = item.products.sale_price || item.products.base_price
    return sum + (price + (item.product_variants?.price_adjustment || 0)) * item.quantity
  }, 0)

  const placeOrder = async () => {
    if (!selectedAddressId) { setError("Selecciona una dirección de envío"); return }
    setPlacing(true); setError("")

    try {
      const { data, error: rpcError } = await supabase.rpc("create_order_from_cart", {
        p_user_id: (await supabase.auth.getUser()).data.user!.id,
        p_shipping_address_id: selectedAddressId,
      })

      if (rpcError) throw new Error(rpcError.message)

      router.push(`/account/orders/${data}`)
    } catch (err: any) {
      setError(err.message)
      setPlacing(false)
    }
  }

  if (loading) return <StoreLayout><p className="text-center py-24 text-gray-600">Cargando...</p></StoreLayout>

  if (cartItems.length === 0) return (
    <StoreLayout>
      <div className="py-24 text-center">
        <p className="text-gray-500">Tu carrito está vacío</p>
        <Link href="/products" className="mt-4 inline-block rounded-full bg-gray-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-800">Ver productos</Link>
      </div>
    </StoreLayout>
  )

  return (
    <StoreLayout>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Dirección de Envío</h2>
              {addresses.length === 0 ? (
                <div className="mt-4">
                  <p className="text-sm text-gray-500">No tienes direcciones guardadas.</p>
                  <Link href="/account/addresses" className="mt-2 inline-block text-sm font-medium text-gray-900 underline">Agregar dirección</Link>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {addresses.map((addr) => (
                    <label key={addr.id} className={`flex cursor-pointer items-start gap-4 rounded-xl border p-4 ${selectedAddressId === addr.id ? "border-gray-900 bg-gray-50" : "border-gray-200"}`}>
                      <input type="radio" name="address" value={addr.id} checked={selectedAddressId === addr.id} onChange={() => setSelectedAddressId(addr.id)} className="mt-1 h-4 w-4 text-gray-900 focus:ring-gray-900" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{addr.name}</span>
                          {addr.is_default && <span className="rounded-full bg-gray-900 px-2 py-0.5 text-xs text-white">Default</span>}
                        </div>
                        <p className="text-sm text-gray-600">{addr.full_name} — {addr.address_line_1}, {addr.city}, {addr.state}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900">Productos</h2>
              <div className="mt-4 space-y-3">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                    <div>
                      <p className="font-medium text-gray-900">{item.products.name}</p>
                      {item.product_variants && <p className="text-sm text-gray-500">{item.product_variants.name}</p>}
                      <p className="text-sm text-gray-500">Cant: {item.quantity}</p>
                    </div>
                    <p className="font-medium text-gray-900">${((item.products.sale_price || item.products.base_price) * item.quantity).toLocaleString("es-CO")}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="sticky top-24 rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900">Resumen</h2>
              <div className="mt-4 space-y-3">
                <div className="flex justify-between text-sm"><span className="text-gray-600">Subtotal</span><span className="font-medium">${subtotal.toLocaleString("es-CO")}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-600">Envío</span><span className="text-gray-900">Por calcular</span></div>
                <div className="border-t border-gray-200 pt-3 flex justify-between"><span className="font-semibold">Total</span><span className="font-semibold">${subtotal.toLocaleString("es-CO")}</span></div>
              </div>
              {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
              <button onClick={placeOrder} disabled={placing || addresses.length === 0}
                className="mt-6 w-full rounded-full bg-gray-900 px-6 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50">
                {placing ? "Procesando..." : "Confirmar Pedido"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </StoreLayout>
  )
}
