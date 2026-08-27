"use client"

import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"

const money = (v: number) => `€${Number(v || 0).toLocaleString("es-CO")}`

interface OrderItemEdit {
  tempId: string
  product_id: string
  variant_id: string | null
  product_name: string
  product_sku: string
  variant_name: string | null
  unit_price: number
  quantity: number
}

interface ProductOpt {
  id: string
  name: string
  sku: string
  base_price: number
  sale_price: number | null
  promotion_active: boolean
  has_variants: boolean
  stock: number
}

interface VariantOpt {
  id: string
  name: string
  sku: string
  price_adjustment: number
  stock: number
}

export default function AdminOrderEditPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [orderNumber, setOrderNumber] = useState("")
  const [status, setStatus] = useState("")
  const [items, setItems] = useState<OrderItemEdit[]>([])
  const [couponCode, setCouponCode] = useState("")
  const [couponPreview, setCouponPreview] = useState<{ code: string; type: string; value: number } | null>(null)
  const [couponErr, setCouponErr] = useState("")
  const [shipping, setShipping] = useState(0)

  // product picker
  const [pickerOpen, setPickerOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [products, setProducts] = useState<ProductOpt[]>([])
  const [variantsMap, setVariantsMap] = useState<Record<string, VariantOpt[]>>({})

  const loadOrder = useCallback(async () => {
    const { data: order } = await supabase.from("orders").select("*, coupons(code,type,value)").eq("id", id).single()
    if (!order) { setError("Pedido no encontrado"); setLoading(false); return }
    setOrderNumber(order.order_number)
    setStatus(order.status)
    setShipping(Number(order.shipping_cost) || 0)
    if (order.coupons) {
      const c: any = order.coupons
      setCouponCode(c.code || "")
      setCouponPreview(c.code ? { code: c.code, type: c.type, value: Number(c.value) } : null)
    } else if (order.coupon_id) {
      const { data: c } = await supabase.from("coupons").select("code,type,value").eq("id", order.coupon_id).maybeSingle()
      if (c) { setCouponCode(c.code); setCouponPreview({ code: c.code, type: c.type, value: Number(c.value) }) }
    }

    const { data: orderItems } = await supabase.from("order_items").select("*").eq("order_id", id).order("created_at")
    setItems((orderItems || []).map((it: any) => ({
      tempId: it.id,
      product_id: it.product_id,
      variant_id: it.variant_id,
      product_name: it.product_name,
      product_sku: it.product_sku,
      variant_name: it.variant_name,
      unit_price: Number(it.unit_price),
      quantity: it.quantity,
    })))
    setLoading(false)
  }, [id, supabase])

  useEffect(() => { loadOrder() }, [loadOrder])

  const subtotal = useMemo(() => items.reduce((s, it) => s + it.unit_price * it.quantity, 0), [items])
  const discount = useMemo(() => {
    if (!couponPreview) return 0
    if (couponPreview.type === "percentage") return Math.min(subtotal * (couponPreview.value / 100), subtotal)
    return Math.min(couponPreview.value, subtotal)
  }, [subtotal, couponPreview])
  const total = Math.max(0, subtotal + shipping - discount)

  const validateCoupon = async () => {
    const code = couponCode.trim().toUpperCase()
    if (!code) { setCouponPreview(null); setCouponErr(""); return }
    setCouponErr("")
    const { data, error: rpcErr } = await supabase.rpc("validate_coupon" as any, { p_code: code, p_user_id: null, p_subtotal: subtotal } as any)
    if (!rpcErr && data) {
      const row: any = Array.isArray(data) ? data[0] : data
      if (row && row.is_valid) { setCouponPreview({ code: row.code, type: row.type, value: Number(row.value) }); return }
      if (row && row.error_message) { setCouponErr(row.error_message); setCouponPreview(null); return }
    }
    // fallback direct
    const { data: c, error: qErr } = await supabase.from("coupons").select("*").eq("code", code).maybeSingle()
    if (qErr || !c) { setCouponErr("Cupón no existe"); setCouponPreview(null); return }
    if (!c.is_active) { setCouponErr("Cupón inactivo"); setCouponPreview(null); return }
    if (c.starts_at && new Date(c.starts_at) > new Date()) { setCouponErr("Cupón aún no vigente"); setCouponPreview(null); return }
    if (c.ends_at && new Date(c.ends_at) < new Date()) { setCouponErr("Cupón expirado"); setCouponPreview(null); return }
    if (c.min_order_amount && subtotal < Number(c.min_order_amount)) { setCouponErr(`Mínimo €${Number(c.min_order_amount).toLocaleString("es-CO")}`); setCouponPreview(null); return }
    setCouponPreview({ code: c.code, type: c.type, value: Number(c.value) })
  }

  const openPicker = async () => {
    setPickerOpen(true)
    setSearch("")
    const { data } = await supabase.from("products").select("id,name,sku,base_price,sale_price,promotion_active,has_variants,stock").eq("status", "active").order("name").limit(50)
    setProducts((data as any) || [])
    // preload variants for those with has_variants
    const ids = (data || []).filter((p: any) => p.has_variants).map((p: any) => p.id)
    if (ids.length) {
      const { data: vars } = await supabase.from("product_variants").select("id,product_id,name,sku,price_adjustment,stock").in("product_id", ids).eq("is_active", true)
      const map: Record<string, VariantOpt[]> = {}
      for (const v of vars || []) {
        if (!map[v.product_id]) map[v.product_id] = []
        map[v.product_id].push(v as VariantOpt)
      }
      setVariantsMap(map)
    }
  }

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products
    const q = search.toLowerCase()
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
  }, [products, search])

  const addItem = (product: ProductOpt, variant?: VariantOpt) => {
    const unit = Number(product.promotion_active && product.sale_price != null ? product.sale_price : product.base_price) + (variant ? Number(variant.price_adjustment) : 0)
    // check if same product+variant already exists -> increase qty
    const existing = items.find((it) => it.product_id === product.id && (it.variant_id || null) === (variant?.id || null))
    if (existing) {
      setItems((prev) => prev.map((it) => it.tempId === existing.tempId ? { ...it, quantity: it.quantity + 1 } : it))
    } else {
      setItems((prev) => [...prev, {
        tempId: Math.random().toString(36).slice(2),
        product_id: product.id,
        variant_id: variant ? variant.id : null,
        product_name: product.name,
        product_sku: variant ? variant.sku : product.sku,
        variant_name: variant ? variant.name : null,
        unit_price: unit,
        quantity: 1,
      }])
    }
  }

  const updateQty = (tempId: string, qty: number) => {
    if (qty <= 0) { setItems((prev) => prev.filter((it) => it.tempId !== tempId)); return }
    setItems((prev) => prev.map((it) => it.tempId === tempId ? { ...it, quantity: qty } : it))
  }

  const save = async () => {
    if (items.length === 0) { setError("Debe haber al menos un producto"); return }
    if (status === "delivered" || status === "cancelled" || status === "shipped") { setError(`No se puede editar pedido en estado ${status}`); return }
    setSaving(true); setError("")
    const payload = items.map((it) => ({ product_id: it.product_id, variant_id: it.variant_id, quantity: it.quantity }))
    const { error: rpcErr } = await supabase.rpc("admin_update_order" as any, {
      p_order_id: id,
      p_items: payload as any,
      p_coupon_code: couponPreview ? couponPreview.code : (couponCode.trim() ? couponCode.trim().toUpperCase() : null),
      p_shipping_cost: shipping,
    } as any)
    if (rpcErr) { setError(rpcErr.message); setSaving(false); return }
    router.push(`/admin/orders/${id}`)
  }

  if (loading) return <div className="space-y-4"><div className="h-10 w-64 animate-pulse rounded bg-gray-200" /><div className="h-64 animate-pulse rounded-xl bg-gray-200" /></div>

  return (
    <div className="mx-auto max-w-5xl">
      <Link href={`/admin/orders/${id}`} className="text-sm font-medium text-gray-500 hover:text-gray-950">← Volver a {orderNumber}</Link>
      <h1 className="mt-3 text-2xl font-bold text-gray-900">Editar pedido {orderNumber}</h1>
      <p className="mt-1 text-sm text-gray-500">Estado: {status} · Modifica items, cupón y envío. Proforma se regenerará con nuevos totales.</p>

      {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Productos ({items.length})</h2>
            <button onClick={openPicker} className="rounded-full bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800">+ Agregar producto</button>
          </div>

          <div className="mt-4 space-y-3">
            {items.length === 0 && <p className="rounded-lg border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400">Sin productos. Agrega al menos uno.</p>}
            {items.map((it) => (
              <div key={it.tempId} className="flex items-center gap-3 rounded-xl border border-gray-200 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">{it.product_name} {it.variant_name && <span className="font-normal text-gray-500">/ {it.variant_name}</span>}</p>
                  <p className="text-xs text-gray-500">{it.product_sku} · {money(it.unit_price)} c/u · {money(it.unit_price * it.quantity)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQty(it.tempId, it.quantity - 1)} className="h-8 w-8 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50">−</button>
                  <input type="number" min={1} value={it.quantity} onChange={(e) => updateQty(it.tempId, parseInt(e.target.value) || 0)} className="w-14 rounded-lg border border-gray-300 px-2 py-1 text-center text-sm focus:border-gray-900 focus:outline-none" />
                  <button onClick={() => updateQty(it.tempId, it.quantity + 1)} className="h-8 w-8 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50">+</button>
                </div>
                <button onClick={() => setItems((p) => p.filter((x) => x.tempId !== it.tempId))} className="ml-1 rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50">Quitar</button>
              </div>
            ))}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <h3 className="font-bold">Cupón</h3>
            <div className="mt-3 flex gap-2">
              <input value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="CÓDIGO" className="flex-1 rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm uppercase focus:border-gray-900 focus:outline-none" />
              <button onClick={validateCoupon} className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800">Validar</button>
            </div>
            {couponErr && <p className="mt-2 text-xs text-red-600">{couponErr}</p>}
            {couponPreview && !couponErr && <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3"><p className="font-mono text-sm font-semibold text-emerald-800">{couponPreview.code}</p><p className="text-xs text-emerald-700">{couponPreview.type === "percentage" ? `${couponPreview.value}%` : money(couponPreview.value)} de descuento</p><button onClick={() => { setCouponCode(""); setCouponPreview(null); setCouponErr("") }} className="mt-2 text-xs font-medium text-gray-600 underline">Quitar cupón</button></div>}
            {!couponPreview && !couponErr && <p className="mt-2 text-xs text-gray-400">Deja vacío para quitar descuento. Se valida min_order, vigencia y límites.</p>}
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <h3 className="font-bold">Resumen</h3>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{money(subtotal)}</span></div>
              <div className="flex items-center justify-between gap-2"><span className="text-gray-500">Envío</span><input type="number" min={0} step="0.01" value={shipping} onChange={(e) => setShipping(parseFloat(e.target.value) || 0)} className="w-24 rounded-lg border border-gray-300 px-2 py-1 text-right text-sm focus:border-gray-900 focus:outline-none" /></div>
              {discount > 0 && <div className="flex justify-between text-emerald-700"><span>Descuento</span><span>-{money(discount)}</span></div>}
              <div className="flex justify-between border-t border-gray-200 pt-3 text-base font-bold"><span>Total</span><span>{money(total)}</span></div>
            </div>
            <button onClick={save} disabled={saving} className="mt-6 w-full rounded-full bg-gray-900 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50">{saving ? "Guardando..." : "Guardar cambios"}</button>
            <Link href={`/admin/orders/${id}`} className="mt-2 block text-center text-sm font-medium text-gray-600 hover:text-gray-900">Cancelar</Link>
          </section>
        </aside>
      </div>

      {pickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-xl">
            <div className="border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold">Agregar producto</h3>
                <button onClick={() => setPickerOpen(false)} className="rounded-full p-2 hover:bg-gray-100">✕</button>
              </div>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre o SKU..." autoFocus className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none" />
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {filteredProducts.length === 0 ? <p className="py-12 text-center text-sm text-gray-400">No hay productos</p> : (
                <div className="space-y-2">
                  {filteredProducts.map((p) => (
                    <div key={p.id} className="rounded-xl border border-gray-200 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                          <p className="text-xs text-gray-500">{p.sku} · {money(p.promotion_active && p.sale_price != null ? p.sale_price : p.base_price)} · stock {p.stock} {p.has_variants && `· ${variantsMap[p.id]?.length || 0} variantes`}</p>
                        </div>
                        {!p.has_variants && <button onClick={() => addItem(p)} className="shrink-0 rounded-full bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800">Agregar</button>}
                      </div>
                      {p.has_variants && variantsMap[p.id] && (
                        <div className="mt-2 grid gap-1.5">
                          {variantsMap[p.id].map((v) => (
                            <div key={v.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                              <div className="min-w-0"><p className="text-xs font-medium text-gray-900">{v.name}</p><p className="text-[11px] text-gray-500">{v.sku} · {v.price_adjustment >= 0 ? "+" : ""}{money(v.price_adjustment)} · stock {v.stock}</p></div>
                              <button onClick={() => addItem(p, v)} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-900 shadow-sm hover:bg-gray-900 hover:text-white">Agregar</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="border-t border-gray-200 p-4 text-right">
              <button onClick={() => setPickerOpen(false)} className="rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
