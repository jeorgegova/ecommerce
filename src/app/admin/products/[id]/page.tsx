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
  const [adjustQty, setAdjustQty] = useState("")
  const [adjustNote, setAdjustNote] = useState("")
  const [adjusting, setAdjusting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const { data: prod } = await supabase.from("products").select("*").eq("id", id).single()
      if (!prod) { router.push("/admin/products"); return }
      setProduct(prod)

      const { data: mov } = await supabase
        .from("inventory_movements")
        .select("*, profiles(full_name)")
        .eq("product_id", id)
        .order("created_at", { ascending: false })
        .limit(50)

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

  const handleAdjust = async () => {
    const qty = parseInt(adjustQty)
    if (isNaN(qty) || qty === 0) return
    setAdjusting(true)

    const { error } = await supabase.rpc("record_movement", {
      p_product_id: id,
      p_user_id: (await supabase.auth.getUser()).data.user?.id,
      p_movement_type: "adjustment",
      p_quantity: qty,
      p_notes: adjustNote || "Ajuste manual",
    })

    if (error) {
      alert(error.message)
    } else {
      setAdjustQty("")
      setAdjustNote("")
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
        <p className="mt-1 text-sm text-gray-600">
          Stock actual: <span className="font-semibold text-gray-900">{String(product?.stock || 0)}</span>
        </p>

        <div className="mt-4 flex items-end gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700">Ajustar stock</label>
            <input type="number" value={adjustQty} onChange={(e) => setAdjustQty(e.target.value)}
              placeholder="Ej: +5 o -3" className="mt-1 block w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">Motivo</label>
            <input type="text" value={adjustNote} onChange={(e) => setAdjustNote(e.target.value)}
              placeholder="Razón del ajuste" className="mt-1 block w-60 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900" />
          </div>
          <button onClick={handleAdjust} disabled={adjusting || !adjustQty}
            className="rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50">
            {adjusting ? "Ajustando..." : "Aplicar"}
          </button>
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
