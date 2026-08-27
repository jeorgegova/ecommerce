"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { createCoupon, updateCoupon } from "@/lib/actions/coupons"

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
}

function toInputDate(iso: string | null) {
  if (!iso) return ""
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function CouponForm({ coupon }: { coupon?: Coupon }) {
  const router = useRouter()
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    setError("")
    const fd = new FormData(e.currentTarget)
    try {
      if (coupon) await updateCoupon(coupon.id, fd)
      else await createCoupon(fd)
      router.push("/admin/coupons")
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Error al guardar")
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-xl space-y-6">
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Datos del cupón</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700">Código *</label>
          <p className="mb-1 text-xs text-gray-400">Se guarda en mayúsculas. Ej: BIENVENIDO10, VERANO25</p>
          <input name="code" defaultValue={coupon?.code || ""} required pattern="[A-Za-z0-9_-]+"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm uppercase focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            placeholder="DESCUENTO10" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Tipo *</label>
            <select name="type" defaultValue={coupon?.type || "percentage"} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900">
              <option value="percentage">Porcentaje (%)</option>
              <option value="fixed">Monto fijo (€)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Valor *</label>
            <input name="value" type="number" step="0.01" min="0" defaultValue={coupon?.value || ""} required
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900" placeholder="10" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Monto mínimo de pedido (€)</label>
          <p className="mb-1 text-xs text-gray-400">Si se define, el subtotal debe alcanzar este valor para aplicar cupón.</p>
          <input name="min_order_amount" type="number" step="0.01" min="0" defaultValue={coupon?.min_order_amount ?? ""} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900" placeholder="Opcional" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Usos máximos totales</label>
            <input name="max_uses" type="number" min="1" step="1" defaultValue={coupon?.max_uses ?? ""} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900" placeholder="∞" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Usos máximos por usuario</label>
            <input name="max_uses_per_user" type="number" min="1" step="1" defaultValue={coupon?.max_uses_per_user ?? ""} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900" placeholder="∞" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Vigencia desde</label>
            <input name="starts_at" type="datetime-local" defaultValue={toInputDate(coupon?.starts_at || null)} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Vigencia hasta</label>
            <input name="ends_at" type="datetime-local" defaultValue={toInputDate(coupon?.ends_at || null)} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900" />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-gray-700">Activo</p>
            <p className="text-xs text-gray-500">Solo cupones activos pueden ser canjeados en checkout.</p>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input type="hidden" name="is_active" value="false" />
            <input name="is_active" type="checkbox" value="true" defaultChecked={coupon ? coupon.is_active : true} className="peer sr-only" />
            <div className="peer h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-gray-900 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-5" />
          </label>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button type="submit" disabled={saving} className="rounded-full bg-gray-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50">
          {saving ? "Guardando..." : coupon ? "Guardar cambios" : "Crear cupón"}
        </button>
        <button type="button" onClick={() => router.push("/admin/coupons")} className="text-sm font-medium text-gray-600 hover:text-gray-900">Cancelar</button>
      </div>
    </form>
  )
}
