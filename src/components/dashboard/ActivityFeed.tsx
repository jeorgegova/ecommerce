"use client"

import { useRecentActivity } from "@/lib/dashboard/hooks"
import { formatRelativeTime } from "@/lib/dashboard/utils"

export default function ActivityFeed() {
  const { data: activities, isLoading } = useRecentActivity(8)

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="h-5 w-32 rounded bg-gray-200 shimmer-bg mb-4" />
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-10 rounded-lg bg-gray-100 shimmer-bg" />)}</div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="text-[15px] font-semibold text-gray-900">Actividad reciente</h3>
      {!activities || activities.length === 0 ? (
        <p className="mt-3 text-[13px] text-gray-400">Sin actividad reciente</p>
      ) : (
        <div className="mt-4 space-y-1">
          {activities.map((a, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-gray-50">
              <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-[11px] font-semibold text-gray-500">
                {a.activity_type === "order" ? "📦" : a.activity_type === "review" ? "⭐" : a.activity_type === "question" ? "💬" : a.activity_type === "product" ? "🏷" : a.activity_type === "register" ? "👤" : "•"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-gray-700 leading-relaxed">{a.description}</p>
                <p className="mt-0.5 text-[11px] text-gray-400">{formatRelativeTime(a.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
