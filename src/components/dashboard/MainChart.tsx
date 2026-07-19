"use client"

import { useState } from "react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { useChartData } from "@/lib/dashboard/hooks"
import type { ChartPeriod, ChartMetric } from "@/lib/dashboard/types"
import { CHART_PERIODS, CHART_METRICS } from "@/lib/dashboard/types"
import { formatCompactCurrency } from "@/lib/dashboard/utils"

const metricColors: Record<string, string> = {
  total_sales: "#059669",
  order_count: "#2563eb",
  total_revenue: "#7c3aed",
  total_profit: "#0891b2",
}

const metricLabels: Record<string, string> = {
  total_sales: "Ventas",
  order_count: "Pedidos",
  total_revenue: "Ingresos",
  total_profit: "Ganancias",
}

export default function MainChart() {
  const [period, setPeriod] = useState<ChartPeriod>("30d")
  const [activeMetrics, setActiveMetrics] = useState<ChartMetric[]>([
    "total_sales",
    "order_count",
  ])
  const { data: chartData, isLoading } = useChartData(period)

  const toggleMetric = (metric: ChartMetric) => {
    setActiveMetrics((prev) =>
      prev.includes(metric)
        ? prev.filter((m) => m !== metric)
        : [...prev, metric]
    )
  }

  const formatXAxis = (dateStr: string) => {
    const date = new Date(dateStr)
    if (period === "7d") {
      return date.toLocaleDateString("es-CO", { weekday: "short" })
    }
    if (period === "30d") {
      return date.toLocaleDateString("es-CO", { day: "numeric", month: "short" })
    }
    return date.toLocaleDateString("es-CO", { day: "numeric", month: "short" })
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null
    const date = new Date(label)
    const dateStr = date.toLocaleDateString("es-CO", {
      weekday: "long",
      day: "numeric",
      month: "long",
    })

    return (
      <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-lg">
        <p className="text-xs font-medium text-gray-500 mb-2">{dateStr}</p>
        {payload.map((entry: any) => (
          <div key={entry.name} className="flex items-center justify-between gap-4 py-0.5">
            <div className="flex items-center gap-2">
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs text-gray-600">{entry.name}</span>
            </div>
            <span className="text-xs font-semibold text-gray-900">
              {entry.name === "Pedidos"
                ? entry.value
                : formatCompactCurrency(entry.value)}
            </span>
          </div>
        ))}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 w-32 rounded bg-gray-200 shimmer-bg" />
          <div className="flex gap-1">
            {CHART_PERIODS.map((p) => (
              <div key={p.value} className="h-8 w-14 rounded-lg bg-gray-200 shimmer-bg" />
            ))}
          </div>
        </div>
        <div className="h-[280px] rounded-lg bg-gray-100 shimmer-bg" />
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Ventas y pedidos</h3>
        <div className="flex gap-1">
          {CHART_PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                period === p.value
                  ? "bg-gray-900 text-white"
                  : "bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {CHART_METRICS.map((m) => (
          <button
            key={m.value}
            onClick={() => toggleMetric(m.value)}
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
              activeMetrics.includes(m.value)
                ? "bg-gray-900 text-white"
                : "bg-gray-50 text-gray-500 hover:bg-gray-100"
            }`}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: m.color }}
            />
            {m.label}
          </button>
        ))}
      </div>

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData || []}>
            <defs>
              {CHART_METRICS.map((m) => (
                <linearGradient key={m.value} id={`gradient-${m.value}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={m.color} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={m.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxis}
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={{ stroke: "#f3f4f6" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) =>
                v >= 1000 ? (v / 1000).toFixed(0) + "K" : v.toFixed(0)
              }
            />
            <Tooltip content={<CustomTooltip />} />
            {activeMetrics.map((metric) => (
              <Area
                key={metric}
                type="monotone"
                dataKey={metric}
                name={metricLabels[metric]}
                stroke={metricColors[metric]}
                strokeWidth={2}
                fill={`url(#gradient-${metric})`}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
