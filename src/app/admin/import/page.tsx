"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState, useRef } from "react"

interface ImportError {
  row_number: number
  error_message: string
}

interface CsvPreview {
  headers: string[]
  rows: string[][]
  totalRows: number
}

export default function AdminImportPage() {
  const [imports, setImports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<CsvPreview | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0, success: 0, errors: 0 })
  const [result, setResult] = useState<{ success: number; errors: number; errorDetails: ImportError[] } | null>(null)
  const [step, setStep] = useState<"select" | "preview" | "processing" | "done">("select")
  const cancelRef = useRef(false)
  const supabase = createClient()

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("imports").select("*, profiles(full_name)").order("created_at", { ascending: false }).limit(20)
      setImports(data || []); setLoading(false)
    }
    fetch()
  }, [supabase])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setResult(null)

    const text = await f.text()
    const lines = text.split("\n").filter((l) => l.trim())
    if (lines.length < 2) {
      alert("El archivo debe tener al menos una fila de datos además de los encabezados.")
      return
    }

    const headers = lines[0].split(",").map((h) => h.trim())
    const previewRows = lines.slice(1, Math.min(lines.length, 6)).map((l) => parseCSVLine(l).map((v) => v.trim()))

    setPreview({ headers, rows: previewRows, totalRows: lines.length - 1 })
    setStep("preview")
  }

  const handleCancel = () => {
    cancelRef.current = true
  }

  const handleImport = async () => {
    if (!file || !preview) return
    setUploading(true)
    setStep("processing")
    setProgress({ current: 0, total: preview.totalRows, success: 0, errors: 0 })
    cancelRef.current = false

    const { data: { user } } = await supabase.auth.getUser()

    const { data: importRecord, error: importError } = await supabase
      .from("imports")
      .insert({ user_id: user!.id, file_name: file.name, file_type: "csv", status: "processing", total_rows: preview.totalRows })
      .select()
      .single()

    if (importError) { alert(importError.message); setUploading(false); setStep("preview"); return }

    const text = await file.text()
    const lines = text.split("\n").filter((l) => l.trim())
    const headers = lines[0].split(",").map((h) => h.trim())
    let success = 0, errors = 0
    const errorDetails: ImportError[] = []

    for (let i = 1; i < lines.length; i++) {
      if (cancelRef.current) {
        await supabase.from("imports").update({ status: "completed", total_rows: i - 1, success_count: success, error_count: errors }).eq("id", importRecord.id)
        setUploading(false)
        setResult({ success, errors, errorDetails })
        setStep("done")
        const { data } = await supabase.from("imports").select("*, profiles(full_name)").order("created_at", { ascending: false }).limit(20)
        setImports(data || [])
        return
      }

      const values = parseCSVLine(lines[i])
      const row: Record<string, string> = {}
      headers.forEach((h, idx) => { row[h] = values[idx]?.trim() || "" })

      const slug = row.slug || row.name?.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
      const basePrice = parseFloat(row.base_price)
      const stock = parseInt(row.stock) || 0

      if (!row.name) {
        errors++
        errorDetails.push({ row_number: i + 1, error_message: "Falta el nombre del producto" })
        setProgress((p) => ({ ...p, current: i, errors: p.errors + 1 }))
        continue
      }

      if (isNaN(basePrice) || basePrice < 0) {
        errors++
        errorDetails.push({ row_number: i + 1, error_message: `Precio inválido: "${row.base_price}"` })
        setProgress((p) => ({ ...p, current: i, errors: p.errors + 1 }))
        continue
      }

      const product: Record<string, unknown> = {
        name: row.name,
        slug,
        sku: row.sku || null,
        base_price: basePrice,
        stock,
        status: "draft",
      }

      if (row.category_id && row.category_id.length > 0) {
        product.category_id = row.category_id
      }

      const { error } = await supabase.from("products").insert(product)

      if (error) {
        errors++
        errorDetails.push({ row_number: i + 1, error_message: `Fila ${i + 1}: ${error.message}` })
        try {
          await supabase.from("import_errors").insert({ import_id: importRecord.id, row_number: i + 1, error_message: error.message, raw_data: row })
        } catch {}
      } else {
        success++
      }

      setProgress((p) => ({ ...p, current: i, success, errors }))
    }

    await supabase.from("imports").update({ status: "completed", total_rows: lines.length - 1, success_count: success, error_count: errors }).eq("id", importRecord.id)
    setUploading(false)
    setResult({ success, errors, errorDetails })
    setStep("done")
    const { data } = await supabase.from("imports").select("*, profiles(full_name)").order("created_at", { ascending: false }).limit(20)
    setImports(data || [])
  }

  const handleReset = () => {
    setFile(null)
    setPreview(null)
    setResult(null)
    setProgress({ current: 0, total: 0, success: 0, errors: 0 })
    setStep("select")
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-3">
        <svg className="animate-spin h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-sm text-gray-500">Cargando...</p>
      </div>
    </div>
  )

  const percent = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Importar Productos</h1>
        <p className="mt-1 text-sm text-gray-500">Sube un archivo CSV para crear productos en lote</p>
      </div>

      {step === "select" && (
        <label className="flex cursor-pointer flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-gray-300 p-12 hover:border-gray-400 hover:bg-gray-50/50 transition-all">
          <input type="file" accept=".csv" onChange={handleFileSelect} className="hidden" />
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
            <svg className="h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-900">Seleccionar archivo CSV</p>
            <p className="mt-1 text-xs text-gray-500">Formatos: name, sku, base_price, stock, slug, category_id</p>
          </div>
        </label>
      )}

      {step === "preview" && preview && (
        <div>
          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                  <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{file!.name}</p>
                  <p className="text-xs text-gray-500">{preview.totalRows.toLocaleString("es-CR")} productos · {(file!.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                {preview.totalRows} filas
              </span>
            </div>

            <div className="p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Vista previa (primeras 5 filas)</p>
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-3 py-2 text-left font-medium text-gray-500 border-r border-gray-100 w-10">#</th>
                      {preview.headers.map((h) => (
                        <th key={h} className="px-3 py-2 text-left font-semibold text-gray-700 border-r border-gray-100">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {preview.rows.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50/50">
                        <td className="px-3 py-2 text-gray-400 border-r border-gray-50">{i + 1}</td>
                        {row.map((cell, j) => (
                          <td key={j} className="px-3 py-2 text-gray-700 border-r border-gray-50 max-w-[150px] truncate">{cell || <span className="text-gray-300 italic">vacío</span>}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {preview.totalRows > 5 && (
                <p className="mt-2 text-xs text-gray-400">...y {preview.totalRows - 5} filas más</p>
              )}
            </div>

            <div className="border-t border-gray-100 px-5 py-4 flex items-center justify-between bg-gray-50/50">
              <button onClick={handleReset}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors">
                Cancelar
              </button>
              <button onClick={handleImport}
                className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition-colors shadow-sm">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                </svg>
                Importar {preview.totalRows} productos
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "processing" && (
        <div className="rounded-2xl border border-gray-200 bg-white p-8">
          <div className="flex flex-col items-center text-center">
            <svg className="animate-spin h-8 w-8 text-gray-700 mb-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900">Importando productos...</h3>
            <p className="mt-1 text-sm text-gray-500">
              {progress.current} de {progress.total} procesados
            </p>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
              <span>{percent}%</span>
              <span>{progress.current}/{progress.total}</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-gray-900 transition-all duration-300 ease-out"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-gray-50 px-4 py-3 text-center">
              <p className="text-2xl font-bold text-gray-900 tabular-nums">{progress.current}</p>
              <p className="text-xs text-gray-500">Procesados</p>
            </div>
            <div className="rounded-xl bg-green-50 px-4 py-3 text-center">
              <p className="text-2xl font-bold text-green-700 tabular-nums">{progress.success}</p>
              <p className="text-xs text-green-600">Exitosos</p>
            </div>
            <div className="rounded-xl bg-red-50 px-4 py-3 text-center">
              <p className="text-2xl font-bold text-red-700 tabular-nums">{progress.errors}</p>
              <p className="text-xs text-red-600">Errores</p>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <button onClick={handleCancel}
              className="rounded-xl border border-red-200 bg-white px-5 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
              Cancelar importación
            </button>
          </div>
        </div>
      )}

      {step === "done" && result && (
        <div>
          <div className={`rounded-2xl border p-6 ${result.errors > 0 ? "border-amber-200 bg-amber-50" : "border-green-200 bg-green-50"}`}>
            <div className="flex items-center gap-3 mb-4">
              {result.errors === 0 ? (
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </div>
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100">
                  <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                  </svg>
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Importación completada</h3>
                <p className="text-sm text-gray-600">{result.success} exitosos{result.errors > 0 && `, ${result.errors} con error`}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1 rounded-xl bg-white/60 px-4 py-3 text-center">
                <p className="text-xl font-bold text-green-700">{result.success}</p>
                <p className="text-xs text-green-600">Creados</p>
              </div>
              <div className="flex-1 rounded-xl bg-white/60 px-4 py-3 text-center">
                <p className="text-xl font-bold text-red-700">{result.errors}</p>
                <p className="text-xs text-red-600">Errores</p>
              </div>
              <div className="flex-1 rounded-xl bg-white/60 px-4 py-3 text-center">
                <p className="text-xl font-bold text-gray-700">{result.success + result.errors}</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
            </div>

            {result.errorDetails.length > 0 && (
              <details className="mt-4">
                <summary className="text-sm font-medium text-red-700 cursor-pointer hover:text-red-800">Ver detalles de errores ({result.errorDetails.length})</summary>
                <ul className="mt-3 space-y-1 max-h-48 overflow-y-auto bg-white/60 rounded-xl p-3">
                  {result.errorDetails.map((e, i) => (
                    <li key={i} className="text-xs text-red-600 font-mono">{e.error_message}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>

          <button onClick={handleReset}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nueva importación
          </button>
        </div>
      )}

      {step !== "select" && <div className="mt-8 border-t border-gray-100 pt-2" />}

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
                  <td className="px-4 py-3 text-gray-900 max-w-[200px] truncate">{imp.file_name}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{imp.total_rows}</td>
                  <td className="px-4 py-3 text-right text-green-600">{imp.success_count}</td>
                  <td className="px-4 py-3 text-right text-red-600">{imp.error_count}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${imp.status === "completed" ? "bg-green-50 text-green-700" : imp.status === "failed" ? "bg-red-50 text-red-700" : "bg-yellow-50 text-yellow-700"}`}>{imp.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{imp.profiles?.full_name || "—"}</td>
                  <td className="px-4 py-3 text-right text-gray-500">{new Date(imp.created_at).toLocaleDateString("es-CR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === "," && !inQuotes) {
      result.push(current)
      current = ""
    } else {
      current += char
    }
  }
  result.push(current)
  return result
}
