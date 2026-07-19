"use client"

import { useTopCustomers } from "@/lib/dashboard/hooks"
import { formatCompactCurrency, formatNumber, formatRelativeTime, getInitials } from "@/lib/dashboard/utils"

export default function TopCustomers() {
  const { data: customers, isLoading } = useTopCustomers(5)

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="h-4 w-28 rounded bg-gray-200 shimmer-bg mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-gray-200 shimmer-bg" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-24 rounded bg-gray-200 shimmer-bg" />
                <div className="h-2.5 w-16 rounded bg-gray-200 shimmer-bg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!customers || customers.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Clientes destacados
        </h3>
        <p className="text-sm text-gray-400">Sin datos de clientes</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
        Clientes destacados
      </h3>
      <div className="space-y-2.5">
        {customers.map((customer, index) => (
          <div
            key={customer.user_id}
            className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-900 text-xs font-semibold text-white">
              {customer.avatar_url ? (
                <img
                  src={customer.avatar_url}
                  alt={customer.full_name}
                  className="h-full w-full object-cover"
                />
              ) : (
                getInitials(customer.full_name)
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {customer.full_name}
              </p>
              <p className="text-xs text-gray-500">
                {formatNumber(customer.total_orders)} compras · {formatCompactCurrency(customer.total_spent)}
              </p>
            </div>
            <div className="hidden text-right sm:block">
              <p className="text-[11px] text-gray-400">Última compra</p>
              <p className="text-xs font-medium text-gray-600">
                {formatRelativeTime(customer.last_order_date)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
