"use client"

import Link from "next/link"
import { useNotifications } from "@/lib/dashboard/hooks"

const severityConfig: Record<string, { bg: string; dot: string; icon: React.ReactNode }> = {
  critical: {
    bg: "bg-red-50 border-red-200",
    dot: "bg-red-500",
    icon: (
      <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
  },
  warning: {
    bg: "bg-amber-50 border-amber-200",
    dot: "bg-amber-500",
    icon: (
      <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
    ),
  },
  info: {
    bg: "bg-blue-50 border-blue-200",
    dot: "bg-blue-500",
    icon: (
      <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
      </svg>
    ),
  },
}

export default function SmartNotifications() {
  const { data: notifications, isLoading } = useNotifications()

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="h-4 w-36 rounded bg-gray-200 shimmer-bg mb-4" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-gray-100 shimmer-bg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Notificaciones
        </h3>
        {notifications && notifications.length > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {notifications.length}
          </span>
        )}
      </div>
      {!notifications || notifications.length === 0 ? (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3">
          <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm font-medium text-emerald-700">Todo está en orden</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {notifications.map((notification) => {
            const config = severityConfig[notification.severity] || severityConfig.info
            return (
              <Link
                key={notification.notification_id}
                href={notification.action_url}
                className={`flex items-start gap-2.5 rounded-lg border p-3 transition-all hover:shadow-sm ${config.bg}`}
              >
                <span className="mt-0.5 shrink-0">{config.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-900">{notification.message}</p>
                  <p className="mt-0.5 text-[11px] font-medium text-gray-500">
                    {notification.action_label} →
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
