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
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
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

  const filteredOrders = orders.filter((order) => {
    const query = search.toLowerCase()
    const matchesSearch = !query || order.order_number.toLowerCase().includes(query) || order.profiles?.full_name?.toLowerCase().includes(query) || order.profiles?.email?.toLowerCase().includes(query)
    return matchesSearch && (statusFilter === "all" || order.status === statusFilter)
  })
  const pendingCount = orders.filter((order) => order.status === "pending").length
  const totalValue = orders.reduce((sum, order) => sum + Number(order.total), 0)

  if (loading) return <p className="text-gray-600">Cargando...</p>

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">Gestión comercial</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-950">Pedidos</h1>
          <p className="mt-1 text-sm text-gray-500">Revisa pedidos, clientes y estados de pago.</p>
        </div>
        <div className="text-left sm:text-right"><p className="text-xs text-gray-400">Valor acumulado</p><p className="mt-1 text-xl font-bold text-gray-950">₡{totalValue.toLocaleString("es-CR")}</p></div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4"><p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total pedidos</p><p className="mt-2 text-2xl font-bold text-gray-950">{orders.length}</p></div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4"><p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Pendientes</p><p className="mt-2 text-2xl font-bold text-amber-900">{pendingCount}</p></div>
        <div className="rounded-xl border border-gray-200 bg-gray-950 p-4 text-white"><p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Mostrando</p><p className="mt-2 text-2xl font-bold">{filteredOrders.length}</p></div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por pedido o cliente..." className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-gray-900 sm:max-w-sm" />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-gray-900">
          <option value="all">Todos los estados</option>
          <option value="pending">Pendientes</option>
          <option value="confirmed">Confirmados</option>
          <option value="processing">En proceso</option>
          <option value="shipped">Enviados</option>
          <option value="delivered">Entregados</option>
          <option value="cancelled">Cancelados</option>
        </select>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm max-lg:hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50/80"><tr>
            <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Pedido</th>
            <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Cliente</th>
            <th className="px-5 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-gray-400">Estado</th>
            <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-gray-400">Total</th>
            <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-gray-400">Fecha</th>
            <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-gray-400">Acción</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-100">
            {filteredOrders.map((order) => <tr key={order.id} className="transition-colors hover:bg-gray-50">
              <td className="whitespace-nowrap px-5 py-4"><p className="text-sm font-bold text-gray-950">{order.order_number}</p><p className="mt-1 text-xs text-gray-400">#{order.id.slice(0, 8)}</p></td>
              <td className="px-5 py-4"><p className="max-w-[220px] truncate text-sm font-medium text-gray-800">{order.profiles?.full_name || "Cliente sin nombre"}</p><p className="mt-1 max-w-[220px] truncate text-xs text-gray-400">{order.profiles?.email || "—"}</p></td>
              <td className="whitespace-nowrap px-5 py-4 text-center">{statusBadge(order)}</td>
              <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-bold text-gray-950">₡{Number(order.total).toLocaleString("es-CR")}</td>
              <td className="whitespace-nowrap px-5 py-4 text-right text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString("es-CR")}</td>
              <td className="whitespace-nowrap px-5 py-4 text-right"><Link href={`/admin/orders/${order.id}`} className="inline-flex rounded-full border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:border-gray-950 hover:text-gray-950">Gestionar</Link></td>
            </tr>)}
            {filteredOrders.length === 0 && <tr><td colSpan={6} className="px-6 py-14 text-center text-sm text-gray-500">No hay pedidos que coincidan con la búsqueda.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="mt-4 space-y-3 lg:hidden">
        {filteredOrders.map((order) => <Link key={order.id} href={`/admin/orders/${order.id}`} className="block rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:border-gray-400">
          <div className="flex items-start justify-between gap-3"><div><p className="font-bold text-gray-950">{order.order_number}</p><p className="mt-1 text-xs text-gray-500">{order.profiles?.full_name || order.profiles?.email || "Cliente sin nombre"}</p></div>{statusBadge(order)}</div>
          <div className="mt-4 flex items-end justify-between border-t border-gray-100 pt-3"><div><p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString("es-CR")}</p><p className="mt-1 text-base font-bold text-gray-950">₡{Number(order.total).toLocaleString("es-CR")}</p></div><span className="text-sm font-semibold text-gray-500">Gestionar →</span></div>
        </Link>)}
        {filteredOrders.length === 0 && <p className="rounded-xl border border-dashed border-gray-300 px-4 py-12 text-center text-sm text-gray-500">No hay pedidos que coincidan con la búsqueda.</p>}
      </div>
    </div>
  )
}
