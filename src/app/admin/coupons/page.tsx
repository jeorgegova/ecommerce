"use client"

import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { toggleCouponActive, deleteCoupon } from "@/lib/actions/coupons"

interface Coupon {
  id: string
  code: string
  type: "percentage" | "fixed"
  value: number
  min_order_amount: number | null
  max_uses: number | null
  max_uses_per_user: number | null
  is_active: boolean
  starts_at: string | null
  ends_at: string | null
  created_at: string
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const supabase = createClient()

  const fetchCoupons = useCallback(async () => {
    const { data } = await supabase.from("coupons").select("*").order("created_at", { ascending: false })
    if (data) setCoupons(data as Coupon[])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchCoupons() }, [fetchCoupons])

  const handleToggle = async (id: string, current: boolean) => {
    await toggleCouponActive(id, !current)
    fetchCoupons()
  }
  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este cupón?")) return
    await deleteCoupon(id)
    fetchCoupons()
  }

  const filtered = coupons.filter((c) => c.code.toLowerCase().includes(search.toLowerCase()))

  if (loading) return <div className="mx-auto max-w-4xl animate-pulse space-y-4"><div className="h-8 w-32 rounded bg-gray-200" /><div className="h-64 rounded-xl border border-gray-200 bg-white" /></div>

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Gestión</h2>
          <p className="mt-1 text-2xl font-bold text-gray-900">Cupones</p>
          <p className="mt-1 text-sm text-gray-500">{filtered.length} cupones · Parametriza descuentos por código</p>
        </div>
        <Link href="/admin/coupons/new" className="inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Nuevo cupón
        </Link>
      </div>

      <div className="mb-4">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por código..." className="w-full max-w-sm rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900" />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 6v.75m0 3v.75m0 3v.75m0 3V18m-2.25-9h5.25M3 12l3-3m0 0l3 3m-3-3v12" /></svg>
          </div>
          <h3 className="mt-4 text-sm font-semibold text-gray-900">No hay cupones</h3>
          <p className="mt-1 text-sm text-gray-500">Crea tu primer cupón de descuento</p>
        </div>
      ) : (
        <>
          {/* desktop table */}
          <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white md:block">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50"><tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Código</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Tipo</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Valor</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Mín. pedido</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase text-gray-500">Usos</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase text-gray-500">Vigencia</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase text-gray-500">Estado</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Acciones</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-sm font-semibold text-gray-900">{c.code}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{c.type === "percentage" ? "Porcentaje" : "Fijo"}</td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">{c.type === "percentage" ? `${Number(c.value)}%` : `€${Number(c.value).toLocaleString("es-CO")}`}</td>
                    <td className="px-4 py-3 text-right text-sm text-gray-500">{c.min_order_amount ? `€${Number(c.min_order_amount).toLocaleString("es-CO")}` : "—"}</td>
                    <td className="px-4 py-3 text-center text-xs text-gray-500">{c.max_uses ?? "∞"} / {c.max_uses_per_user ?? "∞"} p/usuario</td>
                    <td className="px-4 py-3 text-center text-xs text-gray-500">
                      {c.starts_at ? new Date(c.starts_at).toLocaleDateString("es-CO") : "—"} → {c.ends_at ? new Date(c.ends_at).toLocaleDateString("es-CO") : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.is_active ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>{c.is_active ? "Activo" : "Inactivo"}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleToggle(c.id, c.is_active)} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${c.is_active ? "bg-gray-100 text-gray-600 hover:bg-gray-200" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"}`}>{c.is_active ? "Desactivar" : "Activar"}</button>
                        <Link href={`/admin/coupons/${c.id}`} className="rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100">Editar</Link>
                        <button onClick={() => handleDelete(c.id)} className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* mobile cards */}
          <div className="grid gap-3 md:hidden">
            {filtered.map((c) => (
              <div key={c.id} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-gray-900">{c.code}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.is_active ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>{c.is_active ? "Activo" : "Inactivo"}</span>
                </div>
                <p className="mt-1 text-sm text-gray-600">{c.type === "percentage" ? `${c.value}% descuento` : `€${Number(c.value).toLocaleString("es-CO")} descuento`} {c.min_order_amount ? `· mín €${Number(c.min_order_amount).toLocaleString("es-CO")}` : ""}</p>
                <div className="mt-3 flex gap-2">
                  <Link href={`/admin/coupons/${c.id}`} className="flex-1 rounded-lg bg-gray-900 py-2 text-center text-xs font-medium text-white">Editar</Link>
                  <button onClick={() => handleToggle(c.id, c.is_active)} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600">{c.is_active ? "Desactivar" : "Activar"}</button>
                  <button onClick={() => handleDelete(c.id)} className="rounded-lg px-3 py-2 text-xs font-medium text-red-600">Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
