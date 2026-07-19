export interface KPI {
  value: number
  previous: number
  label: string
}

export interface KPIItem {
  metric: string
  value: number
  previous: number
  label: string
  growthPercent: number
  sparklineData: number[]
}

export interface ChartDataPoint {
  date: string
  total_sales: number
  order_count: number
  total_revenue: number
  total_profit: number
}

export interface QuickSummary {
  pedidos_pendientes: number
  pedidos_preparacion: number
  pedidos_enviados: number
  pedidos_entregados: number
  pedidos_cancelados: number
  pagos_pendientes: number
  pagos_completados: number
  devoluciones: number
}

export interface TopProduct {
  product_id: string
  product_name: string
  category_name: string
  total_sold: number
  stock: number
  total_revenue: number
  main_image: string | null
}

export interface LowStockProduct {
  product_id: string
  product_name: string
  sku: string
  stock: number
  low_stock_threshold: number
  status: string
  severity: "critico" | "bajo" | "normal"
  main_image: string | null
}

export interface RecentOrder {
  order_id: string
  order_number: string
  customer_name: string
  customer_email: string
  total: number
  status: string
  status_name: string
  status_color: string
  created_at: string
  item_count: number
}

export interface TopCustomer {
  user_id: string
  full_name: string
  email: string
  avatar_url: string | null
  total_orders: number
  total_spent: number
  last_order_date: string
}

export interface ActivityItem {
  activity_id: string
  activity_type: string
  description: string
  entity_type: string
  entity_id: string
  created_at: string
  icon: string
}

export interface Notification {
  notification_id: string
  notification_type: string
  message: string
  severity: "critical" | "warning" | "info"
  action_url: string
  action_label: string
}

export interface BusinessMetrics {
  ticket_promedio: number
  conversion: number
  productos_activos: number
  productos_agotados: number
  ventas_promedio_dia: number
  clientes_recurrentes: number
  valor_promedio_pedido: number
  productos_sin_ventas: number
}

export interface DashboardData {
  kpis: KPIItem[]
  chartData: ChartDataPoint[]
  quickSummary: QuickSummary | null
  topProducts: TopProduct[]
  lowStock: LowStockProduct[]
  recentOrders: RecentOrder[]
  topCustomers: TopCustomer[]
  recentActivity: ActivityItem[]
  notifications: Notification[]
  businessMetrics: BusinessMetrics | null
}

export type ChartPeriod = "7d" | "30d" | "90d" | "180d" | "1y"

export type ChartMetric = "total_sales" | "order_count" | "total_revenue" | "total_profit"

export const CHART_PERIODS: { value: ChartPeriod; label: string }[] = [
  { value: "7d", label: "7 días" },
  { value: "30d", label: "30 días" },
  { value: "90d", label: "3 meses" },
  { value: "180d", label: "6 meses" },
  { value: "1y", label: "1 año" },
]

export const CHART_METRICS: { value: ChartMetric; label: string; color: string }[] = [
  { value: "total_sales", label: "Ventas", color: "#059669" },
  { value: "order_count", label: "Pedidos", color: "#2563eb" },
  { value: "total_revenue", label: "Ingresos", color: "#7c3aed" },
  { value: "total_profit", label: "Ganancias", color: "#0891b2" },
]
