"use client"

import { useDashboardDate } from "@/lib/dashboard/date-context"
import { useKPIs, useLowStock } from "@/lib/dashboard/hooks"
import Link from "next/link"

export default function DashboardHero() {
  const { fromDate, toDate } = useDashboardDate()
  const { data: kpis } = useKPIs()
  const { data: lowStock } = useLowStock()

  const ventasHoy = kpis?.find((k) => k.metric === "ventas_hoy")
  const pedidosNuevos = kpis?.find((k) => k.metric === "pedidos_nuevos")
  const pedidosPendientes = kpis?.find((k) => k.metric === "pedidos_pendientes")
  const clientes = kpis?.find((k) => k.metric === "clientes_nuevos")
  const ganancias = kpis?.find((k) => k.metric === "ganancias")
  const productosVendidos = kpis?.find((k) => k.metric === "productos_vendidos")

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-8">
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-[14px] text-gray-500">
            {ventasHoy && ventasHoy.value > 0
              ? `Tu tienda está teniendo un buen rendimiento.`
              : "Bienvenido. Aquí puedes gestionar tu tienda."}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            <MiniStat
              label="Ventas"
              value={`€${Number(ventasHoy?.value || 0).toLocaleString("es-CO")}`}
              growth={ventasHoy?.growthPercent}
              icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
            <MiniStat
              label="Pedidos"
              value={`${pedidosNuevos?.value || 0}`}
              growth={pedidosNuevos?.growthPercent}
              icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>}
            />
            <MiniStat
              label="Clientes"
              value={`${clientes?.value || 0}`}
              growth={clientes?.growthPercent}
              icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>}
            />
            <MiniStat
              label="Ganancias"
              value={`€${Number(ganancias?.value || 0).toLocaleString("es-CO")}`}
              growth={ganancias?.growthPercent}
              icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>}
            />
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4">
        {pedidosPendientes && pedidosPendientes.value > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-[12px] font-medium text-amber-700">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            {pedidosPendientes.value} pedidos pendientes
          </span>
        )}
        {productosVendidos && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-[12px] font-medium text-blue-700">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
            {productosVendidos.value} productos vendidos
          </span>
        )}
        {lowStock && lowStock.length > 0 && (
          <Link href="/admin/inventory" className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-[12px] font-medium text-red-700 hover:bg-red-100 transition-colors">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
            {lowStock.length} con stock bajo
          </Link>
        )}
        <Link href="/admin/questions" className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1 text-[12px] font-medium text-gray-600 hover:bg-gray-100 transition-colors">
          <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
          Preguntas
        </Link>
      </div>
    </div>
  )
}

function MiniStat({ label, value, growth, icon }: { label: string; value: string; growth?: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-3 sm:p-4">
      <div className="flex items-center gap-1.5 text-gray-400">{icon}<span className="text-[10px] font-medium uppercase tracking-wider text-gray-400 sm:text-[11px]">{label}</span></div>
      <p className="mt-1.5 text-[18px] font-bold text-gray-900 sm:mt-2 sm:text-[20px]">{value}</p>
      {growth !== undefined && growth !== 0 && (
        <p className={`mt-1 text-[12px] font-medium ${growth > 0 ? "text-emerald-600" : "text-red-500"}`}>
          {growth > 0 ? "↑" : "↓"} {Math.abs(growth)}%
        </p>
      )}
    </div>
  )
}
