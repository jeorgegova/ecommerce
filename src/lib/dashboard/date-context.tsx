"use client"

import { createContext, useContext, useState } from "react"

interface DashboardDateContextType {
  fromDate: string
  toDate: string
  setDateRange: (from: string, to: string) => void
  setMonth: (month: number, year: number) => void
  daysDiff: number
}

const DashboardDateContext = createContext<DashboardDateContextType>({
  fromDate: "",
  toDate: "",
  setDateRange: () => {},
  setMonth: () => {},
  daysDiff: 30,
})

export function useDashboardDate() {
  return useContext(DashboardDateContext)
}

function fmt(d: Date) {
  return d.toISOString().slice(0, 10)
}

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

export function DashboardDateProvider({ children }: { children: React.ReactNode }) {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [fromDate, setFromDate] = useState(fmt(monthStart))
  const [toDate, setToDate] = useState(fmt(now))

  const daysDiff = Math.max(1, Math.round((new Date(toDate).getTime() - new Date(fromDate).getTime()) / 86400000) + 1)

  const setDateRange = (from: string, to: string) => {
    setFromDate(from)
    setToDate(to)
  }

  const setMonth = (month: number, year: number) => {
    const d = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    setFromDate(fmt(d))
    setToDate(fmt(lastDay))
  }

  return (
    <DashboardDateContext.Provider value={{ fromDate, toDate, setDateRange, setMonth, daysDiff }}>
      {children}
    </DashboardDateContext.Provider>
  )
}

export function DashboardDateFilter() {
  const { fromDate, toDate, setDateRange, setMonth } = useDashboardDate()
  const now = new Date()

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2 shadow-sm ring-1 ring-gray-200">
        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
        <input type="date" value={fromDate} onChange={(e) => setDateRange(e.target.value, toDate)} max={toDate} className="w-[130px] border-0 bg-transparent p-0 text-[13px] font-medium text-gray-700 focus:outline-none focus:ring-0" />
        <span className="text-[13px] text-gray-400">—</span>
        <input type="date" value={toDate} onChange={(e) => setDateRange(fromDate, e.target.value)} min={fromDate} max={fmt(now)} className="w-[130px] border-0 bg-transparent p-0 text-[13px] font-medium text-gray-700 focus:outline-none focus:ring-0" />
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-gray-200">
        {MONTHS.map((name, i) => {
          const firstDay = new Date(now.getFullYear(), i, 1)
          const isSelected = fromDate === fmt(firstDay)
          return (
            <button
              key={name}
              onClick={() => setMonth(i, now.getFullYear())}
              className={`flex-shrink-0 rounded-xl px-3 py-2 text-[12px] font-medium transition-all ${
                isSelected
                  ? "bg-gray-900 text-white shadow-sm"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              {name.slice(0, 3)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
