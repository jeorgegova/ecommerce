"use client"

import { createClient } from "@/lib/supabase/client"
import {
  deleteSetting,
  getSettingsList,
  saveSettingsBatch,
} from "@/lib/actions/settings"
import {
  DEFAULT_STORE_SETTINGS,
  SettingItem,
} from "@/lib/constants/settings"
import { useCallback, useEffect, useMemo, useState } from "react"

type TabKey = "general" | "payments" | "shipping" | "inventory" | "social" | "advanced" | "all"

interface TabOption {
  id: TabKey
  label: string
  description: string
  icon: (className?: string) => React.ReactNode
}

const TABS: TabOption[] = [
  {
    id: "general",
    label: "Tienda y General",
    description: "Datos principales, moneda, horarios y contacto de la tienda",
    icon: (cls = "h-4 w-4") => (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.672 3.5h12.656a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72m-13.5 8.651h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H5.25a.75.75 0 0 0-.75.75v3.651c0 .414.336.75.75.75Z" />
      </svg>
    ),
  },
  {
    id: "payments",
    label: "Pagos y Cuentas Bancarias",
    description: "Información bancaria para transferencias en checkout y PDF",
    icon: (cls = "h-4 w-4") => (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
      </svg>
    ),
  },
  {
    id: "shipping",
    label: "Envíos e Impuestos",
    description: "Tarifas de flete, umbral de envío gratis y porcentajes de IVA",
    icon: (cls = "h-4 w-4") => (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.25V18.75m0-11.25V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v9.375m12 0h-12" />
      </svg>
    ),
  },
  {
    id: "inventory",
    label: "Inventario y Catálogo",
    description: "Alertas de stock mínimo, paginación y botones de stock",
    icon: (cls = "h-4 w-4") => (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
      </svg>
    ),
  },
  {
    id: "social",
    label: "Redes y Marketing",
    description: "WhatsApp, perfiles sociales y etiquetas de analítica (GA / GTM)",
    icon: (cls = "h-4 w-4") => (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
      </svg>
    ),
  },
  {
    id: "advanced",
    label: "Mantenimiento y Modo Tienda",
    description: "Control de disponibilidad y opciones de contingencia",
    icon: (cls = "h-4 w-4") => (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
      </svg>
    ),
  },
  {
    id: "all",
    label: "Todos los Parámetros (JSON/CRUD)",
    description: "Inspección completa, creación de claves personalizadas y edición cruda",
    icon: (cls = "h-4 w-4") => (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
      </svg>
    ),
  },
]

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("general")
  const [settings, setSettings] = useState<Record<string, { value: any; description: string | null }>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  // Modal para agregar nueva clave personalizada
  const [showAddModal, setShowAddModal] = useState(false)
  const [newKey, setNewKey] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [newValueType, setNewValueType] = useState<"string" | "number" | "boolean" | "json">("string")
  const [newRawValue, setNewRawValue] = useState("")

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const list = await getSettingsList()

      // Mapear configuraciones de la base de datos
      const map: Record<string, { value: any; description: string | null }> = {}
      for (const item of list) {
        map[item.key] = {
          value: item.value,
          description: item.description,
        }
      }

      // Si la base de datos no tiene alguna clave estándar, mezclarla con el valor por defecto
      for (const def of DEFAULT_STORE_SETTINGS) {
        if (map[def.key] === undefined) {
          map[def.key] = {
            value: def.value,
            description: def.description,
          }
        }
      }

      setSettings(map)
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Error al cargar configuración" })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const showNotification = (type: "success" | "error", text: string) => {
    setStatusMessage({ type, text })
    setTimeout(() => {
      setStatusMessage(null)
    }, 4500)
  }

  const handleValueChange = (key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || { description: null }),
        value,
      },
    }))
  }

  const handleDescriptionChange = (key: string, description: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || { value: "" }),
        description,
      },
    }))
  }

  const handleSaveAll = async () => {
    try {
      setSaving(true)
      const payload = Object.entries(settings).map(([key, data]) => ({
        key,
        value: data.value,
        description: data.description,
      }))

      await saveSettingsBatch(payload)
      showNotification("success", "Configuración guardada correctamente en la base de datos.")
    } catch (err: any) {
      showNotification("error", "Error al guardar: " + (err.message || "Error desconocido"))
    } finally {
      setSaving(false)
    }
  }

  const handleResetToDefaults = () => {
    if (!confirm("¿Deseas restaurar todos los parámetros a los valores recomendados por defecto para Amelatte?")) {
      return
    }
    const map: Record<string, { value: any; description: string | null }> = {}
    for (const def of DEFAULT_STORE_SETTINGS) {
      map[def.key] = {
        value: def.value,
        description: def.description,
      }
    }
    setSettings(map)
    showNotification("success", "Valores recomendados cargados. Haz clic en 'Guardar Cambios' para aplicarlos.")
  }

  const handleDeleteCustomKey = async (key: string) => {
    if (!confirm(`¿Estás seguro de eliminar el parámetro '${key}'?`)) return
    try {
      setSaving(true)
      await deleteSetting(key)
      setSettings((prev) => {
        const copy = { ...prev }
        delete copy[key]
        return copy
      })
      showNotification("success", `Parámetro '${key}' eliminado con éxito.`)
    } catch (err: any) {
      showNotification("error", "Error al eliminar: " + (err.message || ""))
    } finally {
      setSaving(false)
    }
  }

  const handleCreateCustomKey = (e: React.FormEvent) => {
    e.preventDefault()
    const cleanKey = newKey.trim().toLowerCase().replace(/\s+/g, "_")
    if (!cleanKey) {
      alert("Por favor ingresa un nombre de clave válido")
      return
    }

    let parsedValue: any = newRawValue
    if (newValueType === "number") {
      parsedValue = Number(newRawValue) || 0
    } else if (newValueType === "boolean") {
      parsedValue = newRawValue === "true"
    } else if (newValueType === "json") {
      try {
        parsedValue = JSON.parse(newRawValue)
      } catch (err) {
        alert("El valor JSON no tiene una sintaxis válida. Revisa las comillas y llaves.")
        return
      }
    }

    setSettings((prev) => ({
      ...prev,
      [cleanKey]: {
        value: parsedValue,
        description: newDescription.trim() || null,
      },
    }))

    setShowAddModal(false)
    setNewKey("")
    setNewDescription("")
    setNewRawValue("")
    showNotification("success", `Clave '${cleanKey}' agregada. Recuerda hacer clic en 'Guardar Cambios'.`)
  }

  // Filtrado para la pestaña "Todos"
  const allFilteredKeys = useMemo(() => {
    const keys = Object.keys(settings)
    if (!searchQuery.trim()) return keys
    const q = searchQuery.toLowerCase()
    return keys.filter(
      (k) =>
        k.toLowerCase().includes(q) ||
        (settings[k]?.description && settings[k].description!.toLowerCase().includes(q))
    )
  }, [settings, searchQuery])

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="h-8 w-48 rounded bg-gray-200 animate-pulse" />
        <div className="h-64 rounded-xl border border-gray-200 bg-white p-6 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Configuración de la Tienda</h1>
          <p className="mt-1 text-sm text-gray-500">
            Administra los parámetros globales del sistema guardados en la tabla <code className="text-xs font-mono bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded">public.settings</code>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 hover:text-gray-900"
          >
            Cargar Recomendados
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSaveAll}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Guardando...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                Guardar Cambios
              </>
            )}
          </button>
        </div>
      </div>

      {/* Alerta de feedback */}
      {statusMessage && (
        <div
          className={`flex items-center justify-between rounded-xl p-4 text-sm font-medium ${
            statusMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <span>{statusMessage.text}</span>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs uppercase font-bold tracking-wider hover:opacity-75"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Navegación por pestañas */}
      <div className="flex overflow-x-auto border-b border-gray-200 bg-white rounded-t-xl px-2 pt-2 scrollbar-none">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
                isActive
                  ? "border-[#C8102E] text-[#C8102E]"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
            >
              {tab.icon(isActive ? "text-[#C8102E] h-4 w-4" : "text-gray-400 h-4 w-4")}
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Contenedor de contenido de pestañas */}
      <div className="rounded-b-xl border border-t-0 border-gray-200 bg-white p-6 shadow-sm">
        {/* Pestaña: General */}
        {activeTab === "general" && (
          <div className="space-y-6">
            <div className="border-b border-gray-100 pb-4">
              <h2 className="text-base font-semibold text-gray-900">Identidad y Contacto de la Tienda</h2>
              <p className="text-xs text-gray-500">Parámetros visibles para tus clientes en la cabecera, correos y facturas.</p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                  Nombre de la Tienda
                </label>
                <input
                  type="text"
                  value={settings.store_name?.value || ""}
                  onChange={(e) => handleValueChange("store_name", e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-900"
                  placeholder="Amelatte"
                />
                <p className="mt-1 text-[11px] text-gray-400">Clave: <code className="font-mono">store_name</code></p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                  Correo Electrónico de Contacto
                </label>
                <input
                  type="email"
                  value={settings.store_email?.value || ""}
                  onChange={(e) => handleValueChange("store_email", e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-900"
                  placeholder="hola@amelatte.co"
                />
                <p className="mt-1 text-[11px] text-gray-400">Clave: <code className="font-mono">store_email</code></p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                  Teléfono / Línea de Atención
                </label>
                <input
                  type="text"
                  value={settings.store_phone?.value || ""}
                  onChange={(e) => handleValueChange("store_phone", e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-900"
                  placeholder="+57 318 459 6076"
                />
                <p className="mt-1 text-[11px] text-gray-400">Clave: <code className="font-mono">store_phone</code></p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                  Dirección Física (Sede / Local)
                </label>
                <input
                  type="text"
                  value={settings.store_address?.value || ""}
                  onChange={(e) => handleValueChange("store_address", e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-900"
                  placeholder="Calle 67 N° 23a - 46"
                />
                <p className="mt-1 text-[11px] text-gray-400">Clave: <code className="font-mono">store_address</code></p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                  Ciudad / País
                </label>
                <input
                  type="text"
                  value={settings.store_city?.value || ""}
                  onChange={(e) => handleValueChange("store_city", e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-900"
                  placeholder="Manizales / Colombia"
                />
                <p className="mt-1 text-[11px] text-gray-400">Clave: <code className="font-mono">store_city</code></p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                  Moneda por Defecto
                </label>
                <select
                  value={settings.store_currency?.value || "COP"}
                  onChange={(e) => handleValueChange("store_currency", e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-900"
                >
                  <option value="COP">COP ($ Peso Colombiano)</option>
                  <option value="USD">USD ($ Dólar Estadounidense)</option>
                  <option value="EUR">EUR (€ Euro)</option>
                </select>
                <p className="mt-1 text-[11px] text-gray-400">Clave: <code className="font-mono">store_currency</code></p>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                  Descripción o Eslogan de la Tienda
                </label>
                <textarea
                  rows={2}
                  value={settings.store_description?.value || ""}
                  onChange={(e) => handleValueChange("store_description", e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-900"
                  placeholder="Café de especialidad y máquinas de café premium..."
                />
                <p className="mt-1 text-[11px] text-gray-400">Clave: <code className="font-mono">store_description</code></p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                  Formato Regional (Locale)
                </label>
                <input
                  type="text"
                  value={settings.store_locale?.value || "es-CO"}
                  onChange={(e) => handleValueChange("store_locale", e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-900"
                  placeholder="es-CO"
                />
                <p className="mt-1 text-[11px] text-gray-400">Clave: <code className="font-mono">store_locale</code></p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                  Zona Horaria
                </label>
                <input
                  type="text"
                  value={settings.store_timezone?.value || "America/Bogota"}
                  onChange={(e) => handleValueChange("store_timezone", e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-900"
                  placeholder="America/Bogota"
                />
                <p className="mt-1 text-[11px] text-gray-400">Clave: <code className="font-mono">store_timezone</code></p>
              </div>
            </div>
          </div>
        )}

        {/* Pestaña: Pagos y Banco */}
        {activeTab === "payments" && (
          <div className="space-y-6">
            <div className="border-b border-gray-100 pb-4">
              <h2 className="text-base font-semibold text-gray-900">Datos Bancarios para Transferencias</h2>
              <p className="text-xs text-gray-500">
                Estos valores se le muestran al cliente al finalizar la compra y se incluyen en la factura proforma en PDF.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                  Banco para Consignar
                </label>
                <input
                  type="text"
                  value={settings.banco_consignar?.value || ""}
                  onChange={(e) => handleValueChange("banco_consignar", e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-900"
                  placeholder="Bancolombia"
                />
                <p className="mt-1 text-[11px] text-gray-400">Clave: <code className="font-mono">banco_consignar</code></p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                  Número de Cuenta Bancaria
                </label>
                <input
                  type="text"
                  value={settings.numero_cuenta_bancaria?.value || ""}
                  onChange={(e) => handleValueChange("numero_cuenta_bancaria", e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-900"
                  placeholder="000-000000-00"
                />
                <p className="mt-1 text-[11px] text-gray-400">Clave: <code className="font-mono">numero_cuenta_bancaria</code></p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                  Tipo de Cuenta
                </label>
                <input
                  type="text"
                  value={settings.tipo_cuenta_bancaria?.value || "Ahorros"}
                  onChange={(e) => handleValueChange("tipo_cuenta_bancaria", e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-900"
                  placeholder="Ahorros / Corriente"
                />
                <p className="mt-1 text-[11px] text-gray-400">Clave: <code className="font-mono">tipo_cuenta_bancaria</code></p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                  Titular de la Cuenta y NIT / Cédula
                </label>
                <input
                  type="text"
                  value={settings.titular_cuenta?.value || ""}
                  onChange={(e) => handleValueChange("titular_cuenta", e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-900"
                  placeholder="Amelatte S.A.S. - NIT 900.000.000-1"
                />
                <p className="mt-1 text-[11px] text-gray-400">Clave: <code className="font-mono">titular_cuenta</code></p>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                  Instrucciones de Pago / Notificación
                </label>
                <textarea
                  rows={3}
                  value={settings.instrucciones_pago?.value || ""}
                  onChange={(e) => handleValueChange("instrucciones_pago", e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-900"
                  placeholder="Enviar comprobante al WhatsApp con el número de pedido..."
                />
                <p className="mt-1 text-[11px] text-gray-400">Clave: <code className="font-mono">instrucciones_pago</code></p>
              </div>
            </div>
          </div>
        )}

        {/* Pestaña: Envíos e Impuestos */}
        {activeTab === "shipping" && (
          <div className="space-y-6">
            <div className="border-b border-gray-100 pb-4">
              <h2 className="text-base font-semibold text-gray-900">Tarifas de Despacho y Reglas de Pedidos</h2>
              <p className="text-xs text-gray-500">Controla costos de entrega, beneficios de envío gratuito y confirmación automática.</p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                  Costo de Envío Estándar ($ COP)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm text-gray-400">$</span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={settings.shipping_cost?.value !== undefined ? settings.shipping_cost.value : 0}
                    onChange={(e) => handleValueChange("shipping_cost", Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-200 pl-8 pr-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-900"
                    placeholder="12000"
                  />
                </div>
                <p className="mt-1 text-[11px] text-gray-400">Clave: <code className="font-mono">shipping_cost</code></p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                  Monto Mínimo para Envío Gratis ($ COP)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm text-gray-400">$</span>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    value={settings.shipping_free_min?.value !== undefined ? settings.shipping_free_min.value : 150000}
                    onChange={(e) => handleValueChange("shipping_free_min", Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-200 pl-8 pr-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-900"
                    placeholder="150000"
                  />
                </div>
                <p className="mt-1 text-[11px] text-gray-400">Clave: <code className="font-mono">shipping_free_min</code></p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                  Porcentaje de IVA / Impuestos (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={settings.tax_rate?.value !== undefined ? settings.tax_rate.value : 19}
                    onChange={(e) => handleValueChange("tax_rate", Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-200 pr-8 pl-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-900"
                    placeholder="19"
                  />
                  <span className="absolute right-3.5 top-2.5 text-sm text-gray-400">%</span>
                </div>
                <p className="mt-1 text-[11px] text-gray-400">Clave: <code className="font-mono">tax_rate</code></p>
              </div>

              <div className="flex flex-col justify-center rounded-lg border border-gray-100 bg-gray-50/70 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Confirmación Automática de Pedidos</p>
                    <p className="text-xs text-gray-500">Pasar pedidos entrantes automáticamente a estado Confirmado.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleValueChange("order_auto_confirm", !Boolean(settings.order_auto_confirm?.value))}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      settings.order_auto_confirm?.value ? "bg-emerald-600" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                        settings.order_auto_confirm?.value ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
                <p className="mt-2 text-[11px] text-gray-400">Clave: <code className="font-mono">order_auto_confirm</code></p>
              </div>
            </div>
          </div>
        )}

        {/* Pestaña: Inventario */}
        {activeTab === "inventory" && (
          <div className="space-y-6">
            <div className="border-b border-gray-100 pb-4">
              <h2 className="text-base font-semibold text-gray-900">Parámetros de Catálogo e Inventario</h2>
              <p className="text-xs text-gray-500">Reglas para alertas de unidades, visualización de barras de stock y paginación.</p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                  Umbral Global de Stock Bajo
                </label>
                <input
                  type="number"
                  min="1"
                  value={settings.low_stock_threshold?.value !== undefined ? settings.low_stock_threshold.value : 5}
                  onChange={(e) => handleValueChange("low_stock_threshold", Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-900"
                  placeholder="5"
                />
                <p className="mt-1 text-[11px] text-gray-400">
                  Genera alerta amarilla cuando el stock sea menor o igual. Clave: <code className="font-mono">low_stock_threshold</code>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                  Tope Visual de Barra de Stock
                </label>
                <input
                  type="number"
                  min="5"
                  value={settings.stock_bar_max?.value !== undefined ? settings.stock_bar_max.value : 20}
                  onChange={(e) => handleValueChange("stock_bar_max", Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-900"
                  placeholder="20"
                />
                <p className="mt-1 text-[11px] text-gray-400">
                  Nivel máximo (100%) para la barra de progreso en inventario. Clave: <code className="font-mono">stock_bar_max</code>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                  Productos por Página en Tienda
                </label>
                <input
                  type="number"
                  min="4"
                  step="4"
                  value={settings.pagination_size?.value !== undefined ? settings.pagination_size.value : 20}
                  onChange={(e) => handleValueChange("pagination_size", Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-900"
                  placeholder="20"
                />
                <p className="mt-1 text-[11px] text-gray-400">Clave: <code className="font-mono">pagination_size</code></p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                  Ajustes Rápidos de Stock (Separados por coma)
                </label>
                <input
                  type="text"
                  value={
                    Array.isArray(settings.quick_adjust_amounts?.value)
                      ? settings.quick_adjust_amounts.value.join(", ")
                      : typeof settings.quick_adjust_amounts?.value === "string"
                      ? settings.quick_adjust_amounts.value
                      : "1, 5, 10"
                  }
                  onChange={(e) => {
                    const parsed = e.target.value
                      .split(",")
                      .map((x) => Number(x.trim()))
                      .filter((x) => !isNaN(x) && x > 0)
                    handleValueChange("quick_adjust_amounts", parsed)
                  }}
                  className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-900"
                  placeholder="1, 5, 10"
                />
                <p className="mt-1 text-[11px] text-gray-400">
                  Botones de suma/resta rápida en inventario (+1, +5, +10). Clave: <code className="font-mono">quick_adjust_amounts</code>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Pestaña: Redes y Marketing */}
        {activeTab === "social" && (
          <div className="space-y-6">
            <div className="border-b border-gray-100 pb-4">
              <h2 className="text-base font-semibold text-gray-900">Canales de Contacto y Herramientas Analíticas</h2>
              <p className="text-xs text-gray-500">Configura tus enlaces sociales y los identificadores de seguimiento para Google.</p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                  WhatsApp Oficial (con código de país)
                </label>
                <input
                  type="text"
                  value={settings.social_whatsapp?.value || ""}
                  onChange={(e) => handleValueChange("social_whatsapp", e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-900"
                  placeholder="+573000000000"
                />
                <p className="mt-1 text-[11px] text-gray-400">Clave: <code className="font-mono">social_whatsapp</code></p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                  Instagram (Usuario o Enlace)
                </label>
                <input
                  type="text"
                  value={settings.social_instagram?.value || ""}
                  onChange={(e) => handleValueChange("social_instagram", e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-900"
                  placeholder="amelatte.cafe"
                />
                <p className="mt-1 text-[11px] text-gray-400">Clave: <code className="font-mono">social_instagram</code></p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                  Facebook (Página o Enlace)
                </label>
                <input
                  type="text"
                  value={settings.social_facebook?.value || ""}
                  onChange={(e) => handleValueChange("social_facebook", e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-900"
                  placeholder="amelattecafe"
                />
                <p className="mt-1 text-[11px] text-gray-400">Clave: <code className="font-mono">social_facebook</code></p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                  Google Analytics ID
                </label>
                <input
                  type="text"
                  value={settings.google_analytics_id?.value || ""}
                  onChange={(e) => handleValueChange("google_analytics_id", e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-900"
                  placeholder="G-XXXXXXXXXX"
                />
                <p className="mt-1 text-[11px] text-gray-400">Clave: <code className="font-mono">google_analytics_id</code></p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                  Google Tag Manager ID
                </label>
                <input
                  type="text"
                  value={settings.gtm_id?.value || ""}
                  onChange={(e) => handleValueChange("gtm_id", e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-900"
                  placeholder="GTM-XXXXXXX"
                />
                <p className="mt-1 text-[11px] text-gray-400">Clave: <code className="font-mono">gtm_id</code></p>
              </div>
            </div>
          </div>
        )}

        {/* Pestaña: Mantenimiento */}
        {activeTab === "advanced" && (
          <div className="space-y-6">
            <div className="border-b border-gray-100 pb-4">
              <h2 className="text-base font-semibold text-gray-900">Estado de Operación y Contingencia</h2>
              <p className="text-xs text-gray-500">Parámetros para pausar la tienda temporalmente o entrar en modo de mantenimiento.</p>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-amber-950">Modo Mantenimiento</h3>
                  <p className="text-xs text-amber-800 mt-0.5">
                    Al activarlo, los visitantes de la tienda verán un mensaje informando que se están realizando actualizaciones.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleValueChange("maintenance_mode", !Boolean(settings.maintenance_mode?.value))}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    settings.maintenance_mode?.value ? "bg-amber-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                      settings.maintenance_mode?.value ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
              <p className="mt-3 text-[11px] text-amber-700/80 font-mono">Clave: maintenance_mode</p>
            </div>
          </div>
        )}

        {/* Pestaña: Todos los Parámetros */}
        {activeTab === "all" && (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Gestor Integral de Claves (JSONB)</h2>
                <p className="text-xs text-gray-500">
                  Visualiza o edita directamente cualquier registro de la tabla <code className="font-mono">settings</code>.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por clave o descripción..."
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-900 outline-none focus:border-gray-900 w-64"
                />
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Nueva Clave
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-4 py-3">Clave (key)</th>
                    <th className="px-4 py-3">Valor (value JSONB)</th>
                    <th className="px-4 py-3">Descripción</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {allFilteredKeys.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                        No se encontraron parámetros con esa búsqueda.
                      </td>
                    </tr>
                  ) : (
                    allFilteredKeys.map((key) => {
                      const item = settings[key]
                      const valString = typeof item.value === "string" ? item.value : JSON.stringify(item.value)
                      return (
                        <tr key={key} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-mono font-medium text-gray-900 whitespace-nowrap">
                            {key}
                          </td>
                          <td className="px-4 py-3">
                            {typeof item.value === "boolean" ? (
                              <button
                                type="button"
                                onClick={() => handleValueChange(key, !item.value)}
                                className={`rounded px-2.5 py-1 text-[11px] font-semibold transition ${
                                  item.value ? "bg-emerald-100 text-emerald-800" : "bg-gray-200 text-gray-700"
                                }`}
                              >
                                {item.value ? "true (activo)" : "false (inactivo)"}
                              </button>
                            ) : (
                              <input
                                type="text"
                                value={valString ?? ""}
                                onChange={(e) => {
                                  const text = e.target.value
                                  try {
                                    // Si es JSON válido (objeto/array/número) parsearlo, sino dejar string
                                    const parsed = JSON.parse(text)
                                    handleValueChange(key, parsed)
                                  } catch {
                                    handleValueChange(key, text)
                                  }
                                }}
                                className="w-full rounded border border-gray-200 px-2 py-1 text-xs font-mono text-gray-900 outline-none focus:border-gray-900"
                              />
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-500">
                            <input
                              type="text"
                              value={item.description || ""}
                              onChange={(e) => handleDescriptionChange(key, e.target.value)}
                              placeholder="Sin descripción..."
                              className="w-full rounded border border-transparent hover:border-gray-200 px-2 py-1 text-xs text-gray-700 outline-none focus:border-gray-900 focus:bg-white"
                            />
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleDeleteCustomKey(key)}
                              title="Eliminar parámetro"
                              className="text-gray-400 hover:text-red-600 transition"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Barra inferior de guardar */}
        <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-5">
          <p className="text-xs text-gray-400">
            Los cambios se propagan de inmediato a las APIs y vistas de la tienda.
          </p>
          <button
            type="button"
            disabled={saving}
            onClick={handleSaveAll}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar Todos los Cambios"}
          </button>
        </div>
      </div>

      {/* Modal: Agregar Clave Personalizada */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-gray-900">Agregar Nuevo Parámetro</h3>
            <p className="mt-1 text-xs text-gray-500">Crea una nueva variable en la tabla public.settings.</p>

            <form onSubmit={handleCreateCustomKey} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                  Nombre de Clave (key)
                </label>
                <input
                  type="text"
                  required
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="ej: banner_tiempo_rotacion"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 font-mono outline-none focus:border-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                  Tipo de Valor
                </label>
                <select
                  value={newValueType}
                  onChange={(e) => setNewValueType(e.target.value as any)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900"
                >
                  <option value="string">Texto (String)</option>
                  <option value="number">Número (Number)</option>
                  <option value="boolean">Booleano (True / False)</option>
                  <option value="json">Objeto o Array (JSON)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                  Valor Inicial
                </label>
                {newValueType === "boolean" ? (
                  <select
                    value={newRawValue || "false"}
                    onChange={(e) => setNewRawValue(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900"
                  >
                    <option value="true">True (Verdadero)</option>
                    <option value="false">False (Falso)</option>
                  </select>
                ) : (
                  <input
                    type={newValueType === "number" ? "number" : "text"}
                    value={newRawValue}
                    onChange={(e) => setNewRawValue(e.target.value)}
                    placeholder={
                      newValueType === "number"
                        ? "5000"
                        : newValueType === "json"
                        ? '{"min": 1, "max": 10}'
                        : "Valor del parámetro"
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900 font-mono"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                  Descripción (opcional)
                </label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Para qué sirve este parámetro..."
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900"
                />
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-gray-800"
                >
                  Crear Parámetro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
