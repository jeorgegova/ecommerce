"use client"

import { useQuickSummary } from "@/lib/dashboard/hooks"
import { formatNumber } from "@/lib/dashboard/utils"

const summaryItems = [
  { key: "pedidos_pendientes" as const, label: "Pendientes", color: "bg-amber-500" },
  { key: "pedidos_preparacion" as const, label: "En preparación", color: "bg-purple-500" },
  { key: "pedidos_enviados" as const, label: "Enviados", color: "bg-cyan-500" },
  { key: "pedidos_entregados" as const, label: "Entregados", color: "bg-emerald-500" },
  { key: "pedidos_cancelados" as const, label: "Cancelados", color: "bg-red-500" },
  { key: "pagos_pendientes" as const, label: "Pagos pend.", color: "bg-amber-500" },
  { key: "pagos_completados" as const, label: "Pagos comp.", color: "bg-emerald-500" },
  { key: "devoluciones" as const, label: "Devoluciones", color: "bg-red-500" },
]

export default function QuickSummary() {
  const { data: summary, isLoading } = useQuickSummary()

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="h-4 w-32 rounded bg-gray-200 shimmer-bg mb-4" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-gray-100 shimmer-bg" />
          ))}
        </div>
      </div>
    )
  }

  if (!summary) return null

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
        Resumen rápido
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {summaryItems.map(({ key, label, color }) => (
          <div
            key={key}
            className="flex items-center gap-2.5 rounded-lg bg-gray-50 p-2.5 transition-colors hover:bg-gray-100"
          >
            <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${color}`} />
            <div className="min-w-0">
              <p className="text-[11px] text-gray-500 truncate">{label}</p>
              <p className="text-sm font-semibold text-gray-900 tabular-nums">
                {formatNumber(summary[key])}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
