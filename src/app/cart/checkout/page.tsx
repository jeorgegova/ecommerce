"use client"

import StoreLayout from "@/components/layout/StoreLayout"
import { createClient } from "@/lib/supabase/client"
import { clearGuestCart, readGuestCart } from "@/lib/cart/guest"
import { downloadProformaPdf, getSettingValue } from "@/lib/utils/proforma-pdf"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface CartItem {
  id: string
  product_id: string
  variant_id: string | null
  quantity: number
  products: { id: string; name: string; slug: string; base_price: number; sale_price: number | null; promotion_active: boolean; stock: number }
  product_variants: { id: string; name: string; price_adjustment: number } | null
}

interface Address {
  id: string; name: string; full_name: string; phone: string | null
  address_line_1: string; address_line_2: string | null; city: string
  state: string; postal_code: string; country: string; is_default: boolean
}

interface AppliedCoupon {
  id: string
  code: string
  type: "percentage" | "fixed"
  value: number
  discount: number
}

interface GuestContact {
  fullName: string
  email: string
  phone: string
  address: string
  addressLine2: string
  city: string
  state: string
  postalCode: string
}

interface GuestOrderResult {
  order_number: string
  created_at: string
  status: string
  subtotal: number
  shipping_cost: number
  discount: number
  total: number
  guest_name: string
  guest_email: string
  guest_phone: string | null
  shipping_address: { address_line_1: string; city: string; state: string }
  items: { product_name: string; product_sku: string; variant_name: string | null; quantity: number; unit_price: number; subtotal: number }[]
}

export default function CheckoutPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState("")
  const [isGuest, setIsGuest] = useState(false)
  const [guest, setGuest] = useState<GuestContact>({ fullName: "", email: "", phone: "", address: "", addressLine2: "", city: "", state: "", postalCode: "" })

  // coupon state
  const [couponCode, setCouponCode] = useState("")
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null)
  const [couponError, setCouponError] = useState("")
  const [validating, setValidating] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        const guestItems = readGuestCart()
        const productIds = guestItems.map((item) => item.productId)
        const variantIds = guestItems.flatMap((item) => item.variantId ? [item.variantId] : [])
        const [{ data: products }, { data: variants }] = await Promise.all([
          productIds.length ? supabase.from("products").select("*").in("id", productIds) : Promise.resolve({ data: [] }),
          variantIds.length ? supabase.from("product_variants").select("*").in("id", variantIds) : Promise.resolve({ data: [] }),
        ])
        const productMap = new Map((products || []).map((product) => [product.id, product]))
        const variantMap = new Map((variants || []).map((variant) => [variant.id, variant]))
        setCartItems(guestItems.flatMap((item) => {
          const product = productMap.get(item.productId)
          if (!product) return []
          return [{ id: `${item.productId}:${item.variantId || "base"}`, product_id: item.productId, variant_id: item.variantId, quantity: item.quantity, products: product, product_variants: item.variantId ? variantMap.get(item.variantId) || null : null } as CartItem]
        }))
        setIsGuest(true)
        setLoading(false)
        return
      }

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
    const price = (item.products.sale_price && item.products.promotion_active) ? item.products.sale_price : item.products.base_price
    return sum + (price + (item.product_variants?.price_adjustment || 0)) * item.quantity
  }, 0)

  const discount = coupon?.discount || 0
  const total = Math.max(0, subtotal - discount)

  const validateCoupon = async () => {
    const code = couponCode.trim().toUpperCase()
    if (!code) { setCouponError("Ingresa un código"); return }
    setValidating(true); setCouponError(""); setError("")
    try {
      const { data: { user } } = await supabase.auth.getUser()
      let row: any = null
      if (user) {
        // use validate_coupon RPC if available, fallback to direct query
        const { data, error: rpcError } = await supabase.rpc("validate_coupon" as any, {
          p_code: code,
          p_user_id: user.id,
          p_subtotal: subtotal,
        } as any)
        if (!rpcError && data) {
          row = Array.isArray(data) ? data[0] : data
          if (row && !row.is_valid) throw new Error(row.error_message || "Cupón no válido")
        } else {
          const { data: c, error: qErr } = await supabase.from("coupons").select("*").eq("code", code).maybeSingle()
          if (qErr) throw new Error(qErr.message)
          if (!c) throw new Error("Cupón no existe")
          if (!c.is_active) throw new Error("Cupón inactivo")
          if (c.starts_at && new Date(c.starts_at) > new Date()) throw new Error("Cupón aún no vigente")
          if (c.ends_at && new Date(c.ends_at) < new Date()) throw new Error("Cupón expirado")
          if (c.min_order_amount && subtotal < Number(c.min_order_amount)) throw new Error(`Monto mínimo $${Number(c.min_order_amount).toLocaleString("es-CO")} no alcanzado`)
          row = c; row.is_valid = true
        }
      } else {
        // Los invitados no tienen user_id: validamos el cupón directamente.
        const { data: c, error: qErr } = await supabase.from("coupons").select("*").eq("code", code).maybeSingle()
        if (qErr) throw new Error(qErr.message)
        if (!c) throw new Error("Cupón no existe")
        if (!c.is_active) throw new Error("Cupón inactivo")
        if (c.starts_at && new Date(c.starts_at) > new Date()) throw new Error("Cupón aún no vigente")
        if (c.ends_at && new Date(c.ends_at) < new Date()) throw new Error("Cupón expirado")
        if (c.min_order_amount && subtotal < Number(c.min_order_amount)) throw new Error(`Monto mínimo $${Number(c.min_order_amount).toLocaleString("es-CO")} no alcanzado`)
        row = c; row.is_valid = true
      }

      if (!row || (!row.is_valid && !row.id)) throw new Error("Cupón no válido")

      const value = Number(row.value)
      const type = row.type as "percentage" | "fixed"
      const computed = type === "percentage" ? Math.min(subtotal * (value / 100), subtotal) : Math.min(value, subtotal)

      setCoupon({ id: row.id, code: row.code, type, value, discount: Number(computed.toFixed(2)) })
      setCouponError("")
    } catch (err: any) {
      setCoupon(null)
      setCouponError(err.message || "No se pudo validar el cupón")
    } finally {
      setValidating(false)
    }
  }

  const removeCoupon = () => {
    setCoupon(null); setCouponError(""); setCouponCode("")
  }

  const placeOrder = async () => {
    if (isGuest) {
      if (!guest.fullName || !guest.email || !guest.phone || !guest.address || !guest.city || !guest.state || !guest.postalCode) {
        setError("Completa todos los datos de contacto y envío")
        return
      }
    } else if (!selectedAddressId) { setError("Selecciona una dirección de envío"); return }
    setPlacing(true); setError("")

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user && isGuest) {
        const { data: guestOrder, error: guestError } = await supabase.rpc("create_guest_order" as never, {
          p_items: cartItems.map((item) => ({ product_id: item.product_id, variant_id: item.variant_id, quantity: item.quantity })),
          p_guest_name: guest.fullName,
          p_guest_email: guest.email,
          p_guest_phone: guest.phone,
          p_shipping_address: { address_line_1: guest.address, address_line_2: guest.addressLine2 || null, city: guest.city, state: guest.state, postal_code: guest.postalCode, country: "CO" },
          p_coupon_id: coupon?.id || null,
        } as never)
        if (guestError) throw new Error(guestError.message)

        const order = guestOrder as unknown as GuestOrderResult
        const { data: settings } = await supabase.from("settings").select("key, value").in("key", ["banco_consignar", "numero_cuenta_bancaria"])
        await downloadProformaPdf({
          orderNumber: order.order_number,
          createdAt: order.created_at,
          status: order.status,
          subtotal: order.subtotal,
          shipping_cost: order.shipping_cost,
          discount: order.discount,
          total: order.total,
          items: order.items,
          customerName: order.guest_name,
          customerEmail: order.guest_email,
          customerPhone: order.guest_phone,
          address: order.shipping_address.address_line_1,
          city: order.shipping_address.city,
          state: order.shipping_address.state,
          bankName: getSettingValue(settings, "banco_consignar"),
          bankAccount: getSettingValue(settings, "numero_cuenta_bancaria"),
        })
        clearGuestCart()
        router.push(`/cart/checkout/success?order=${encodeURIComponent(order.order_number)}`)
        return
      }
      if (!user) throw new Error("Sesión no disponible")
      const { data, error: rpcError } = await supabase.rpc("create_order_from_cart", {
        p_user_id: user.id,
        p_shipping_address_id: selectedAddressId,
        p_coupon_id: coupon?.id || null,
      } as any)

      if (rpcError) throw new Error(rpcError.message)

      const orderId = data as string
      const [{ data: order }, { data: orderItems }, { data: settings }] = await Promise.all([
        supabase.from("orders").select("*").eq("id", orderId).single(),
        supabase.from("order_items").select("*").eq("order_id", orderId).order("created_at"),
        supabase.from("settings").select("key, value").in("key", ["banco_consignar", "numero_cuenta_bancaria"]),
      ])
      if (order && orderItems) {
        const address = addresses.find((item) => item.id === selectedAddressId)
        await downloadProformaPdf({
          orderNumber: order.order_number, createdAt: order.created_at, status: order.status,
          subtotal: order.subtotal, shipping_cost: order.shipping_cost, discount: order.discount, total: order.total,
          items: orderItems, customerName: address?.full_name, customerEmail: user.email, customerPhone: address?.phone,
          address: address?.address_line_1, city: address?.city, state: address?.state,
          bankName: getSettingValue(settings, "banco_consignar"), bankAccount: getSettingValue(settings, "numero_cuenta_bancaria"),
        })
      }
      router.push(`/account/orders/${data}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No fue posible crear el pedido")
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
              <h2 className="text-lg font-semibold text-gray-900">{isGuest ? "Datos para tu pedido" : "Dirección de Envío"}</h2>
              {isGuest ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <input value={guest.fullName} onChange={(e) => setGuest({ ...guest, fullName: e.target.value })} placeholder="Nombre completo" className="rounded-lg border border-gray-300 px-3 py-3 text-sm sm:col-span-2" required />
                  <input type="email" value={guest.email} onChange={(e) => setGuest({ ...guest, email: e.target.value })} placeholder="Correo electrónico" className="rounded-lg border border-gray-300 px-3 py-3 text-sm" required />
                  <input value={guest.phone} onChange={(e) => setGuest({ ...guest, phone: e.target.value })} placeholder="Teléfono" className="rounded-lg border border-gray-300 px-3 py-3 text-sm" required />
                  <input value={guest.address} onChange={(e) => setGuest({ ...guest, address: e.target.value })} placeholder="Dirección de entrega" className="rounded-lg border border-gray-300 px-3 py-3 text-sm sm:col-span-2" required />
                  <input value={guest.addressLine2} onChange={(e) => setGuest({ ...guest, addressLine2: e.target.value })} placeholder="Apto, oficina (opcional)" className="rounded-lg border border-gray-300 px-3 py-3 text-sm sm:col-span-2" />
                  <input value={guest.city} onChange={(e) => setGuest({ ...guest, city: e.target.value })} placeholder="Ciudad" className="rounded-lg border border-gray-300 px-3 py-3 text-sm" required />
                  <input value={guest.state} onChange={(e) => setGuest({ ...guest, state: e.target.value })} placeholder="Departamento" className="rounded-lg border border-gray-300 px-3 py-3 text-sm" required />
                  <input value={guest.postalCode} onChange={(e) => setGuest({ ...guest, postalCode: e.target.value })} placeholder="Código postal" className="rounded-lg border border-gray-300 px-3 py-3 text-sm" required />
                  <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900 sm:col-span-2"><strong>Compra como invitado.</strong> No necesitas crear una cuenta para completar tu pedido. Si te registras, tendrás mayor control de tus pedidos y podrás estar al tanto de las novedades.</div>
                </div>
              ) : addresses.length === 0 ? (
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
                      ${(((item.products.sale_price && item.products.promotion_active ? item.products.sale_price : null) || item.products.base_price) * item.quantity).toLocaleString("es-CO")}
                      {item.products.sale_price && item.products.promotion_active && (
                        <> <span className="text-xs text-gray-400 line-through font-normal">${(item.products.base_price * item.quantity).toLocaleString("es-CO")}</span></>
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

              {/* cupón */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Cupón de descuento</label>
                {isGuest && <p className="mt-2 text-sm text-gray-600">Puedes aplicar un cupón sin registrarte. Si creas una cuenta, tendrás mayor control de tus pedidos y recibirás novedades de Amelatte.</p>}
                {coupon ? (
                  <div className="mt-2 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                    <div>
                      <p className="font-mono text-sm font-semibold text-emerald-800">{coupon.code}</p>
                      <p className="text-xs text-emerald-600">{coupon.type === "percentage" ? `${coupon.value}%` : `$${Number(coupon.value).toLocaleString("es-CO")}`} · -${coupon.discount.toLocaleString("es-CO")}</p>
                    </div>
                    <button onClick={removeCoupon} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50">Quitar</button>
                  </div>
                ) : (
                  <div className="mt-2 flex gap-2">
                    <input value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), validateCoupon())} placeholder="EJ: DESCUENTO10" className="flex-1 rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm uppercase placeholder:normal-case focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900" />
                    <button onClick={validateCoupon} disabled={validating || !couponCode.trim()} className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50">{validating ? "..." : "Aplicar"}</button>
                  </div>
                )}
                {couponError && <p className="mt-2 text-xs text-red-500">{couponError}</p>}
                {coupon && <p className="mt-1 text-xs text-emerald-600">Cupón aplicado correctamente.</p>}
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex justify-between text-sm"><span className="text-gray-600">Subtotal</span><span className="font-medium">${subtotal.toLocaleString("es-CO")}</span></div>
                {coupon && <div className="flex justify-between text-sm text-emerald-700"><span>Descuento ({coupon.code})</span><span className="font-medium">-${discount.toLocaleString("es-CO")}</span></div>}
                <div className="flex justify-between text-sm"><span className="text-gray-600">Envío</span><span className="text-gray-900">Por calcular</span></div>
                <div className="border-t border-gray-200 pt-3 flex justify-between"><span className="font-semibold">Total</span><span className="font-semibold">${total.toLocaleString("es-CO")}</span></div>
                {coupon && subtotal !== total && <p className="text-xs text-gray-500">Ahorras ${discount.toLocaleString("es-CO")} con tu cupón</p>}
              </div>
              {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
              <button onClick={placeOrder} disabled={placing || (!isGuest && addresses.length === 0)}
                aria-label={placing ? "Confirmando compra" : "Confirmar compra"}
                className="group mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-gray-900 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-gray-900/10 transition-all hover:bg-[#C8102E] hover:shadow-xl hover:shadow-[#C8102E]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8102E] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none motion-reduce:animate-none disabled:animate-none enabled:animate-checkout-cta">
                {placing ? "Confirmando compra..." : "Confirmar compra"}
                {!placing && <svg className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6 6 6-6 6" /></svg>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </StoreLayout>
  )
}
