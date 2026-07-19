import { useQuery } from "@tanstack/react-query"
import {
  fetchKPIs,
  fetchChartData,
  fetchQuickSummary,
  fetchTopProducts,
  fetchLowStock,
  fetchRecentOrders,
  fetchTopCustomers,
  fetchRecentActivity,
  fetchNotifications,
  fetchBusinessMetrics,
} from "./services"
import type { ChartPeriod } from "./types"

export function useKPIs(period: number = 30) {
  return useQuery({
    queryKey: ["dashboard", "kpis", period],
    queryFn: () => fetchKPIs(period),
    staleTime: 60_000,
  })
}

export function useChartData(period: ChartPeriod = "30d") {
  return useQuery({
    queryKey: ["dashboard", "chart", period],
    queryFn: () => fetchChartData(period),
    staleTime: 60_000,
  })
}

export function useQuickSummary() {
  return useQuery({
    queryKey: ["dashboard", "quickSummary"],
    queryFn: fetchQuickSummary,
    staleTime: 60_000,
  })
}

export function useTopProducts(days: number = 30, limit: number = 10) {
  return useQuery({
    queryKey: ["dashboard", "topProducts", days, limit],
    queryFn: () => fetchTopProducts(days, limit),
    staleTime: 60_000,
  })
}

export function useLowStock() {
  return useQuery({
    queryKey: ["dashboard", "lowStock"],
    queryFn: fetchLowStock,
    staleTime: 30_000,
  })
}

export function useRecentOrders(limit: number = 8) {
  return useQuery({
    queryKey: ["dashboard", "recentOrders", limit],
    queryFn: () => fetchRecentOrders(limit),
    staleTime: 30_000,
  })
}

export function useTopCustomers(limit: number = 5) {
  return useQuery({
    queryKey: ["dashboard", "topCustomers", limit],
    queryFn: () => fetchTopCustomers(limit),
    staleTime: 60_000,
  })
}

export function useRecentActivity(limit: number = 15) {
  return useQuery({
    queryKey: ["dashboard", "recentActivity", limit],
    queryFn: () => fetchRecentActivity(limit),
    staleTime: 30_000,
  })
}

export function useNotifications() {
  return useQuery({
    queryKey: ["dashboard", "notifications"],
    queryFn: fetchNotifications,
    staleTime: 30_000,
  })
}

export function useBusinessMetrics() {
  return useQuery({
    queryKey: ["dashboard", "businessMetrics"],
    queryFn: fetchBusinessMetrics,
    staleTime: 60_000,
  })
}
