"use client"

import { createClient } from "@/lib/supabase/client"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [statuses, setStatuses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const { data: o } = await supabase.from("orders").select("*, order_statuses(*)").eq("id", id).single()
      if (o) setOrder(o)

      const { data: i } = await supabase.from("order_items").select("*").eq("order_id", id).order("created_at")
      if (i) setItems(i)

      const { data: s } = await supabase.from("order_statuses").select("*").order("sort_order")
      if (s) setStatuses(s)

      setLoading(false)
    }
    fetchData()
  }, [supabase, id])

  const updateStatus = async (newStatus: string) => {
    setUpdating(true)
    const { error } = await supabase.rpc("update_order_status", {
      p_order_id: id,
      p_new_status: newStatus,
    })

    if (error) {
      alert(error.message)
    } else {
      const { data: o } = await supabase.from("orders").select("*, order_statuses(*)").eq("id", id).single()
      if (o) setOrder(o)
    }
    setUpdating(false)
  }

  if (loading) return <p className="text-gray-600">Cargando...</p>
  if (!order) return <p className="text-gray-500">Pedido no encontrado</p>

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{order.order_number}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {new Date(order.created_at).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {order.status === "pending" && (
            <button onClick={() => updateStatus("confirmed")} disabled={updating}
              className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              Confirmar
            </button>
          )}
          {order.status === "confirmed" && (
            <button onClick={() => updateStatus("processing")} disabled={updating}
              className="rounded-full bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50">
              Procesar
            </button>
          )}
          {order.status === "processing" && (
            <button onClick={() => updateStatus("shipped")} disabled={updating}
              className="rounded-full bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700 disabled:opacity-50">
              Marcar Enviado
            </button>
          )}
          {order.status === "shipped" && (
            <button onClick={() => updateStatus("delivered")} disabled={updating}
              className="rounded-full bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
              Marcar Entregado
            </button>
          )}
          {!["cancelled", "delivered", "shipped"].includes(order.status) && (
            <button onClick={() => updateStatus("cancelled")} disabled={updating}
              className="rounded-full border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50">
              Cancelar
            </button>
          )}
        </div>
      </div>

      <div className="mt-6">
        <span className="inline-flex rounded-full px-3 py-1 text-sm font-medium"
          style={{ backgroundColor: (order.order_statuses?.color || "#6B7280") + "20", color: order.order_statuses?.color || "#6B7280" }}>
          {order.order_statuses?.name || order.status}
        </span>
      </div>

      <div className="mt-8 space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
            <div>
              <p className="font-medium text-gray-900">{item.product_name}</p>
              {item.variant_name && <p className="text-sm text-gray-500">{item.variant_name}</p>}
              <p className="text-sm text-gray-500">SKU: {item.product_sku} × {item.quantity}</p>
            </div>
            <p className="font-medium text-gray-900">${Number(item.unit_price).toLocaleString("es-CO")} c/u</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-gray-200 p-6 max-w-sm">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span>${Number(order.subtotal).toLocaleString("es-CO")}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">Envío</span><span>${Number(order.shipping_cost).toLocaleString("es-CO")}</span></div>
          {order.discount > 0 && <div className="flex justify-between"><span className="text-gray-600">Descuento</span><span className="text-red-500">-${Number(order.discount).toLocaleString("es-CO")}</span></div>}
          <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold"><span>Total</span><span>${Number(order.total).toLocaleString("es-CO")}</span></div>
        </div>
      </div>
    </div>
  )
}
