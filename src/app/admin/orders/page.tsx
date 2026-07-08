"use client"

import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { useEffect, useState } from "react"

interface Order {
  id: string; order_number: string; status: string; total: number; user_id: string; created_at: string
  order_statuses: { name: string; color: string } | null
  profiles: { full_name: string; email: string } | null
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchOrders = async () => {
      const { data } = await supabase
        .from("orders")
        .select("*, order_statuses(name, color), profiles(full_name, email)")
        .order("created_at", { ascending: false })

      setOrders(data || [])
      setLoading(false)
    }
    fetchOrders()
  }, [supabase])

  const statusBadge = (order: Order) => {
    const color = order.order_statuses?.color || "#6B7280"
    return (
      <span className="inline-flex rounded-full px-2 py-1 text-xs font-medium"
        style={{ backgroundColor: color + "20", color }}>
        {order.order_statuses?.name || order.status}
      </span>
    )
  }

  if (loading) return <p className="text-gray-600">Cargando...</p>

  return (
    <div>
      <p className="text-sm text-gray-500">{orders.length} pedidos</p>

      <div className="mt-8 overflow-hidden rounded-xl border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Pedido</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Cliente</th>
              <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Estado</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Total</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Fecha</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{order.order_number}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{order.profiles?.full_name || order.profiles?.email || "—"}</td>
                <td className="whitespace-nowrap px-6 py-4 text-center">{statusBadge(order)}</td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">${Number(order.total).toLocaleString("es-CO")}</td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString("es-CO")}</td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                  <Link href={`/admin/orders/${order.id}`} className="font-medium text-gray-900 hover:text-gray-600">Gestionar</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
