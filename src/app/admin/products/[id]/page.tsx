"use client"

import ProductForm from "@/components/admin/ProductForm"
import { createClient } from "@/lib/supabase/client"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface Movement {
  id: string; movement_type: string; quantity: number; stock_before: number
  stock_after: number; reference_type: string | null; reference_id: string | null
  notes: string | null; created_at: string; profiles: { full_name: string } | null
}

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<Record<string, unknown> | null>(null)
  const [movements, setMovements] = useState<Movement[]>([])
  const [loading, setLoading] = useState(true)
  const [adjustQty, setAdjustQty] = useState(0)
  const [adjustNote, setAdjustNote] = useState("")

  // Umbrales de stock — ajustá estos valores según tu negocio
  const [adjusting, setAdjusting] = useState(false)
  const [adjustError, setAdjustError] = useState("")
  const [adjustSuccess, setAdjustSuccess] = useState(false)
  const [adjustDirection, setAdjustDirection] = useState<"add" | "remove">("add")
  const router = useRouter()
  const supabase = createClient()

  // Umbrales por producto — vienen del producto, no de settings globales
  const lowStockThreshold = Number(product?.low_stock_threshold ?? 5)
  const stockBarMax = Number(product?.stock_bar_max ?? 20)

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: prod }, { data: mov }] = await Promise.all([
        supabase.from("products").select("*").eq("id", id).single(),
        supabase.from("inventory_movements").select("*, profiles(full_name)").eq("product_id", id).order("created_at", { ascending: false }).limit(50),
      ])
      if (!prod) { router.push("/admin/products"); return }
      setProduct(prod)
      setMovements(mov || [])
      setLoading(false)
    }
    fetchData()
  }, [supabase, id, router])

  const handleDelete = async () => {
    if (!confirm("¿Eliminar este producto?")) return
    const { error } = await supabase.from("products").delete().eq("id", id)
    if (error) alert(error.message)
    else router.push("/admin/products")
  }

  const handleQuickAdjust = async (qty: number) => {
    if (qty === 0) return
    if (!adjustNote.trim()) {
      setAdjustError("El motivo del ajuste es obligatorio")
      return
    }
    setAdjusting(true)
    setAdjustError("")
    setAdjustSuccess(false)

    const { error } = await supabase.rpc("record_movement", {
      p_product_id: id,
      p_user_id: (await supabase.auth.getUser()).data.user?.id,
      p_movement_type: "adjustment",
      p_quantity: qty,
      p_notes: adjustNote,
    })

    if (error) {
      setAdjustError(error.message)
    } else {
      setAdjustSuccess(true)
      setTimeout(() => setAdjustSuccess(false), 2000)
      const { data: prod } = await supabase.from("products").select("*").eq("id", id).single()
      if (prod) setProduct(prod)
      const { data: mov } = await supabase.from("inventory_movements").select("*, profiles(full_name)").eq("product_id", id).order("created_at", { ascending: false }).limit(50)
      if (mov) setMovements(mov)
    }
    setAdjusting(false)
  }

  const handleAdjust = async () => {
    const qty = adjustDirection === "add" ? adjustQty : -adjustQty
    if (isNaN(qty) || qty === 0) return
    if (!adjustNote.trim()) {
      setAdjustError("El motivo del ajuste es obligatorio")
      return
    }
    setAdjusting(true)
    setAdjustError("")
    setAdjustSuccess(false)

    const { error } = await supabase.rpc("record_movement", {
      p_product_id: id,
      p_user_id: (await supabase.auth.getUser()).data.user?.id,
      p_movement_type: "adjustment",
      p_quantity: qty,
      p_notes: adjustNote,
    })

    if (error) {
      setAdjustError(error.message)
    } else {
      setAdjustSuccess(true)
      setAdjustQty(0)
      setAdjustNote("")
      setTimeout(() => setAdjustSuccess(false), 2000)
      const { data: prod } = await supabase.from("products").select("*").eq("id", id).single()
      if (prod) setProduct(prod)
      const { data: mov } = await supabase.from("inventory_movements").select("*, profiles(full_name)").eq("product_id", id).order("created_at", { ascending: false }).limit(50)
      if (mov) setMovements(mov)
    }
    setAdjusting(false)
  }

  const typeColor: Record<string, string> = {
    sale: "bg-red-50 text-red-700",
    adjustment: "bg-blue-50 text-blue-700",
    return: "bg-green-50 text-green-700",
    import: "bg-purple-50 text-purple-700",
  }

  if (loading) return <p className="text-gray-600">Cargando...</p>

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Editar Producto</h1>
        <button
          onClick={handleDelete}
          className="inline-flex items-center gap-1.5 rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Eliminar
        </button>
      </div>
      <div className="mt-8">
        <ProductForm product={product as any} />
      </div>

      <div className="mt-12">
        <h2 className="text-lg font-semibold text-gray-900">Inventario</h2>

        <div className="mt-4 grid gap-6 lg:grid-cols-5">
          <div className="rounded-xl border border-gray-200 bg-white p-6 lg:col-span-2">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Stock actual</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className={`text-3xl font-bold ${Number(product?.stock || 0) <= 0 ? "text-red-600" : Number(product?.stock || 0) <= lowStockThreshold ? "text-amber-600" : "text-gray-900"}`}>
                {String(product?.stock || 0)}
              </span>
              <span className="text-sm text-gray-500">unidades</span>
            </div>

            <div className="mt-3">
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    Number(product?.stock || 0) <= 0 ? "bg-red-400" :
                    Number(product?.stock || 0) <= lowStockThreshold ? "bg-amber-400" :
                    "bg-green-500"
                  }`}
                  style={{ width: `${Math.min(100, (Number(product?.stock || 0) / stockBarMax) * 100)}%` }}
                />
              </div>
              <div className="mt-1.5 flex justify-between text-[10px] text-gray-400">
                <span>0</span>
                <span>{Math.round(stockBarMax / 2)}</span>
                <span>{stockBarMax}+</span>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-4 text-[11px] text-gray-400">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-red-400" />
                Agotado (0)
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                Stock bajo (≤{lowStockThreshold})
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                En stock
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 lg:col-span-3">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Ajustar inventario</p>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">
                Motivo del ajuste <span className="text-red-500">*</span>
              </label>
              <p className="mb-1.5 text-xs text-gray-400">
                Describí la razón de este cambio. Es obligatorio para la trazabilidad.
              </p>
              <input
                type="text"
                value={adjustNote}
                onChange={(e) => setAdjustNote(e.target.value)}
                placeholder="Ej: Compra a proveedor, Devolución, Conteo físico, Merma..."
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
            </div>

            <div className="mt-5">
              <p className="text-xs font-medium text-gray-700">Ajuste rápido</p>
              <p className="mb-2 text-xs text-gray-400">Sumá o restá cantidades comunes con un clic.</p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-medium text-green-600">SUMAR</span>
                {[1, 5, 10].map((n) => (
                  <button
                    key={`add-${n}`}
                    type="button"
                    onClick={() => handleQuickAdjust(n)}
                    disabled={adjusting || !adjustNote.trim()}
                    className="inline-flex items-center gap-1 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-50 transition-colors"
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    {n}
                  </button>
                ))}
                <span className="text-[11px] font-medium text-red-500 ml-3">RESTAR</span>
                {[1, 5, 10].map((n) => (
                  <button
                    key={`remove-${n}`}
                    type="button"
                    onClick={() => handleQuickAdjust(-n)}
                    disabled={adjusting || !adjustNote.trim()}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors"
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                    </svg>
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 border-t border-gray-100 pt-4">
              <p className="text-xs font-medium text-gray-700">Ajuste personalizado</p>
              <p className="mb-3 text-xs text-gray-400">Ingresá una cantidad exacta para sumar o restar.</p>

              <div className="flex items-center rounded-lg border border-gray-200 p-0.5">
                <button
                  type="button"
                  onClick={() => setAdjustDirection("add")}
                  className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                    adjustDirection === "add" ? "bg-green-100 text-green-700" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Sumar stock
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustDirection("remove")}
                  className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                    adjustDirection === "remove" ? "bg-red-100 text-red-700" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Restar stock
                </button>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500">
                    {adjustDirection === "add" ? "Cantidad a sumar" : "Cantidad a restar"}
                  </label>
                  <div className="mt-1 flex items-center rounded-lg border border-gray-300 focus-within:border-gray-900 focus-within:ring-1 focus-within:ring-gray-900">
                    <input
                      type="number"
                      value={adjustQty || ""}
                      onChange={(e) => setAdjustQty(Number(e.target.value))}
                      min={1}
                      className="flex-1 border-0 bg-transparent px-3 py-2 text-sm focus:outline-none"
                      placeholder="0"
                    />
                    {adjustQty > 0 && (
                      <span className={`pr-3 text-sm font-medium ${adjustDirection === "add" ? "text-green-600" : "text-red-600"}`}>
                        {adjustDirection === "add" ? "+" : "−"}{adjustQty}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAdjust}
                  disabled={adjusting || adjustQty <= 0 || !adjustNote.trim()}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50 transition-colors ${
                    adjustDirection === "add" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {adjusting ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Ajustando...
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>
                      Aplicar ajuste
                    </>
                  )}
                </button>
              </div>

              {adjustQty > 0 && (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-xs">
                  <span className="text-gray-500">Stock resultante:</span>
                  <span className={`font-mono font-semibold ${Number(product?.stock || 0) + (adjustDirection === "add" ? adjustQty : -adjustQty) <= 0 ? "text-red-600" : "text-gray-900"}`}>
                    {Number(product?.stock || 0)} {adjustDirection === "add" ? "+" : "−"} {adjustQty} = {Number(product?.stock || 0) + (adjustDirection === "add" ? adjustQty : -adjustQty)}
                  </span>
                  <span className="text-gray-400">unidades</span>
                </div>
              )}
            </div>

            {adjustError && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
                {adjustError}
              </div>
            )}

            {adjustSuccess && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                Stock actualizado correctamente
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-sm font-semibold text-gray-900">Historial de Movimientos</h3>
        <div className="mt-3 overflow-hidden rounded-xl border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Tipo</th>
                <th className="px-4 py-2 text-right text-xs font-medium uppercase text-gray-500">Cantidad</th>
                <th className="px-4 py-2 text-right text-xs font-medium uppercase text-gray-500">Stock Anterior</th>
                <th className="px-4 py-2 text-right text-xs font-medium uppercase text-gray-500">Stock Nuevo</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Notas</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Usuario</th>
                <th className="px-4 py-2 text-right text-xs font-medium uppercase text-gray-500">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white text-sm">
              {movements.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${typeColor[m.movement_type] || "bg-gray-50 text-gray-700"}`}>
                      {m.movement_type}
                    </span>
                  </td>
                  <td className={`px-4 py-2 text-right font-medium ${m.quantity > 0 ? "text-green-600" : "text-red-600"}`}>
                    {m.quantity > 0 ? "+" : ""}{m.quantity}
                  </td>
                  <td className="px-4 py-2 text-right text-gray-600">{m.stock_before}</td>
                  <td className="px-4 py-2 text-right text-gray-600">{m.stock_after}</td>
                  <td className="px-4 py-2 text-gray-500 max-w-[200px] truncate">{m.notes || "—"}</td>
                  <td className="px-4 py-2 text-gray-500">{m.profiles?.full_name || "—"}</td>
                  <td className="whitespace-nowrap px-4 py-2 text-right text-gray-500">
                    {new Date(m.created_at).toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </td>
                </tr>
              ))}
              {movements.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Sin movimientos registrados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
