"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"

export default function AdminImportPage() {
  const [imports, setImports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("imports").select("*, profiles(full_name)").order("created_at", { ascending: false }).limit(20)
      setImports(data || []); setLoading(false)
    }
    fetch()
  }, [supabase])

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)

    const { data: { user } } = await supabase.auth.getUser()

    const { data: importRecord, error: importError } = await supabase
      .from("imports")
      .insert({ user_id: user!.id, file_name: file.name, file_type: file.name.endsWith(".csv") ? "csv" : "xlsx", status: "processing", total_rows: 0 })
      .select()
      .single()

    if (importError) { alert(importError.message); setUploading(false); return }

    const text = await file.text()
    const rows = text.split("\n").filter(Boolean)
    const headers = rows[0].split(",").map((h) => h.trim())
    let success = 0, errors = 0

    for (let i = 1; i < rows.length; i++) {
      try {
        const values = rows[i].split(",").map((v) => v.trim())
        const row: Record<string, string> = {}
        headers.forEach((h, idx) => { row[h] = values[idx] || "" })

        const { error } = await supabase.from("products").upsert({
          name: row.name,
          slug: row.slug || row.name.toLowerCase().replace(/\s+/g, "-"),
          sku: row.sku,
          base_price: parseFloat(row.base_price) || 0,
          stock: parseInt(row.stock) || 0,
          category_id: row.category_id || null,
          status: "draft",
        })

        if (error) {
          await supabase.from("import_errors").insert({ import_id: importRecord.id, row_number: i + 1, error_message: error.message, raw_data: row })
          errors++
        } else {
          success++
        }
      } catch (err: any) {
        await supabase.from("import_errors").insert({ import_id: importRecord.id, row_number: i + 1, error_message: err.message })
        errors++
      }
    }

    await supabase.from("imports").update({ status: "completed", total_rows: rows.length - 1, success_count: success, error_count: errors }).eq("id", importRecord.id)
    setUploading(false)
    const { data } = await supabase.from("imports").select("*, profiles(full_name)").order("created_at", { ascending: false }).limit(20)
    setImports(data || [])
  }

  if (loading) return <p className="text-gray-600">Cargando...</p>

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Importación Masiva</h1>
      <p className="mt-1 text-sm text-gray-600">Sube archivos CSV para crear/actualizar productos</p>

      <div className="mt-6">
        <label className="flex cursor-pointer items-center gap-4 rounded-xl border-2 border-dashed border-gray-300 p-8 hover:border-gray-400">
          <input type="file" accept=".csv,.xlsx" onChange={handleFile} disabled={uploading} className="hidden" />
          <div className="text-center w-full">
            <p className="text-sm font-medium text-gray-900">{uploading ? "Procesando..." : "Seleccionar archivo CSV"}</p>
            <p className="mt-1 text-xs text-gray-500">Formato: name, sku, base_price, stock, slug, category_id</p>
          </div>
        </label>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Historial de Importaciones</h2>
        <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Archivo</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Filas</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Éxitos</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Errores</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500">Estado</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Usuario</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {imports.map((imp: any) => (
                <tr key={imp.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900">{imp.file_name}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{imp.total_rows}</td>
                  <td className="px-4 py-3 text-right text-green-600">{imp.success_count}</td>
                  <td className="px-4 py-3 text-right text-red-600">{imp.error_count}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${imp.status === "completed" ? "bg-green-50 text-green-700" : imp.status === "failed" ? "bg-red-50 text-red-700" : "bg-yellow-50 text-yellow-700"}`}>{imp.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{imp.profiles?.full_name || "—"}</td>
                  <td className="px-4 py-3 text-right text-gray-500">{new Date(imp.created_at).toLocaleDateString("es-CO")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
