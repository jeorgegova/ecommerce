"use client"

import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface Order {
  id: string; order_number: string; status: string; total: number
  subtotal: number; shipping_cost: number; created_at: string
  order_statuses: { name: string; color: string } | null
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchOrders = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/login"); return }

      const { data } = await supabase
        .from("orders")
        .select("*, order_statuses(name, color)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      setOrders(data || [])
      setLoading(false)
    }
    fetchOrders()
  }, [supabase, router])

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900">Mis Pedidos</h1>
      {loading ? (
        <p className="mt-8 text-gray-600">Cargando...</p>
      ) : orders.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-gray-500">No tienes pedidos aún</p>
          <Link href="/products" className="mt-4 inline-block rounded-full bg-gray-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-800">Ver productos</Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {orders.map((order) => (
            <Link key={order.id} href={`/account/orders/${order.id}`} className="flex items-center justify-between rounded-xl border border-gray-200 p-5 hover:border-gray-300">
              <div>
                <p className="font-medium text-gray-900">{order.order_number}</p>
                <p className="mt-1 text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString("es-CO")}</p>
              </div>
              <div className="text-right">
                <span className="inline-flex rounded-full px-3 py-1 text-xs font-medium"
                  style={{ backgroundColor: (order.order_statuses?.color || "#6B7280") + "20", color: order.order_statuses?.color || "#6B7280" }}>
                  {order.order_statuses?.name || order.status}
                </span>
                <p className="mt-1 text-sm font-medium text-gray-900">${Number(order.total).toLocaleString("es-CO")}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
