"use client"

import { useState } from "react"
import {
  exportSalesPDF,
  exportSalesExcel,
  exportOrdersExcel,
  exportInventoryExcel,
  exportMonthlyReport,
} from "@/lib/dashboard/exports"

interface ReportAction {
  label: string
  icon: React.ReactNode
  color: string
  action: () => Promise<void>
}

export default function QuickReports() {
  const [loading, setLoading] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; error?: boolean } | null>(null)

  const showToast = (message: string, error?: boolean) => {
    setToast({ message, error })
    setTimeout(() => setToast(null), 3000)
  }

  const handleClick = async (label: string, action: () => Promise<void>) => {
    setLoading(label)
    try {
      await action()
      showToast(`✅ "${label}" descargado correctamente`)
    } catch {
      showToast(`❌ Error al generar "${label}"`, true)
    } finally {
      setLoading(null)
    }
  }

  const reports: ReportAction[] = [
    {
      label: "Ventas PDF",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      ),
      color: "text-red-600 bg-red-50 hover:bg-red-100",
      action: exportSalesPDF,
    },
    {
      label: "Ventas Excel",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
        </svg>
      ),
      color: "text-emerald-600 bg-emerald-50 hover:bg-emerald-100",
      action: exportSalesExcel,
    },
    {
      label: "Pedidos Excel",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
        </svg>
      ),
      color: "text-blue-600 bg-blue-50 hover:bg-blue-100",
      action: exportOrdersExcel,
    },
    {
      label: "Inventario Excel",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      ),
      color: "text-purple-600 bg-purple-50 hover:bg-purple-100",
      action: exportInventoryExcel,
    },
    {
      label: "Reporte mensual",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
      ),
      color: "text-gray-600 bg-gray-100 hover:bg-gray-200",
      action: exportMonthlyReport,
    },
  ]

  return (
    <>
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Reportes rápidos
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {reports.map((report) => (
            <button
              key={report.label}
              onClick={() => handleClick(report.label, report.action)}
              disabled={loading !== null}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${report.color}`}
            >
              {loading === report.label ? (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <span className="shrink-0">{report.icon}</span>
              )}
              <span>{loading === report.label ? "Generando..." : report.label}</span>
            </button>
          ))}
        </div>
      </div>

      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 animate-slide-up rounded-xl border px-4 py-3 text-sm font-medium shadow-xl ${
            toast.error
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-gray-200 bg-gray-900 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}
    </>
  )
}
