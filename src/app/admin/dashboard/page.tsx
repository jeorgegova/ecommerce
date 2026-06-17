"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"

interface Stat {
  metric: string; current_value: number; previous_value: number; growth_percent: number
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stat[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.rpc("get_dashboard_stats", { p_days: 30 })
      setStats(data || [])
      setLoading(false)
    }
    fetch()
  }, [supabase])

  const labels: Record<string, string> = {
    total_sales: "Ventas totales", total_orders: "Pedidos", new_users: "Nuevos usuarios",
    product_views: "Vistas de productos", products_sold: "Productos vendidos", out_of_stock: "Sin stock",
  }

  const formatValue = (metric: string, val: number) => {
    if (metric === "total_sales") return "$" + val.toLocaleString("es-CO")
    return val.toLocaleString("es-CO")
  }

  if (loading) return <p className="text-gray-600">Cargando dashboard...</p>

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p className="mt-1 text-sm text-gray-600">Resumen de los últimos 30 días</p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <div key={s.metric} className="rounded-xl border border-gray-200 p-6">
            <p className="text-sm font-medium text-gray-500">{labels[s.metric] || s.metric}</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{formatValue(s.metric, s.current_value)}</p>
            {s.metric !== "out_of_stock" && (
              <p className={`mt-1 text-sm ${s.growth_percent >= 0 ? "text-green-600" : "text-red-600"}`}>
                {s.growth_percent >= 0 ? "↑" : "↓"} {Math.abs(s.growth_percent).toFixed(1)}% vs período anterior
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <a href="/admin/orders" className="rounded-xl border border-gray-200 p-6 hover:border-gray-300">
          <h2 className="text-lg font-semibold text-gray-900">Pedidos recientes</h2>
          <p className="mt-1 text-sm text-gray-600">Gestionar pedidos</p>
        </a>
        <a href="/admin/products" className="rounded-xl border border-gray-200 p-6 hover:border-gray-300">
          <h2 className="text-lg font-semibold text-gray-900">Productos</h2>
          <p className="mt-1 text-sm text-gray-600">Gestionar catálogo</p>
        </a>
        <a href="/admin/inventory" className="rounded-xl border border-gray-200 p-6 hover:border-gray-300">
          <h2 className="text-lg font-semibold text-gray-900">Inventario</h2>
          <p className="mt-1 text-sm text-gray-600">Control de stock</p>
        </a>
        <a href="/admin/reviews" className="rounded-xl border border-gray-200 p-6 hover:border-gray-300">
          <h2 className="text-lg font-semibold text-gray-900">Reseñas</h2>
          <p className="mt-1 text-sm text-gray-600">Moderar reseñas</p>
        </a>
      </div>
    </div>
  )
}
