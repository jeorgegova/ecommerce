"use client"

import { useRecentActivity } from "@/lib/dashboard/hooks"
import { formatRelativeTime } from "@/lib/dashboard/utils"

const activityIcons: Record<string, React.ReactNode> = {
  order_created: (
    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100">
      <svg className="h-3.5 w-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
    </div>
  ),
  low_stock: (
    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100">
      <svg className="h-3.5 w-3.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    </div>
  ),
  new_user: (
    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100">
      <svg className="h-3.5 w-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
      </svg>
    </div>
  ),
  out_of_stock: (
    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-100">
      <svg className="h-3.5 w-3.5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    </div>
  ),
}

export default function RecentActivity() {
  const { data: activities, isLoading } = useRecentActivity(12)

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="h-4 w-32 rounded bg-gray-200 shimmer-bg mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-7 w-7 rounded-full bg-gray-200 shimmer-bg" />
              <div className="flex-1 space-y-1">
                <div className="h-3 w-40 rounded bg-gray-200 shimmer-bg" />
                <div className="h-2.5 w-16 rounded bg-gray-200 shimmer-bg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Actividad reciente
        </h3>
        <p className="text-sm text-gray-400">Sin actividad reciente</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
        Actividad reciente
      </h3>
      <div className="space-y-1">
        {activities.map((activity) => (
          <div
            key={activity.activity_id + activity.created_at}
            className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50"
          >
            {activityIcons[activity.activity_type] || (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100">
                <svg className="h-3.5 w-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-700">{activity.description}</p>
              <p className="mt-0.5 text-[11px] text-gray-400">
                {formatRelativeTime(activity.created_at)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
