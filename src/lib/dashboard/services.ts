import { createClient } from "@/lib/supabase/client"
import type {
  KPIItem,
  ChartDataPoint,
  QuickSummary,
  TopProduct,
  LowStockProduct,
  RecentOrder,
  TopCustomer,
  ActivityItem,
  Notification,
  BusinessMetrics,
  ChartPeriod,
} from "./types"
import { computeGrowthPercent } from "./utils"

function getSupabase() {
  return createClient()
}

export async function fetchKPIs(period: number = 30): Promise<KPIItem[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase.rpc("get_dashboard_kpis", { p_days: period })

  if (error || !data) {
    console.error("Error fetching KPIs:", error)
    return []
  }

  const kpis = data as Record<string, { value: number; previous: number; label: string }>
  const sparklineData = await fetchSparklines(period)

  return Object.entries(kpis).map(([metric, kpi]) => ({
    metric,
    value: Number(kpi.value),
    previous: Number(kpi.previous),
    label: kpi.label,
    growthPercent: computeGrowthPercent(Number(kpi.value), Number(kpi.previous)),
    sparklineData: sparklineData[metric] || [],
  }))
}

async function fetchSparklines(period: number): Promise<Record<string, number[]>> {
  const supabase = getSupabase()
  const { data, error } = await supabase.rpc("get_dashboard_kpi_sparklines", {
    p_days: period,
  })

  if (error || !data) {
    return {}
  }

  const result: Record<string, number[]> = {}
  for (const row of data as { metric: string; data_points: number[] }[]) {
    result[row.metric] = row.data_points.map(Number)
  }
  return result
}

export async function fetchChartData(period: ChartPeriod = "30d"): Promise<ChartDataPoint[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase.rpc("get_dashboard_chart_data", {
    p_period: period,
  })

  if (error || !data) {
    console.error("Error fetching chart data:", error)
    return []
  }

  return (data as ChartDataPoint[]).map((d) => ({
    ...d,
    total_sales: Number(d.total_sales),
    order_count: Number(d.order_count),
    total_revenue: Number(d.total_revenue),
    total_profit: Number(d.total_profit),
  }))
}

export async function fetchQuickSummary(): Promise<QuickSummary | null> {
  const supabase = getSupabase()
  const { data, error } = await supabase.rpc("get_dashboard_quick_summary")

  if (error || !data) {
    console.error("Error fetching quick summary:", error)
    return null
  }

  const summary = data as Record<string, number>
  return {
    pedidos_pendientes: Number(summary.pedidos_pendientes),
    pedidos_preparacion: Number(summary.pedidos_preparacion),
    pedidos_enviados: Number(summary.pedidos_enviados),
    pedidos_entregados: Number(summary.pedidos_entregados),
    pedidos_cancelados: Number(summary.pedidos_cancelados),
    pagos_pendientes: Number(summary.pagos_pendientes),
    pagos_completados: Number(summary.pagos_completados),
    devoluciones: Number(summary.devoluciones),
  }
}

export async function fetchTopProducts(
  days: number = 30,
  limit: number = 10
): Promise<TopProduct[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase.rpc("get_dashboard_top_products", {
    p_days: days,
    p_limit: limit,
  })

  if (error || !data) {
    console.error("Error fetching top products:", error)
    return []
  }

  return (data as TopProduct[]).map((p) => ({
    ...p,
    total_sold: Number(p.total_sold),
    stock: Number(p.stock),
    total_revenue: Number(p.total_revenue),
  }))
}

export async function fetchLowStock(): Promise<LowStockProduct[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase.rpc("get_dashboard_low_stock")

  if (error || !data) {
    console.error("Error fetching low stock:", error)
    return []
  }

  return (data as LowStockProduct[]).map((p) => ({
    ...p,
    stock: Number(p.stock),
    low_stock_threshold: Number(p.low_stock_threshold),
  }))
}

export async function fetchRecentOrders(limit: number = 8): Promise<RecentOrder[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase.rpc("get_dashboard_recent_orders", {
    p_limit: limit,
  })

  if (error || !data) {
    console.error("Error fetching recent orders:", error)
    return []
  }

  return (data as RecentOrder[]).map((o) => ({
    ...o,
    total: Number(o.total),
    item_count: Number(o.item_count),
  }))
}

export async function fetchTopCustomers(limit: number = 5): Promise<TopCustomer[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase.rpc("get_dashboard_top_customers", {
    p_limit: limit,
  })

  if (error || !data) {
    console.error("Error fetching top customers:", error)
    return []
  }

  return (data as TopCustomer[]).map((c) => ({
    ...c,
    total_orders: Number(c.total_orders),
    total_spent: Number(c.total_spent),
  }))
}

export async function fetchRecentActivity(limit: number = 15): Promise<ActivityItem[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase.rpc("get_dashboard_recent_activity", {
    p_limit: limit,
  })

  if (error || !data) {
    console.error("Error fetching recent activity:", error)
    return []
  }

  return data as ActivityItem[]
}

export async function fetchNotifications(): Promise<Notification[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase.rpc("get_dashboard_notifications")

  if (error || !data) {
    console.error("Error fetching notifications:", error)
    return []
  }

  return data as Notification[]
}

export async function fetchBusinessMetrics(): Promise<BusinessMetrics | null> {
  const supabase = getSupabase()
  const { data, error } = await supabase.rpc("get_dashboard_business_metrics")

  if (error || !data) {
    console.error("Error fetching business metrics:", error)
    return null
  }

  const m = data as Record<string, number>
  return {
    ticket_promedio: Number(m.ticket_promedio),
    conversion: Number(m.conversion),
    productos_activos: Number(m.productos_activos),
    productos_agotados: Number(m.productos_agotados),
    ventas_promedio_dia: Number(m.ventas_promedio_dia),
    clientes_recurrentes: Number(m.clientes_recurrentes),
    valor_promedio_pedido: Number(m.valor_promedio_pedido),
    productos_sin_ventas: Number(m.productos_sin_ventas),
  }
}
