"use client"

import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"

interface ShippingAddress {
  full_name: string
  address_line_1: string
  city: string
  state: string
  phone: string | null
}

interface AdminOrder {
  id: string
  order_number: string
  status: string
  subtotal: number
  shipping_cost: number
  discount: number
  total: number
  shipping_address_id: string | null
  shipping_address: ShippingAddress | null
  created_at: string
  order_statuses: { name: string; color: string } | null
}

interface AdminOrderItem {
  id: string
  product_name: string
  product_sku: string
  variant_name: string | null
  unit_price: number
  quantity: number
  subtotal: number
}

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<AdminOrder | null>(null)
  const [items, setItems] = useState<AdminOrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const { data: o } = await supabase.from("orders").select("*, order_statuses(*)").eq("id", id).single()
      if (o?.shipping_address_id && !o.shipping_address) {
        const { data: address } = await supabase.from("addresses").select("*").eq("id", o.shipping_address_id).maybeSingle()
        if (address) o.shipping_address = address
      }
      if (o) setOrder(o)

      const { data: orderItems } = await supabase.from("order_items").select("*").eq("order_id", id).order("created_at")
      setItems(orderItems || [])
      setLoading(false)
    }
    fetchData()
  }, [supabase, id])

  const updateStatus = async (newStatus: string) => {
    setUpdating(true)
    const { error } = await supabase.rpc("update_order_status", { p_order_id: id, p_new_status: newStatus })
    if (error) {
      alert(error.message)
    } else {
      const { data } = await supabase.from("orders").select("*, order_statuses(*)").eq("id", id).single()
      if (data) setOrder(data)
    }
    setUpdating(false)
  }

  if (loading) return <p className="text-gray-600">Cargando...</p>
  if (!order) return <p className="text-gray-500">Pedido no encontrado</p>

  const nextActions: Record<string, [string, string]> = {
    pending: ["confirmed", "Confirmar pedido"],
    confirmed: ["processing", "Iniciar preparación"],
    processing: ["shipped", "Marcar enviado"],
    shipped: ["delivered", "Marcar entregado"],
  }
  const nextAction = nextActions[order.status]

  return (
    <div className="mx-auto max-w-7xl">
      <Link href="/admin/orders" className="text-xs font-semibold text-gray-500 transition-colors hover:text-gray-950">← Volver a pedidos</Link>

      <section className="mt-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">Gestión de pedido</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-950">{order.order_number}</h1>
            <p className="mt-1 text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString("es-CR", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {nextAction && <button onClick={() => updateStatus(nextAction[0])} disabled={updating} className="rounded-full bg-gray-950 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:opacity-50">{updating ? "Actualizando..." : nextAction[1]}</button>}
            {!['cancelled', 'delivered', 'shipped'].includes(order.status) && <button onClick={() => updateStatus("cancelled")} disabled={updating} className="rounded-full border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50">Cancelar pedido</button>}
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-5">
          <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold" style={{ borderColor: order.order_statuses?.color || "#D1D5DB", color: order.order_statuses?.color || "#4B5563" }}>
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: order.order_statuses?.color || "#9CA3AF" }} />
            {order.order_statuses?.name || order.status}
          </span>
          <span className="text-xs text-gray-400">{updating ? "Guardando cambio..." : "Estado actual del pedido"}</span>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
            <h2 className="font-bold text-gray-950">Productos</h2>
            <p className="mt-1 text-xs text-gray-500">{items.length} {items.length === 1 ? "línea de pedido" : "líneas de pedido"}</p>
          </div>
          <div className="divide-y divide-gray-100">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 px-5 py-5 sm:px-6">
                <div className="min-w-0"><p className="font-semibold text-gray-950">{item.product_name}</p>{item.variant_name && <p className="mt-1 text-sm text-gray-500">{item.variant_name}</p>}<p className="mt-2 text-xs text-gray-400">SKU {item.product_sku} · Cantidad {item.quantity}</p></div>
                <div className="flex-shrink-0 text-right"><p className="text-sm text-gray-500">₡{Number(item.unit_price).toLocaleString("es-CR")} c/u</p><p className="mt-1 font-bold text-gray-950">₡{Number(item.subtotal).toLocaleString("es-CR")}</p></div>
              </div>
            ))}
            {items.length === 0 && <p className="px-6 py-12 text-center text-sm text-gray-500">No hay productos en este pedido.</p>}
          </div>
        </section>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">Resumen financiero</p>
            <div className="mt-5 space-y-3 text-sm"><div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>₡{Number(order.subtotal).toLocaleString("es-CR")}</span></div><div className="flex justify-between"><span className="text-gray-500">Envío</span><span>{Number(order.shipping_cost) > 0 ? `₡${Number(order.shipping_cost).toLocaleString("es-CR")}` : "Por calcular"}</span></div>{order.discount > 0 && <div className="flex justify-between"><span className="text-gray-500">Descuento</span><span>-₡{Number(order.discount).toLocaleString("es-CR")}</span></div>}</div>
            <div className="mt-5 border-t border-gray-200 pt-5"><div className="flex items-end justify-between"><span className="font-semibold">Total</span><span className="text-2xl font-bold tracking-tight">₡{Number(order.total).toLocaleString("es-CR")}</span></div></div>
          </section>
          {order.shipping_address && <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">Entrega</p><p className="mt-4 font-semibold text-gray-950">{order.shipping_address.full_name}</p><p className="mt-1 text-sm text-gray-600">{order.shipping_address.address_line_1}</p><p className="mt-1 text-sm text-gray-500">{order.shipping_address.city}, {order.shipping_address.state}</p>{order.shipping_address.phone && <p className="mt-3 border-t border-gray-100 pt-3 text-xs text-gray-500">Tel. {order.shipping_address.phone}</p>}</section>}
        </aside>
      </div>
    </div>
  )
}
