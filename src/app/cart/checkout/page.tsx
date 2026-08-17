"use client"

import StoreLayout from "@/components/layout/StoreLayout"
import { downloadProformaPdf } from "@/lib/utils/proforma-pdf"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface CartItem {
  id: string
  product_id: string
  variant_id: string | null
  quantity: number
  products: { id: string; name: string; slug: string; sku: string; base_price: number; sale_price: number | null; promotion_active: boolean; stock: number }
  product_variants: { id: string; name: string; price_adjustment: number } | null
}

interface Address {
  id: string; name: string; full_name: string; phone: string | null
  address_line_1: string; address_line_2: string | null; city: string
  state: string; postal_code: string; country: string; is_default: boolean
}

interface StoreInfo {
  name: string
  phone: string
  email: string
  address: string
  website: string
  instagram: string
  facebook: string
  whatsapp: string
  bankName: string
  bankAccount: string
  bankType: string
  bankHolder: string
  bankDocument: string
  paymentMethod: string
  shippingMethod: string
  terms: string
}

export default function CheckoutPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [storeInfo, setStoreInfo] = useState<StoreInfo>({
    name: "Wil Motos",
    phone: "",
    email: "",
    address: "",
    website: "",
    instagram: "",
    facebook: "",
    whatsapp: "",
    bankName: "",
    bankAccount: "",
    bankType: "",
    bankHolder: "",
    bankDocument: "",
    paymentMethod: "",
    shippingMethod: "",
    terms: "",
  })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/login"); return }
      setCustomerEmail(user.email || "")

      const { data: items } = await supabase.from("cart_items").select("*, products(*), product_variants(*)").eq("user_id", user.id)
      setCartItems(items || [])

      const { data: addr } = await supabase.from("addresses").select("*").eq("user_id", user.id).order("is_default", { ascending: false })
      setAddresses(addr || [])
      const defaultAddr = addr?.find((a) => a.is_default) || addr?.[0]
      if (defaultAddr) setSelectedAddressId(defaultAddr.id)

      const { data: settings } = await supabase
        .from("settings")
        .select("key, value")
        .in("key", [
          "store_name", "store_phone", "store_email", "store_address", "store_website",
          "social_instagram", "social_facebook", "social_whatsapp", "banco_consignar",
          "numero_cuenta_bancaria", "tipo_cuenta_bancaria", "titular_cuenta_bancaria",
          "documento_cuenta_bancaria", "metodo_pago", "metodo_envio", "terminos_proforma",
        ])
      const settingValue = (key: string, fallback: string) => {
        const value = settings?.find((setting) => setting.key === key)?.value
        if (value === undefined || value === null) return fallback
        if (typeof value !== "string") return String(value)
        try {
          const parsed = JSON.parse(value)
          return typeof parsed === "string" ? parsed : value
        } catch {
          return value
        }
      }
      setStoreInfo({
        name: settingValue("store_name", "Wil Motos"),
        phone: settingValue("store_phone", ""),
        email: settingValue("store_email", ""),
        address: settingValue("store_address", ""),
        website: settingValue("store_website", ""),
        instagram: settingValue("social_instagram", ""),
        facebook: settingValue("social_facebook", ""),
        whatsapp: settingValue("social_whatsapp", ""),
        bankName: settingValue("banco_consignar", ""),
        bankAccount: settingValue("numero_cuenta_bancaria", ""),
        bankType: settingValue("tipo_cuenta_bancaria", ""),
        bankHolder: settingValue("titular_cuenta_bancaria", ""),
        bankDocument: settingValue("documento_cuenta_bancaria", ""),
        paymentMethod: settingValue("metodo_pago", "Transferencia bancaria"),
        shippingMethod: settingValue("metodo_envio", ""),
        terms: settingValue("terminos_proforma", ""),
      })

      setLoading(false)
    }
    fetchData()
  }, [supabase, router])

  const subtotal = cartItems.reduce((sum, item) => {
    const price = (item.products.sale_price && item.products.promotion_active) ? item.products.sale_price : item.products.base_price
    return sum + (price + (item.product_variants?.price_adjustment || 0)) * item.quantity
  }, 0)

  const itemUnitPrice = (item: CartItem) => {
    const price = item.products.sale_price && item.products.promotion_active ? item.products.sale_price : item.products.base_price
    return price + (item.product_variants?.price_adjustment || 0)
  }

  const placeOrder = async () => {
    if (!selectedAddressId) { setError("Selecciona una dirección de envío"); return }
    setPlacing(true); setError("")

    try {
      const { data, error: rpcError } = await supabase.rpc("create_order_from_cart", {
        p_user_id: (await supabase.auth.getUser()).data.user!.id,
        p_shipping_address_id: selectedAddressId,
        p_billing_address_id: null,
        p_notes: null,
        p_coupon_id: null,
      })

      if (rpcError) throw new Error(rpcError.message)

      const [{ data: order, error: orderError }, { data: orderItems, error: itemsError }] = await Promise.all([
        supabase.from("orders").select("order_number, created_at, status, subtotal, shipping_cost, discount, total").eq("id", data).single(),
        supabase.from("order_items").select("product_name, product_sku, variant_name, unit_price, quantity, subtotal").eq("order_id", data).order("created_at"),
      ])
      if (orderError) throw new Error(orderError.message)
      if (itemsError) throw new Error(itemsError.message)

      const address = addresses.find((item) => item.id === selectedAddressId)
      if (!address || !order) throw new Error("No se pudo preparar la proforma")

      await downloadProformaPdf({
        orderNumber: order.order_number,
        createdAt: order.created_at,
        status: order.status,
        subtotal: Number(order.subtotal),
        shippingCost: Number(order.shipping_cost),
        discount: Number(order.discount),
        total: Number(order.total),
        items: orderItems || [],
        customerName: address.full_name,
        customerEmail,
        customerPhone: address.phone,
        address: address.address_line_1,
        city: address.city,
        state: address.state,
        bankName: storeInfo.bankName,
        bankAccount: storeInfo.bankAccount,
        bankType: storeInfo.bankType,
        bankHolder: storeInfo.bankHolder,
        bankDocument: storeInfo.bankDocument,
        paymentMethod: storeInfo.paymentMethod,
        shippingMethod: storeInfo.shippingMethod,
        storeName: storeInfo.name,
        storePhone: storeInfo.phone,
        storeEmail: storeInfo.email,
        storeAddress: storeInfo.address,
        storeWebsite: storeInfo.website,
        instagram: storeInfo.instagram,
        facebook: storeInfo.facebook,
        whatsapp: storeInfo.whatsapp,
        terms: storeInfo.terms,
      })

      router.push(`/account/orders/${data}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudo generar la proforma")
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
                    <p className="font-medium text-gray-900">
                      ${(itemUnitPrice(item) * item.quantity).toLocaleString("es-CO")}
                      {item.products.sale_price && item.products.promotion_active && (
                        <> <span className="text-xs text-gray-400 line-through font-normal">${((item.products.base_price + (item.product_variants?.price_adjustment || 0)) * item.quantity).toLocaleString("es-CO")}</span></>
                      )}
                    </p>
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
              <div className="mt-5 rounded-lg bg-blue-50 p-4 text-sm text-blue-900">
                <p className="font-semibold">Pago por transferencia bancaria</p>
                <p className="mt-1">Banco: {storeInfo.bankName || "Pendiente de configuración"}</p>
                <p>Cuenta: {storeInfo.bankAccount || "Pendiente de configuración"}</p>
                <p className="mt-2 text-xs text-blue-700">Al confirmar, se descargará una proforma PDF con los detalles del pedido.</p>
              </div>
              {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
              {addresses.length === 0 && (
                <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                  Agrega una dirección de envío para poder confirmar el pedido.
                </p>
              )}
              <div
                className="mt-6"
                title={addresses.length === 0 ? "Agrega una dirección de envío para continuar" : undefined}
              >
                <button onClick={placeOrder} disabled={placing || addresses.length === 0 || !selectedAddressId}
                  className="w-full rounded-full bg-gray-900 px-6 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50">
                  {placing ? "Generando proforma..." : "Confirmar pedido y generar proforma"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StoreLayout>
  )
}
