"use client"

import { createClient } from "@/lib/supabase/client"
import { downloadProformaPdf, getSettingValue } from "@/lib/utils/proforma-pdf"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"

interface Address { full_name: string; phone: string | null; address_line_1: string; address_line_2: string | null; city: string; state: string }
interface Order { id: string; order_number: string; status: string; subtotal: number; shipping_cost: number; discount: number; total: number; shipping_address: Address | null; shipping_address_id: string | null; created_at: string; order_statuses: { name: string; color: string } | null }
interface OrderItem { id: string; product_id: string; product_name: string; product_sku: string; variant_name: string | null; unit_price: number; quantity: number; subtotal: number; product_images?: { url: string; is_main: boolean }[] }

const labels: Record<string, string> = { pending: "Pendiente", confirmed: "Confirmado", paid: "Pagado", processing: "En preparación", shipped: "Enviado", delivered: "Entregado", cancelled: "Cancelado" }
const money = (value: number) => `$${Number(value || 0).toLocaleString("es-CO")}`

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState("")
  const supabase = createClient()

  useEffect(() => {
    const fetchOrder = async () => {
      const { data: found, error: orderError } = await supabase.from("orders").select("*, order_statuses(name, color)").eq("id", id).single()
      if (orderError || !found) { setError(orderError?.message || "Pedido no encontrado"); setLoading(false); return }
      const { data: orderItems } = await supabase.from("order_items").select("*").eq("order_id", id).order("created_at")
      const productIds = (orderItems || []).map((item) => item.product_id)
      const { data: images } = productIds.length ? await supabase.from("product_images").select("product_id, url, is_main").in("product_id", productIds).order("sort_order") : { data: [] }
      let address = found.shipping_address
      if (!address && found.shipping_address_id) {
        const { data } = await supabase.from("addresses").select("*").eq("id", found.shipping_address_id).single()
        address = data
      }
      setOrder({ ...found, shipping_address: address })
      setItems((orderItems || []).map((item) => ({ ...item, product_images: (images || []).filter((image) => image.product_id === item.product_id) })))
      setLoading(false)
    }
    fetchOrder()
  }, [supabase, id])

  const download = async () => {
    if (!order) return
    setDownloading(true); setError("")
    const [{ data: settings }, { data: userData }] = await Promise.all([
      supabase.from("settings").select("key, value").in("key", ["banco_consignar", "numero_cuenta_bancaria"]),
      supabase.auth.getUser(),
    ])
    try {
      await downloadProformaPdf({
        orderNumber: order.order_number, createdAt: order.created_at, status: order.status,
        subtotal: order.subtotal, shipping_cost: order.shipping_cost, discount: order.discount, total: order.total,
        items, customerName: order.shipping_address?.full_name, customerEmail: userData.user?.email,
        customerPhone: order.shipping_address?.phone, address: order.shipping_address?.address_line_1,
        city: order.shipping_address?.city, state: order.shipping_address?.state,
        bankName: getSettingValue(settings, "banco_consignar"), bankAccount: getSettingValue(settings, "numero_cuenta_bancaria"),
      })
    } catch (downloadError) { setError(downloadError instanceof Error ? downloadError.message : "No fue posible generar la proforma") }
    setDownloading(false)
  }

  if (loading) return <div className="mx-auto max-w-6xl px-4 py-16"><div className="h-8 w-56 animate-pulse rounded bg-gray-200" /><div className="mt-8 h-48 animate-pulse rounded-2xl bg-gray-100" /></div>
  if (!order) return <p className="mx-auto max-w-6xl px-4 py-16 text-gray-500">{error || "Pedido no encontrado"}</p>
  const addr = order.shipping_address
  const color = order.order_statuses?.color || "#6B7280"

  return <div className="bg-gray-50/70"><div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
    <Link href="/account/orders" className="text-sm font-medium text-gray-500 hover:text-gray-900">← Volver a Mis pedidos</Link>
    <header className="mt-6 flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
      <div><p className="text-sm text-gray-500">Detalle del pedido</p><h1 className="mt-1 text-2xl font-bold text-gray-950">{order.order_number}</h1><p className="mt-1 text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" })}</p></div>
      <div className="flex flex-wrap items-center gap-3"><span className="rounded-full px-3 py-1.5 text-sm font-semibold" style={{ backgroundColor: `${color}20`, color }}>{labels[order.status] || order.status}</span><button onClick={download} disabled={downloading} className="rounded-full bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50">{downloading ? "Generando..." : "Descargar proforma"}</button></div>
    </header>
    {error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_330px]">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6"><h2 className="text-lg font-bold text-gray-950">Productos</h2><div className="mt-4 divide-y divide-gray-100">{items.map((item) => { const image = item.product_images?.find((entry) => entry.is_main)?.url || item.product_images?.[0]?.url; return <div key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0"><div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-100">{image && <img src={image} alt="" className="h-full w-full object-cover" />}</div><div className="min-w-0 flex-1"><p className="font-semibold text-gray-950">{item.product_name}</p>{item.variant_name && <p className="text-sm text-gray-500">{item.variant_name}</p>}<p className="mt-1 text-xs text-gray-400">SKU: {item.product_sku || "Pendiente"} · Cantidad: {item.quantity}</p></div><div className="text-right"><p className="font-semibold text-gray-950">{money(item.subtotal)}</p><p className="text-xs text-gray-500">{money(item.unit_price)} c/u</p></div></div> })}</div></section>
      <aside className="space-y-6"><section className="rounded-2xl border border-gray-200 bg-white p-6"><h2 className="font-bold text-gray-950">Resumen financiero</h2><div className="mt-4 space-y-3 text-sm"><div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{money(order.subtotal)}</span></div><div className="flex justify-between"><span className="text-gray-500">Envío</span><span>{money(order.shipping_cost)}</span></div>{order.discount > 0 && <div className="flex justify-between text-red-600"><span>Descuento</span><span>-{money(order.discount)}</span></div>}<div className="flex justify-between border-t border-gray-200 pt-3 text-base font-bold"><span>Total</span><span>{money(order.total)}</span></div></div></section>{addr && <section className="rounded-2xl border border-gray-200 bg-white p-6"><h2 className="font-bold text-gray-950">Dirección de entrega</h2><div className="mt-3 space-y-1 text-sm text-gray-600"><p className="font-medium text-gray-900">{addr.full_name}</p>{addr.phone && <p>{addr.phone}</p>}<p>{addr.address_line_1}</p>{addr.address_line_2 && <p>{addr.address_line_2}</p>}<p>{addr.city}, {addr.state}</p></div></section>}</aside>
    </div>
  </div></div>
}
