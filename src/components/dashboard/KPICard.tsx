"use client"

import AnimatedCounter from "./AnimatedCounter"
import Sparkline from "./Sparkline"
import { formatCompactCurrency, formatCompactNumber } from "@/lib/dashboard/utils"
import type { KPIItem } from "@/lib/dashboard/types"

const metricIcons: Record<string, React.ReactNode> = {
  ventas_hoy: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  ventas_mes: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M3.75 6v9.75M3.75 6H20.25m0 0v9.75m-16.5 0h16.5" />
    </svg>
  ),
  pedidos_nuevos: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
    </svg>
  ),
  pedidos_pendientes: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  clientes_nuevos: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
    </svg>
  ),
  productos_vendidos: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  ),
  ingresos: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
    </svg>
  ),
  ganancias: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
    </svg>
  ),
}

const moneyMetrics = new Set(["ventas_hoy", "ventas_mes", "ingresos", "ganancias"])

interface KPICardProps {
  kpi: KPIItem
}

export default function KPICard({ kpi }: KPICardProps) {
  const isMoney = moneyMetrics.has(kpi.metric)
  const isPositive = kpi.growthPercent >= 0
  const color = isPositive ? "#059669" : "#dc2626"
  const bgColor = isPositive ? "bg-emerald-50" : "bg-red-50"
  const textColor = isPositive ? "text-emerald-700" : "text-red-700"

  const valueFormatter = isMoney
    ? (v: number) => formatCompactCurrency(Math.round(v))
    : (v: number) => formatCompactNumber(Math.round(v))

  return (
    <div className="group rounded-xl border border-gray-200 bg-white p-5 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50 text-gray-500 transition-colors group-hover:bg-gray-900 group-hover:text-white">
            {metricIcons[kpi.metric]}
          </div>
          <p className="text-xs font-medium text-gray-500">{kpi.label}</p>
        </div>
        <div className={`flex items-center gap-0.5 rounded-full ${bgColor} px-1.5 py-0.5 text-[11px] font-semibold ${textColor}`}>
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            {isPositive ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            )}
          </svg>
          {Math.abs(kpi.growthPercent).toFixed(1)}%
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-1">
        <AnimatedCounter
          value={kpi.value}
          format={valueFormatter}
          className="text-2xl font-bold text-gray-900 tabular-nums"
        />
      </div>

      <p className="mt-0.5 text-[11px] text-gray-400">
        vs período anterior
      </p>

      {kpi.sparklineData.length > 0 && (
        <div className="mt-2 -mx-1 opacity-60">
          <Sparkline data={kpi.sparklineData} color={color} height={32} />
        </div>
      )}
    </div>
  )
}

export function KPICardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shimmer-bg">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-gray-200" />
          <div className="h-3 w-24 rounded bg-gray-200" />
        </div>
        <div className="h-5 w-14 rounded-full bg-gray-200" />
      </div>
      <div className="mt-4 h-7 w-28 rounded bg-gray-200" />
      <div className="mt-2 h-3 w-20 rounded bg-gray-200" />
      <div className="mt-3 h-8 w-full rounded bg-gray-100" />
    </div>
  )
}
