"use client"

import { createClient } from "@/lib/supabase/client"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"

interface Order {
  id: string; order_number: string; status: string; subtotal: number
  shipping_cost: number; discount: number; total: number; notes: string | null
  shipping_address: any; created_at: string; updated_at: string
  order_statuses: { name: string; color: string } | null
}

interface OrderItem {
  id: string; product_id: string; variant_id: string | null
  product_name: string; product_sku: string; variant_name: string | null
  unit_price: number; quantity: number; subtotal: number
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchOrder = async () => {
      const { data: o } = await supabase.from("orders").select("*, order_statuses(name, color)").eq("id", id).single()
      if (o) setOrder(o)

      const { data: i } = await supabase.from("order_items").select("*").eq("order_id", id)
      if (i) setItems(i)

      setLoading(false)
    }
    fetchOrder()
  }, [supabase, id])

  if (loading) return <p className="text-center py-24 text-gray-600">Cargando...</p>
  if (!order) return <p className="text-center py-24 text-gray-500">Pedido no encontrado</p>

  const addr = order.shipping_address as any

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{order.order_number}</h1>
          <span className="inline-flex rounded-full px-3 py-1 text-sm font-medium"
            style={{ backgroundColor: (order.order_statuses?.color || "#6B7280") + "20", color: order.order_statuses?.color || "#6B7280" }}>
            {order.order_statuses?.name || order.status}
          </span>
        </div>
        <p className="mt-1 text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>

        <div className="mt-8 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
              <div>
                <p className="font-medium text-gray-900">{item.product_name}</p>
                {item.variant_name && <p className="text-sm text-gray-500">{item.variant_name}</p>}
                <p className="text-sm text-gray-500">SKU: {item.product_sku} × {item.quantity}</p>
              </div>
              <p className="font-medium text-gray-900">${Number(item.subtotal).toLocaleString("es-CO")}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-xl border border-gray-200 p-6">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span>${Number(order.subtotal).toLocaleString("es-CO")}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Envío</span><span>${Number(order.shipping_cost).toLocaleString("es-CO")}</span></div>
            {order.discount > 0 && <div className="flex justify-between"><span className="text-gray-600">Descuento</span><span className="text-red-500">-${Number(order.discount).toLocaleString("es-CO")}</span></div>}
            <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold"><span>Total</span><span>${Number(order.total).toLocaleString("es-CO")}</span></div>
          </div>
        </div>

        {addr && (
          <div className="mt-6 rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-900">Dirección de Envío</h2>
            <div className="mt-2 text-sm text-gray-600">
              <p>{addr.full_name}</p>
              <p>{addr.address_line_1}</p>
              <p>{addr.city}, {addr.state}</p>
            </div>
          </div>
        )}
      </div>
  )
}
