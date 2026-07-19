"use client"

import dynamic from "next/dynamic"
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton"

const WelcomeBanner = dynamic(() => import("@/components/dashboard/WelcomeBanner"), {
  ssr: false,
  loading: () => (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shimmer-bg">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-gray-200" />
        <div className="space-y-1.5">
          <div className="h-5 w-40 rounded bg-gray-200" />
          <div className="h-3.5 w-52 rounded bg-gray-200" />
        </div>
      </div>
    </div>
  ),
})

const KPIGrid = dynamic(() => import("@/components/dashboard/KPIGrid"), {
  ssr: false,
})

const MainChart = dynamic(() => import("@/components/dashboard/MainChart"), {
  ssr: false,
})

const QuickSummary = dynamic(() => import("@/components/dashboard/QuickSummary"), {
  ssr: false,
})

const TopProductsTable = dynamic(() => import("@/components/dashboard/TopProductsTable"), {
  ssr: false,
})

const LowStockProducts = dynamic(() => import("@/components/dashboard/LowStockProducts"), {
  ssr: false,
})

const RecentOrders = dynamic(() => import("@/components/dashboard/RecentOrders"), {
  ssr: false,
})

const TopCustomers = dynamic(() => import("@/components/dashboard/TopCustomers"), {
  ssr: false,
})

const QuickActions = dynamic(() => import("@/components/dashboard/QuickActions"), {
  ssr: false,
})

const BusinessMetrics = dynamic(() => import("@/components/dashboard/BusinessMetrics"), {
  ssr: false,
})

const RecentActivity = dynamic(() => import("@/components/dashboard/RecentActivity"), {
  ssr: false,
})

const SmartNotifications = dynamic(() => import("@/components/dashboard/SmartNotifications"), {
  ssr: false,
})

const QuickReports = dynamic(() => import("@/components/dashboard/QuickReports"), {
  ssr: false,
})

const SmartShortcuts = dynamic(() => import("@/components/dashboard/SmartShortcuts"), {
  ssr: false,
})

export default function AdminDashboardPage() {
  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <WelcomeBanner />

      <KPIGrid />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MainChart />
        </div>
        <div className="space-y-6">
          <QuickSummary />
          <BusinessMetrics />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <TopProductsTable />
        <LowStockProducts />
      </div>

      <RecentOrders />

      <div className="grid gap-6 lg:grid-cols-3">
        <TopCustomers />
        <RecentActivity />
        <SmartNotifications />
      </div>

      <QuickActions />

      <div className="grid gap-6 lg:grid-cols-2">
        <QuickReports />
        <SmartShortcuts />
      </div>
    </div>
  )
}
