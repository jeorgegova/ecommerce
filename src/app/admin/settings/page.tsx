"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"

interface Setting {
  id: string
  key: string
  value: unknown
  description: string | null
  created_at: string
  updated_at: string
}

const emptyForm = { key: "", valueText: "", description: "" }

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return ""
  if (typeof value === "string") return value
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function getValueMeta(value: unknown) {
  if (value === null || value === undefined) return { type: "vacío", label: "Vacío", color: "bg-gray-100 text-gray-500", display: "—" }
  if (typeof value === "boolean") {
    return {
      type: "boolean",
      label: value ? "Sí / Activo" : "No / Inactivo",
      color: value ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-600 border-gray-200",
      display: value ? "Sí" : "No",
      icon: value ? "✓" : "✕",
    }
  }
  if (typeof value === "number") {
    return {
      type: "number",
      label: "Número",
      color: "bg-blue-50 text-blue-700 border-blue-200",
      display: new Intl.NumberFormat("es-CR").format(value),
      icon: "#",
    }
  }
  if (typeof value === "string") {
    const v = value.trim()
    // detect url, email, phone
    if (v.startsWith("http")) return { type: "url", label: "Enlace", color: "bg-purple-50 text-purple-700 border-purple-200", display: v, icon: "↗" }
    if (v.includes("@")) return { type: "email", label: "Correo", color: "bg-amber-50 text-amber-700 border-amber-200", display: v, icon: "@" }
    if (v.length > 80) return { type: "texto largo", label: "Texto largo", color: "bg-gray-50 text-gray-700 border-gray-200", display: v.slice(0, 80) + "…", icon: "≡" }
    return { type: "texto", label: "Texto", color: "bg-gray-50 text-gray-700 border-gray-200", display: v || "—", icon: "T" }
  }
  if (Array.isArray(value)) {
    return { type: "lista", label: `Lista (${value.length})`, color: "bg-indigo-50 text-indigo-700 border-indigo-200", display: `${value.length} elementos`, icon: "☰" }
  }
  if (typeof value === "object") {
    const keys = Object.keys(value as object).length
    return { type: "objeto", label: `Objeto (${keys} campos)`, color: "bg-indigo-50 text-indigo-700 border-indigo-200", display: `${keys} campos`, icon: "{}" }
  }
  return { type: "otro", label: "Otro", color: "bg-gray-50 text-gray-700 border-gray-200", display: String(value), icon: "•" }
}

function parseValue(input: string): unknown {
  const trimmed = input.trim()
  if (trimmed === "") return ""
  try {
    return JSON.parse(trimmed)
  } catch {
    return trimmed
  }
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleString("es-CR", { dateStyle: "medium", timeStyle: "short" })
}

function relativeDate(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "ahora mismo"
  if (mins < 60) return `hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `hace ${days} días`
  return formatDate(dateStr)
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const supabase = createClient()

  const fetchSettings = async () => {
    setLoading(true)
    const { data, error: fetchError } = await supabase.from("settings").select("*").order("key", { ascending: true })
    if (fetchError) setError(fetchError.message)
    setSettings((data as Setting[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(false)
    setError("")
  }

  const startCreate = () => {
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(true)
    setError("")
  }

  const startEdit = (s: Setting) => {
    setForm({ key: s.key, valueText: formatValue(s.value), description: s.description || "" })
    setEditingId(s.id)
    setShowForm(true)
    setError("")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")
    const key = form.key.trim()
    if (!key) { setError("La clave es obligatoria"); setSaving(false); return }
    if (!/^[a-z0-9_\-.]+$/i.test(key)) { setError("Clave solo permite letras, números, guión y guión bajo"); setSaving(false); return }
    const value = parseValue(form.valueText)
    const payload = { key, value, description: form.description.trim() || null }
    if (editingId) {
      const { error: err } = await supabase.from("settings").update(payload).eq("id", editingId)
      if (err) { setError(err.message); setSaving(false); return }
    } else {
      const { error: err } = await supabase.from("settings").insert(payload)
      if (err) {
        if (err.message.includes("duplicate") || err.code === "23505") setError(`Ya existe una configuración con la clave "${key}"`)
        else setError(err.message)
        setSaving(false); return
      }
    }
    await fetchSettings()
    resetForm()
    setSaving(false)
  }

  const handleDelete = async (id: string, key: string) => {
    if (!confirm(`¿Eliminar "${key}"? Esta acción no se puede deshacer.`)) return
    setDeletingId(id)
    const { error: err } = await supabase.from("settings").delete().eq("id", id)
    if (err) alert(err.message)
    else setSettings((prev) => prev.filter((s) => s.id !== id))
    setDeletingId(null)
  }

  const copyValue = async (key: string, value: unknown) => {
    await navigator.clipboard.writeText(formatValue(value))
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 1500)
  }

  const filtered = settings.filter((s) => {
    const q = search.toLowerCase()
    if (!q) return true
    return s.key.toLowerCase().includes(q) || (s.description || "").toLowerCase().includes(q) || formatValue(s.value).toLowerCase().includes(q)
  })

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-gray-900" />
    </div>
  )

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">Parametrización</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-950">Configuración</h1>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-gray-500">
            Gestiona los datos de tu tienda. Cada fila es un dato que usa la web (teléfono, correo, textos). Toca <span className="font-semibold text-gray-700">Editar</span> para cambiarlo sin tocar código.
          </p>
        </div>
        {!showForm && (
          <button onClick={startCreate} className="inline-flex shrink-0 items-center justify-center rounded-full bg-gray-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-800 shadow-sm">
            + Nuevo parámetro
          </button>
        )}
      </div>

      {/* Buscador */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input
            type="text"
            placeholder="Buscar por nombre, descripción o valor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm outline-none placeholder:text-gray-400 focus:border-gray-900"
          />
        </div>
        <p className="text-xs text-gray-400">{filtered.length} de {settings.length} parámetros</p>
      </div>

      {/* Formulario - orden: Descripción, Valor, Clave (valor primero para no técnico) */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mt-6 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-gray-50/70 border-b border-gray-100 px-6 py-4">
            <h2 className="text-base font-semibold text-gray-900">{editingId ? "Editar parámetro" : "Nuevo parámetro"}</h2>
            <p className="mt-1 text-xs text-gray-500">Completa los campos en orden. La <span className="font-semibold">descripción</span> es lo que verás en la lista.</p>
          </div>
          <div className="p-6 space-y-5">
            {error && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-900">
                ¿Qué es este dato? <span className="text-xs font-normal text-gray-400">(Descripción)</span>
              </label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Ej: Correo que aparece en la página de contacto"
                className="mt-2 block w-full rounded-xl border border-gray-300 px-3 py-3 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
              <p className="mt-1.5 text-xs text-gray-400">Texto para que sepas para qué sirve este dato. No aparece al cliente, solo para ti.</p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-900">
                Valor <span className="text-xs font-normal text-gray-400">(lo que verá la tienda)</span>
              </label>
              <textarea
                value={form.valueText}
                onChange={(e) => setForm((p) => ({ ...p, valueText: e.target.value }))}
                placeholder={'Ej: wilsonalexandermontoya480@gmail.com  ó  +506 6023 1856  ó  true'}
                rows={3}
                className="mt-2 block w-full rounded-xl border border-gray-300 px-3 py-3 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] text-gray-600">Texto: &quot;Hola&quot;</span>
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] text-gray-600">Número: 1500</span>
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] text-gray-600">Sí/No: true / false</span>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                Clave técnica <span className="text-red-500">*</span> <span className="text-xs font-normal text-gray-400">(identificador, no lo cambies si no sabes)</span>
              </label>
              <input
                type="text"
                value={form.key}
                onChange={(e) => setForm((p) => ({ ...p, key: e.target.value }))}
                placeholder="ej: contact_email, store_phone"
                className="mt-2 block w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm font-mono focus:border-gray-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gray-900"
                required
              />
              <p className="mt-1.5 text-xs text-amber-600">⚠️ Única y sin espacios. Si la cambias, la web puede dejar de encontrar el dato.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 border-t border-gray-100 bg-gray-50/50 px-6 py-4">
            <button type="submit" disabled={saving} className="rounded-full bg-gray-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50">
              {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Crear parámetro"}
            </button>
            <button type="button" onClick={resetForm} className="text-sm font-medium text-gray-600 hover:text-gray-900">Cancelar</button>
          </div>
        </form>
      )}

      {/* DESKTOP TABLE - orden: Descripción, Valor, Actualizado, Clave */}
      <div className="mt-6 hidden overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm lg:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">Descripción</th>
                <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">Valor</th>
                <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">Actualizado</th>
                <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">Clave</th>
                <th className="px-5 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((s) => {
                const meta = getValueMeta(s.value)
                const raw = formatValue(s.value)
                const isLong = raw.length > 120
                return (
                  <tr key={s.id} className="hover:bg-gray-50/70">
                    <td className="px-5 py-4 align-top max-w-[280px]">
                      <p className="text-sm font-medium leading-snug text-gray-900">{s.description || <span className="text-gray-400 italic">Sin descripción — {s.key}</span>}</p>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-gray-500">{s.description ? s.key : ""}</p>
                    </td>
                    <td className="px-5 py-4 align-top max-w-[360px]">
                      <div className="flex items-start gap-2">
                        <span className={`mt-0.5 inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${meta.color}`}>{meta.icon} {meta.label}</span>
                      </div>
                      <div className="mt-2 relative rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5">
                        <p className="pr-8 text-sm leading-relaxed text-gray-900 break-all whitespace-pre-wrap max-h-20 overflow-auto">{isLong ? raw.slice(0, 120) + "…" : raw || "—"}</p>
                        <button onClick={() => copyValue(s.key, s.value)} className="absolute right-1.5 top-1.5 rounded-lg bg-white p-1.5 text-gray-400 hover:text-gray-700 border border-gray-200 shadow-sm" title="Copiar valor">
                          {copiedKey === s.key ? <span className="text-[10px] font-bold text-emerald-600">✓</span> : <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>}
                        </button>
                      </div>
                      {isLong && <p className="mt-1 text-[11px] text-gray-400">Valor largo — al editar verás el contenido completo.</p>}
                    </td>
                    <td className="px-5 py-4 align-top whitespace-nowrap">
                      <p className="text-sm font-medium text-gray-700">{relativeDate(s.updated_at)}</p>
                      <p className="text-xs text-gray-400">{formatDate(s.updated_at)}</p>
                    </td>
                    <td className="px-5 py-4 align-top">
                      <span className="inline-flex max-w-[140px] truncate rounded-lg bg-white border border-gray-200 px-2 py-1 font-mono text-xs text-gray-600">{s.key}</span>
                    </td>
                    <td className="px-5 py-4 align-top whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => startEdit(s)} className="rounded-full bg-gray-900 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-gray-800">Editar</button>
                        <button onClick={() => handleDelete(s.id, s.key)} disabled={deletingId === s.id} className="rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50">
                          {deletingId === s.id ? "..." : "Eliminar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-16 text-center"><p className="text-sm font-medium text-gray-900">No hay parámetros</p><p className="mt-1 text-xs text-gray-400">{search ? "Prueba con otra búsqueda" : "Crea tu primer parámetro con el botón de arriba"}</p></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOBILE CARDS - mismo orden: Descripción, Valor, Actualizado, Clave */}
      <div className="mt-6 grid gap-3 lg:hidden">
        {filtered.map((s) => {
          const meta = getValueMeta(s.value)
          const raw = formatValue(s.value)
          return (
            <div key={s.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Descripción</p>
                <p className="mt-1 text-[15px] font-semibold leading-snug text-gray-900">{s.description || "Sin descripción"}</p>
                {!s.description && <p className="text-xs text-gray-500 font-mono mt-1">{s.key}</p>}
              </div>

              <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Valor actual</p>
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${meta.color}`}>{meta.label}</span>
                </div>
                <div className="relative mt-2 rounded-xl bg-white border border-gray-200 px-3 py-3">
                  <p className="pr-8 text-sm leading-relaxed text-gray-900 break-all whitespace-pre-wrap">{raw || "—"}</p>
                  <button onClick={() => copyValue(s.key, s.value)} className="absolute right-2 top-2 rounded-lg bg-gray-50 p-1.5 text-gray-500 border border-gray-200">
                    {copiedKey === s.key ? <span className="text-xs font-bold text-emerald-600">✓ Copiado</span> : <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>}
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-gray-400">Este es el dato que usa la tienda. Si lo cambias, se actualiza en la web.</p>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Actualizado</p>
                  <p className="mt-1 text-sm font-medium text-gray-700">{relativeDate(s.updated_at)}</p>
                  <p className="text-[11px] text-gray-400">{new Date(s.updated_at).toLocaleDateString("es-CR")}</p>
                </div>
                <div className="rounded-xl bg-white border border-gray-200 px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Clave</p>
                  <p className="mt-1 font-mono text-xs leading-tight text-gray-600 break-all">{s.key}</p>
                  <p className="text-[10px] text-gray-400">No tocar si no sabes</p>
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <button onClick={() => startEdit(s)} className="flex-1 rounded-full bg-gray-900 py-2.5 text-sm font-medium text-white">Editar</button>
                <button onClick={() => handleDelete(s.id, s.key)} disabled={deletingId === s.id} className="rounded-full border border-red-200 px-5 py-2.5 text-sm font-medium text-red-600 bg-white">Eliminar</button>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
            <p className="text-sm font-medium text-gray-900">No hay parámetros</p>
            <p className="mt-1 text-xs text-gray-500">{search ? "Prueba otra búsqueda" : "Toca + Nuevo parámetro para empezar"}</p>
          </div>
        )}
      </div>

      <p className="mt-4 text-center text-xs leading-relaxed text-gray-400 lg:text-left">
        Orden: <span className="font-semibold text-gray-600">Descripción</span> → <span className="font-semibold text-gray-600">Valor</span> → <span className="font-semibold text-gray-600">Actualizado</span> → <span className="font-semibold text-gray-600">Clave</span>. Pensado para usar sin conocimientos técnicos.
      </p>
    </div>
  )
}
