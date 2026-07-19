"use client"

import Link from "next/link"
import { useRecentOrders } from "@/lib/dashboard/hooks"
import { formatCurrency, formatRelativeTime, getStatusColor, getInitials } from "@/lib/dashboard/utils"

export default function RecentOrders() {
  const { data: orders, isLoading } = useRecentOrders(8)

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="h-4 w-28 rounded bg-gray-200 shimmer-bg mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-24 rounded bg-gray-200 shimmer-bg" />
                <div className="h-2.5 w-16 rounded bg-gray-200 shimmer-bg" />
              </div>
              <div className="h-6 w-20 rounded-full bg-gray-200 shimmer-bg" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Últimos pedidos
        </h3>
        <p className="mt-2 text-sm text-gray-400">No hay pedidos recientes</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Últimos pedidos
        </h3>
        <Link
          href="/admin/orders"
          className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          Ver todos
        </Link>
      </div>
      <div className="overflow-x-auto -mx-5">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-5 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Pedido
              </th>
              <th className="px-5 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Cliente
              </th>
              <th className="px-5 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400 hidden sm:table-cell">
                Fecha
              </th>
              <th className="px-5 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Total
              </th>
              <th className="px-5 py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-gray-400 hidden md:table-cell">
                Estado
              </th>
              <th className="px-5 py-2 text-right" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {orders.map((order) => (
              <tr key={order.order_id} className="group transition-colors hover:bg-gray-50">
                <td className="px-5 py-2.5">
                  <span className="text-sm font-medium text-gray-900 tabular-nums">
                    {order.order_number}
                  </span>
                </td>
                <td className="px-5 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-[10px] font-medium text-gray-500">
                      {getInitials(order.customer_name)}
                    </div>
                    <span className="text-sm text-gray-700 truncate max-w-[120px]">
                      {order.customer_name}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-2.5 text-xs text-gray-500 hidden sm:table-cell">
                  {formatRelativeTime(order.created_at)}
                </td>
                <td className="px-5 py-2.5 text-right text-sm font-semibold text-gray-900 tabular-nums">
                  {formatCurrency(order.total)}
                </td>
                <td className="px-5 py-2.5 text-center hidden md:table-cell">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${getStatusColor(order.status)}`}
                  >
                    {order.status_name}
                  </span>
                </td>
                <td className="px-5 py-2.5 text-right">
                  <Link
                    href={`/admin/orders/${order.order_id}`}
                    className="text-xs font-medium text-gray-400 opacity-0 transition-all group-hover:opacity-100 hover:text-gray-900"
                  >
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
