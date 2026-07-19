"use client"

import { useBusinessMetrics } from "@/lib/dashboard/hooks"
import { formatCompactCurrency, formatNumber } from "@/lib/dashboard/utils"

const metricItems = [
  { key: "ticket_promedio" as const, label: "Ticket promedio", format: formatCompactCurrency, icon: "💰" },
  { key: "conversion" as const, label: "Conversión", format: (v: number) => v.toFixed(1) + "%", icon: "📈" },
  { key: "productos_activos" as const, label: "Productos activos", format: formatNumber, icon: "📦" },
  { key: "productos_agotados" as const, label: "Productos agotados", format: formatNumber, icon: "🚫" },
  { key: "ventas_promedio_dia" as const, label: "Ventas promedio/día", format: formatCompactCurrency, icon: "📊" },
  { key: "clientes_recurrentes" as const, label: "Clientes recurrentes", format: formatNumber, icon: "🔄" },
  { key: "valor_promedio_pedido" as const, label: "Valor promedio pedido", format: formatCompactCurrency, icon: "🛒" },
  { key: "productos_sin_ventas" as const, label: "Productos sin ventas", format: formatNumber, icon: "📭" },
]

export default function BusinessMetrics() {
  const { data: metrics, isLoading } = useBusinessMetrics()

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="h-4 w-36 rounded bg-gray-200 shimmer-bg mb-4" />
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 rounded-lg bg-gray-100 shimmer-bg" />
          ))}
        </div>
      </div>
    )
  }

  if (!metrics) return null

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
        Indicadores del negocio
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {metricItems.map(({ key, label, format, icon }) => (
          <div
            key={key}
            className="rounded-lg bg-gray-50 p-2.5 transition-colors hover:bg-gray-100"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">{label}</span>
              <span className="text-xs">{icon}</span>
            </div>
            <p className="mt-0.5 text-sm font-bold text-gray-900 tabular-nums">
              {format(metrics[key])}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
