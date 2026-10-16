"use client"

import { createClient } from "@/lib/supabase/client"
import { useCallback, useEffect, useMemo, useState } from "react"

interface SettingRow {
  id: string
  key: string
  value: any
  description: string | null
  created_at: string
  updated_at: string
}

type TabType = "store" | "payments" | "shipping" | "social" | "system" | "seo" | "all"

interface FieldDefinition {
  key: string
  label: string
  description?: string
  type: "text" | "textarea" | "number" | "boolean" | "url"
  placeholder?: string
  suffix?: string
  category: "store" | "payments" | "shipping" | "social" | "system" | "seo"
}

const KNOWN_FIELDS: FieldDefinition[] = [
  // Tienda & General
  { key: "store_name", label: "Nombre de la tienda", description: "Nombre comercial que se muestra en toda la aplicación", type: "text", placeholder: "PARTEX", category: "store" },
  { key: "store_slogan", label: "Lema oficial", description: "Lema que acompaña el logo y la cabecera", type: "text", placeholder: "Professional parts & components", category: "store" },
  { key: "store_description", label: "Descripción corta", description: "Descripción principal para pie de página y metadatos SEO", type: "textarea", placeholder: "Professional parts & components", category: "store" },
  { key: "store_email", label: "Correo de contacto", description: "Email oficial donde los clientes pueden comunicarse", type: "text", placeholder: "hola@gogi.co", category: "store" },
  { key: "store_phone", label: "Teléfono de contacto", description: "Línea de atención al cliente", type: "text", placeholder: "+57 300 000 0000", category: "store" },
  { key: "store_currency", label: "Moneda por defecto", description: "Código ISO de la moneda (COP, EUR, USD)", type: "text", placeholder: "COP", category: "store" },
  { key: "store_locale", label: "Locale regional", description: "Formato de fecha e idioma por defecto", type: "text", placeholder: "es-CO", category: "store" },
  { key: "store_timezone", label: "Zona horaria", description: "Zona horaria para auditorías y registros", type: "text", placeholder: "America/Bogota", category: "store" },
  { key: "store_logo_url", label: "URL del logo", description: "Enlace a la imagen del logo principal", type: "url", placeholder: "https://ejemplo.com/logo.png", category: "store" },
  { key: "store_favicon_url", label: "URL del favicon", description: "Enlace al icono de pestaña de la tienda", type: "url", placeholder: "https://ejemplo.com/favicon.ico", category: "store" },

  // Pagos & Banco
  { key: "banco_consignar", label: "Banco para transferencias", description: "Entidad bancaria receptora de consignaciones mostrada en proforma", type: "text", placeholder: "Bancolombia", category: "payments" },
  { key: "numero_cuenta_bancaria", label: "Número de cuenta bancaria", description: "Tipo y número de cuenta para transferencias", type: "text", placeholder: "Ahorros 1234567890", category: "payments" },
  { key: "tax_rate", label: "Tasa de impuesto (IVA)", description: "Porcentaje de IVA aplicado a los productos", type: "number", suffix: "%", placeholder: "19", category: "payments" },
  { key: "order_auto_confirm", label: "Confirmación automática de pedidos", description: "Si está activo, los pedidos se marcan como confirmados inmediatamente al crearse", type: "boolean", category: "payments" },

  // Envíos & Inventario
  { key: "shipping_cost", label: "Costo de envío base", description: "Costo estándar aplicado a compras que no alcanzan el envío gratis", type: "number", suffix: "€ / $", placeholder: "0", category: "shipping" },
  { key: "shipping_free_min", label: "Monto mínimo para envío gratis", description: "Compras a partir de este monto tienen costo de envío cero", type: "number", suffix: "€ / $", placeholder: "150000", category: "shipping" },
  { key: "low_stock_threshold", label: "Umbral de inventario bajo", description: "Cantidad de unidades mínimas para disparar alertas de stock", type: "number", suffix: "unidades", placeholder: "5", category: "shipping" },

  // Redes Sociales
  { key: "social_whatsapp", label: "WhatsApp", description: "Número con código de país para botón de chat", type: "text", placeholder: "+573000000000", category: "social" },
  { key: "social_instagram", label: "Instagram", description: "Usuario o URL del perfil", type: "text", placeholder: "gogi_tienda", category: "social" },
  { key: "social_facebook", label: "Facebook", description: "Enlace a la página o fanpage", type: "text", placeholder: "https://facebook.com/gogi", category: "social" },

  // Sistema & Operación
  { key: "pagination_size", label: "Productos por página", description: "Número de artículos por página en listados", type: "number", placeholder: "20", category: "system" },
  { key: "max_view_history", label: "Límite de historial de vistos", description: "Cantidad máxima de productos recientes recordados por usuario", type: "number", placeholder: "100", category: "system" },
  { key: "maintenance_mode", label: "Modo mantenimiento", description: "Muestra pantalla de pausa en la tienda pública", type: "boolean", category: "system" },

  // SEO & Analítica
  { key: "google_analytics_id", label: "Google Analytics ID", description: "Identificador de medición (ej. G-XXXXXXXX)", type: "text", placeholder: "G-XXXXXXXXXX", category: "seo" },
  { key: "gtm_id", label: "Google Tag Manager ID", description: "Contenedor de GTM (ej. GTM-XXXXXXX)", type: "text", placeholder: "GTM-XXXXXXX", category: "seo" },
  { key: "meta_og_image", label: "Imagen OG por defecto", description: "URL de la imagen al compartir la tienda en redes sociales", type: "url", placeholder: "https://...", category: "seo" },
  { key: "meta_og_locale", label: "Locale OG", description: "Etiqueta regional Open Graph", type: "text", placeholder: "es_CO", category: "seo" },
]

function unwrapValue(val: any): any {
  if (val === null || val === undefined) return ""
  if (typeof val === "boolean" || typeof val === "number") return val
  if (typeof val === "string") {
    // Si viene con comillas dobles serializadas como '"COP"'
    if (val.startsWith('"') && val.endsWith('"') && val.length >= 2) {
      try {
        const parsed = JSON.parse(val)
        return parsed
      } catch {
        return val.slice(1, -1)
      }
    }
    return val
  }
  return val
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SettingRow[]>([])
  const [formValues, setFormValues] = useState<Record<string, any>>({})
  const [descriptions, setDescriptions] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [savingAll, setSavingAll] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>("store")
  const [search, setSearch] = useState("")
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null)
  
  // Modal para agregar nuevo parámetro
  const [showNewModal, setShowNewModal] = useState(false)
  const [newKey, setNewKey] = useState("")
  const [newVal, setNewVal] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [newType, setNewType] = useState<"text" | "number" | "boolean">("text")
  const [creating, setCreating] = useState(false)

  const supabase = createClient()

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.from("settings").select("*").order("key", { ascending: true })
    if (error) {
      showToast("error", `Error al cargar configuración: ${error.message}`)
      setLoading(false)
      return
    }

    if (data) {
      setSettings(data as SettingRow[])
      const vals: Record<string, any> = {}
      const descs: Record<string, string> = {}
      data.forEach((row) => {
        vals[row.key] = unwrapValue(row.value)
        descs[row.key] = row.description || ""
      })
      setFormValues(vals)
      setDescriptions(descs)
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3500)
  }

  const handleFieldChange = (key: string, val: any) => {
    setFormValues((prev) => ({ ...prev, [key]: val }))
  }

  const saveSingle = async (key: string, customDesc?: string) => {
    setSavingKey(key)
    try {
      const rawVal = formValues[key]
      const desc = customDesc !== undefined ? customDesc : (descriptions[key] || "")
      
      // Asegurar formato JSON nativo
      let payloadValue: any = rawVal
      if (typeof rawVal === "string" && !isNaN(Number(rawVal)) && rawVal.trim() !== "" && isFieldNumeric(key)) {
        payloadValue = Number(rawVal)
      }

      const { error } = await supabase
        .from("settings")
        .upsert(
          {
            key,
            value: payloadValue,
            description: desc,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "key" }
        )

      if (error) throw error
      showToast("success", `Parámetro "${key}" guardado correctamente`)
      await fetchSettings()
    } catch (err: any) {
      showToast("error", `Error al guardar "${key}": ${err.message}`)
    } finally {
      setSavingKey(null)
    }
  }

  const isFieldNumeric = (key: string) => {
    const known = KNOWN_FIELDS.find((f) => f.key === key)
    return known?.type === "number"
  }

  const saveAllCategory = async (category: TabType) => {
    setSavingAll(true)
    try {
      const fieldsToSave = KNOWN_FIELDS.filter((f) => f.category === category)
      const upserts = fieldsToSave.map((f) => {
        let val = formValues[f.key]
        if (f.type === "number" && val !== undefined && val !== "") {
          val = Number(val)
        }
        return {
          key: f.key,
          value: val !== undefined ? val : "",
          description: descriptions[f.key] || f.description || "",
          updated_at: new Date().toISOString(),
        }
      })

      const { error } = await supabase.from("settings").upsert(upserts, { onConflict: "key" })
      if (error) throw error
      showToast("success", "Todos los cambios de esta sección fueron guardados")
      await fetchSettings()
    } catch (err: any) {
      showToast("error", `Error al guardar: ${err.message}`)
    } finally {
      setSavingAll(false)
    }
  }

  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanKey = newKey.trim().toLowerCase().replace(/\s+/g, "_")
    if (!cleanKey) {
      showToast("error", "La clave no puede estar vacía")
      return
    }

    setCreating(true)
    try {
      let finalVal: any = newVal
      if (newType === "boolean") finalVal = newVal === "true"
      else if (newType === "number") finalVal = Number(newVal) || 0

      const { error } = await supabase.from("settings").insert({
        key: cleanKey,
        value: finalVal,
        description: newDesc.trim() || null,
      })

      if (error) throw error
      showToast("success", `Parámetro "${cleanKey}" creado con éxito`)
      setShowNewModal(false)
      setNewKey("")
      setNewVal("")
      setNewDesc("")
      await fetchSettings()
      setActiveTab("all")
    } catch (err: any) {
      showToast("error", `Error al crear: ${err.message}`)
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string, keyName: string) => {
    if (!confirm(`¿Estás seguro de eliminar el parámetro "${keyName}"? Esta acción no se puede deshacer.`)) return
    try {
      const { error } = await supabase.from("settings").delete().eq("id", id)
      if (error) throw error
      showToast("success", `Parámetro "${keyName}" eliminado`)
      await fetchSettings()
    } catch (err: any) {
      showToast("error", `Error al eliminar: ${err.message}`)
    }
  }

  const allFilteredSettings = useMemo(() => {
    if (!search.trim()) return settings
    const q = search.toLowerCase()
    return settings.filter(
      (s) => s.key.toLowerCase().includes(q) || (s.description && s.description.toLowerCase().includes(q))
    )
  }, [settings, search])

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    {
      id: "store",
      label: "Tienda & General",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.651V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009 9c.635 0 1.22-.197 1.705-.535a3.002 3.002 0 004.59 0c.485.338 1.07.535 1.705.535 1.04 0 1.968-.53 2.52-1.336a3.003 3.003 0 00.48 1.685z" />
        </svg>
      ),
    },
    {
      id: "payments",
      label: "Pagos & Banco",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
        </svg>
      ),
    },
    {
      id: "shipping",
      label: "Envíos & Stock",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.25V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V14.25" />
        </svg>
      ),
    },
    {
      id: "social",
      label: "Redes Sociales",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
        </svg>
      ),
    },
    {
      id: "system",
      label: "Sistema",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
        </svg>
      ),
    },
    {
      id: "seo",
      label: "SEO & Analítica",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25l2.25 2.25L15 9" />
        </svg>
      ),
    },
    {
      id: "all",
      label: "Todos los Parámetros",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
        </svg>
      ),
    },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl px-5 py-3.5 shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 ${
            toast.type === "success"
              ? "bg-gray-900 text-white border border-gray-800"
              : "bg-red-600 text-white border border-red-700"
          }`}
        >
          {toast.type === "success" ? (
            <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          ) : (
            <svg className="h-5 w-5 text-red-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          )}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-700/10">
              Parametrización
            </span>
            <span className="text-xs text-gray-400">Tabla: settings</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Configuración del Sistema
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Administra los valores globales de la tienda utilizados en checkout, proformas, correos y diseño.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nuevo Parámetro
          </button>
          {activeTab !== "all" && (
            <button
              onClick={() => saveAllCategory(activeTab)}
              disabled={savingAll || loading}
              className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:opacity-50"
            >
              {savingAll ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  Guardando...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Guardar Sección
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto border-b border-gray-200 pb-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
                isActive
                  ? "bg-gray-900 text-white shadow-sm"
                  : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <span className={isActive ? "text-white" : "text-gray-400"}>{tab.icon}</span>
              {tab.label}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center rounded-3xl border border-gray-200 bg-white py-16">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
            <p className="text-sm font-medium text-gray-500">Cargando parámetros de configuración...</p>
          </div>
        </div>
      ) : activeTab === "all" ? (
        /* Vista de Todos los Parámetros */
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <svg className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar por clave o descripción..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
            </div>
            <p className="text-xs text-gray-500 font-medium">
              Mostrando {allFilteredSettings.length} de {settings.length} parámetros
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                  <tr>
                    <th className="px-5 py-3.5">Clave</th>
                    <th className="px-5 py-3.5">Descripción</th>
                    <th className="px-5 py-3.5">Valor Actual</th>
                    <th className="px-5 py-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allFilteredSettings.map((row) => {
                    const isSaving = savingKey === row.key
                    const val = formValues[row.key]
                    return (
                      <tr key={row.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="px-5 py-4 font-mono font-medium text-gray-900 whitespace-nowrap">
                          {row.key}
                        </td>
                        <td className="px-5 py-4 text-gray-600 max-w-xs">
                          <input
                            type="text"
                            value={descriptions[row.key] || ""}
                            onChange={(e) => setDescriptions((d) => ({ ...d, [row.key]: e.target.value }))}
                            className="w-full rounded-lg border border-transparent hover:border-gray-300 focus:border-gray-900 px-2 py-1 text-xs text-gray-600 transition focus:outline-none"
                            placeholder="Sin descripción"
                          />
                        </td>
                        <td className="px-5 py-4 min-w-[200px]">
                          {typeof val === "boolean" ? (
                            <button
                              type="button"
                              onClick={() => handleFieldChange(row.key, !val)}
                              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                val ? "bg-gray-900" : "bg-gray-200"
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                  val ? "translate-x-5" : "translate-x-0"
                                }`}
                              />
                            </button>
                          ) : (
                            <input
                              type={isFieldNumeric(row.key) ? "number" : "text"}
                              value={val !== undefined ? val : ""}
                              onChange={(e) => handleFieldChange(row.key, e.target.value)}
                              className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-1.5 text-sm font-medium text-gray-900 focus:bg-white focus:border-gray-900 focus:outline-none"
                            />
                          )}
                        </td>
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => saveSingle(row.key)}
                              disabled={isSaving}
                              className="rounded-lg bg-gray-900 px-3 py-1 text-xs font-semibold text-white shadow-sm hover:bg-gray-800 disabled:opacity-50"
                            >
                              {isSaving ? "Guardando..." : "Guardar"}
                            </button>
                            <button
                              onClick={() => handleDelete(row.id, row.key)}
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                              title="Eliminar parámetro"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Vista por Categoría */
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="grid gap-6 sm:grid-cols-2">
            {KNOWN_FIELDS.filter((f) => f.category === activeTab).map((field) => {
              const val = formValues[field.key]
              const isSaving = savingKey === field.key
              return (
                <div
                  key={field.key}
                  className={`flex flex-col justify-between rounded-2xl border p-5 transition-all ${
                    field.type === "boolean"
                      ? "bg-gray-50/50 border-gray-200"
                      : "bg-white border-gray-200/90 focus-within:border-gray-900 focus-within:ring-1 focus-within:ring-gray-900"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-sm font-semibold text-gray-900">
                        {field.label}
                      </label>
                      <span className="font-mono text-[11px] text-gray-400">
                        {field.key}
                      </span>
                    </div>
                    {field.description && (
                      <p className="mt-1 text-xs text-gray-500 leading-relaxed">
                        {field.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-4">
                    {field.type === "boolean" ? (
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                          {val ? "Activado" : "Desactivado"}
                        </span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleFieldChange(field.key, !val)}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              val ? "bg-gray-900" : "bg-gray-200"
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                val ? "translate-x-5" : "translate-x-0"
                              }`}
                            />
                          </button>
                          <button
                            type="button"
                            onClick={() => saveSingle(field.key)}
                            disabled={isSaving}
                            className="rounded-lg bg-gray-900 px-3 py-1 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                          >
                            {isSaving ? "..." : "Guardar"}
                          </button>
                        </div>
                      </div>
                    ) : field.type === "textarea" ? (
                      <div className="space-y-2">
                        <textarea
                          rows={3}
                          value={val !== undefined ? val : ""}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          placeholder={field.placeholder}
                          className="w-full rounded-xl border border-gray-200 p-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900"
                        />
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => saveSingle(field.key)}
                            disabled={isSaving}
                            className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                          >
                            {isSaving ? "Guardando..." : "Guardar este campo"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="relative">
                          <input
                            type={field.type === "number" ? "number" : "text"}
                            value={val !== undefined ? val : ""}
                            onChange={(e) => handleFieldChange(field.key, e.target.value)}
                            placeholder={field.placeholder}
                            className={`w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 ${
                              field.suffix ? "pr-14" : ""
                            }`}
                          />
                          {field.suffix && (
                            <span className="pointer-events-none absolute right-3.5 top-2 text-xs font-medium text-gray-400">
                              {field.suffix}
                            </span>
                          )}
                        </div>
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => saveSingle(field.key)}
                            disabled={isSaving}
                            className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                          >
                            {isSaving ? "Guardando..." : "Guardar este campo"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Modal para Crear Nuevo Parámetro */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Agregar Nuevo Parámetro</h3>
              <button
                onClick={() => setShowNewModal(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateNew} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase text-gray-600">
                  Clave del parámetro (Key)
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. descuento_cumpleanos"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3.5 py-2 font-mono text-sm focus:border-gray-900 focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-gray-400">
                  Se convertirá en minúsculas y guiones bajos automáticamente.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-gray-600">
                  Tipo de Dato
                </label>
                <select
                  value={newType}
                  onChange={(e: any) => setNewType(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3.5 py-2 text-sm focus:border-gray-900 focus:outline-none bg-white"
                >
                  <option value="text">Texto (String)</option>
                  <option value="number">Número (Integer / Float)</option>
                  <option value="boolean">Booleano (Verdadero / Falso)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-gray-600">
                  Valor Inicial
                </label>
                {newType === "boolean" ? (
                  <select
                    value={newVal || "true"}
                    onChange={(e) => setNewVal(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-300 px-3.5 py-2 text-sm focus:border-gray-900 focus:outline-none bg-white"
                  >
                    <option value="true">Verdadero (True)</option>
                    <option value="false">Falso (False)</option>
                  </select>
                ) : (
                  <input
                    type={newType === "number" ? "number" : "text"}
                    required
                    placeholder="Valor a almacenar"
                    value={newVal}
                    onChange={(e) => setNewVal(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-300 px-3.5 py-2 text-sm focus:border-gray-900 focus:outline-none"
                  />
                )}
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-gray-600">
                  Descripción
                </label>
                <textarea
                  rows={2}
                  placeholder="Explica para qué se usa este parámetro..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3.5 py-2 text-sm focus:border-gray-900 focus:outline-none"
                />
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="rounded-full px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-full bg-gray-900 px-5 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  {creating ? "Creando..." : "Crear Parámetro"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
