"use client"

import KPICard, { KPICardSkeleton } from "./KPICard"
import { useKPIs } from "@/lib/dashboard/hooks"

export default function KPIGrid() {
  const { data: kpis, isLoading } = useKPIs(30)

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <KPICardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (!kpis || kpis.length === 0) return null

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {kpis.map((kpi) => (
        <div key={kpi.metric} className="animate-fade-in">
          <KPICard kpi={kpi} />
        </div>
      ))}
    </div>
  )
}
