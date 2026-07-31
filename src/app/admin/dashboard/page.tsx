"use client"

import dynamic from "next/dynamic"
import { DashboardDateProvider, DashboardDateFilter } from "@/lib/dashboard/date-context"

const DashboardHero = dynamic(() => import("@/components/dashboard/DashboardHero"), { ssr: false })
const QuickActions = dynamic(() => import("@/components/dashboard/QuickActions"), { ssr: false })
const RevenueChart = dynamic(() => import("@/components/dashboard/RevenueChart"), { ssr: false })
const SummaryCards = dynamic(() => import("@/components/dashboard/SummaryCards"), { ssr: false })
const ActivityFeed = dynamic(() => import("@/components/dashboard/ActivityFeed"), { ssr: false })
const TopProducts = dynamic(() => import("@/components/dashboard/TopProducts"), { ssr: false })
const LowStockProducts = dynamic(() => import("@/components/dashboard/LowStockProducts"), { ssr: false })
const RecentOrders = dynamic(() => import("@/components/dashboard/RecentOrders"), { ssr: false })

export default function AdminDashboardPage() {
  return (
    <DashboardDateProvider>
      <div className="mx-auto max-w-[1400px] space-y-5 overflow-hidden pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-end">
          <DashboardDateFilter />
        </div>

        <DashboardHero />

        <QuickActions />

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2 min-w-0">
            <RevenueChart />
          </div>
          <div className="space-y-5 min-w-0">
            <SummaryCards />
            <LowStockProducts />
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2 min-w-0">
            <RecentOrders />
          </div>
          <div className="space-y-5 min-w-0">
            <TopProducts />
            <ActivityFeed />
          </div>
        </div>
      </div>
    </DashboardDateProvider>
  )
}
