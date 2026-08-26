"use client"

import { useState } from "react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useChartData } from "@/lib/dashboard/hooks"
import type { ChartPeriod, ChartMetric } from "@/lib/dashboard/types"
import { CHART_PERIODS } from "@/lib/dashboard/types"

const metricColors: Record<string, string> = { total_sales: "#3b82f6", order_count: "#8b5cf6", total_revenue: "#10b981", total_profit: "#f59e0b" }
const metricLabels: Record<string, string> = { total_sales: "Ventas", order_count: "Pedidos", total_revenue: "Ingresos", total_profit: "Ganancias" }

export default function RevenueChart() {
  const [period, setPeriod] = useState<ChartPeriod>("30d")
  const [activeMetric, setActiveMetric] = useState<ChartMetric>("total_sales")
  const { data: chartData, isLoading } = useChartData(period)

  const formatX = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString("es-CR", { day: "numeric", month: "short" })
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="h-5 w-32 rounded bg-gray-200 shimmer-bg mb-4" />
        <div className="h-[260px] rounded-xl bg-gray-100 shimmer-bg" />
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-[15px] font-semibold text-gray-900">Rendimiento</h3>
        <div className="flex gap-1">
          {CHART_PERIODS.map((p) => (
            <button key={p.value} onClick={() => setPeriod(p.value)}
              className={`rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-colors ${period === p.value ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-500 hover:bg-gray-100"}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        {(Object.keys(metricLabels) as ChartMetric[]).map((m) => (
          <button key={m} onClick={() => setActiveMetric(m)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors ${activeMetric === m ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-500 hover:bg-gray-100"}`}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: metricColors[m] }} />
            {metricLabels[m]}
          </button>
        ))}
      </div>

      <div className="h-[260px]">
        <ResponsiveContainer>
          <AreaChart data={chartData || []} key={activeMetric + period}>
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={metricColors[activeMetric]} stopOpacity={0.2} />
                <stop offset="95%" stopColor={metricColors[activeMetric]} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="date" tickFormatter={formatX} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false}
              tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} />
            <Tooltip content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null
              return (
                <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-lg">
                  <p className="text-[11px] font-medium text-gray-500">{label ? new Date(label).toLocaleDateString("es-CR", { day: "numeric", month: "long" }) : ""}</p>
                  <p className="text-[14px] font-semibold text-gray-900">
                    {activeMetric === "order_count" ? payload[0].value : `₡${Number(payload[0].value).toLocaleString("es-CR")}`}
                  </p>
                </div>
              )
            }} />
            <Area type="monotone" dataKey={activeMetric} stroke={metricColors[activeMetric]} strokeWidth={2.5}
              fill="url(#chartGradient)" dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
              isAnimationActive={true} animationDuration={1000} animationEasing="ease-out" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
