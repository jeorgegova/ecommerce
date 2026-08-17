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
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">Tu actividad</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-950">Mis pedidos</h1>
          <p className="mt-2 text-sm text-gray-500">Consulta el estado y los detalles de tus compras.</p>
        </div>
        {!loading && orders.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-left shadow-sm sm:text-right">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Pedidos realizados</p>
            <p className="mt-1 text-xl font-bold text-gray-950">{orders.length}</p>
          </div>
        )}
      </div>
      {loading ? (
        <div className="mt-8 space-y-4">
          {[1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl bg-gray-100" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400" aria-hidden="true">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5 12 3 3.75 7.5m16.5 0v9L12 21l-8.25-4.5v-9m16.5 0L12 12 3.75 7.5M12 12v9" />
            </svg>
          </div>
          <h2 className="mt-5 font-semibold text-gray-950">Todavía no tienes pedidos</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-gray-500">Cuando realices una compra, podrás consultar aquí su estado y descargar la proforma.</p>
          <Link href="/products" className="mt-6 inline-flex rounded-full bg-gray-950 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800">Explorar productos</Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {orders.map((order) => (
            <Link key={order.id} href={`/account/orders/${order.id}`} className="group block rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-gray-400 hover:shadow-md sm:p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gray-950 text-white" aria-hidden="true">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5 12 3 3.75 7.5m16.5 0v9L12 21l-8.25-4.5v-9m16.5 0L12 12 3.75 7.5M12 12v9" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-bold text-gray-950">{order.order_number}</p>
                    <p className="mt-1 text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" })}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-5 sm:justify-end">
                  <div className="text-left sm:text-right">
                    <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold"
                      style={{ borderColor: order.order_statuses?.color || "#D1D5DB", color: order.order_statuses?.color || "#4B5563" }}>
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: order.order_statuses?.color || "#9CA3AF" }} />
                      {order.order_statuses?.name || order.status}
                    </span>
                    <p className="mt-2 text-base font-bold text-gray-950">${Number(order.total).toLocaleString("es-CO")}</p>
                  </div>
                  <span className="text-xl text-gray-300 transition-transform group-hover:translate-x-1 group-hover:text-gray-900" aria-hidden="true">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
