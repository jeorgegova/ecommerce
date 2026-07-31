"use client"

import { useQuickSummary } from "@/lib/dashboard/hooks"
import Link from "next/link"

export default function SummaryCards() {
  const { data: summary, isLoading } = useQuickSummary()

  const cards = [
    { key: "pedidos_pendientes", label: "Pendientes", color: "bg-amber-50 text-amber-700", dot: "bg-amber-400", href: "/admin/orders" },
    { key: "pedidos_preparacion", label: "En proceso", color: "bg-blue-50 text-blue-700", dot: "bg-blue-400", href: "/admin/orders" },
    { key: "pedidos_enviados", label: "Enviados", color: "bg-violet-50 text-violet-700", dot: "bg-violet-400", href: "/admin/orders" },
    { key: "pedidos_entregados", label: "Entregados", color: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-400", href: "/admin/orders" },
    { key: "pedidos_cancelados", label: "Cancelados", color: "bg-red-50 text-red-700", dot: "bg-red-400", href: "/admin/orders" },
  ]

  if (isLoading || !summary) return null

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="text-[13px] font-semibold text-gray-900 mb-3">Resumen de pedidos</h3>
      <div className="space-y-2">
        {cards.map((c) => {
          const val = (summary as any)[c.key] || 0
          return (
            <Link key={c.key} href={c.href} className={`flex items-center justify-between rounded-xl px-3 py-2.5 transition-colors hover:bg-gray-50 ${c.color}`}>
              <div className="flex items-center gap-2.5">
                <span className={`h-2 w-2 rounded-full ${c.dot}`} />
                <span className="text-[12px] font-medium">{c.label}</span>
              </div>
              <span className="text-[13px] font-bold">{val}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
