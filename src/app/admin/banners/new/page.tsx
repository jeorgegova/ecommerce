"use client"

import { createBanner } from "@/lib/actions/banners"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function NewBannerPage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    setError("")

    try {
      await createBanner(new FormData(e.currentTarget))
      router.push("/admin/banners")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear banner")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Banners
        </h2>
        <p className="mt-1 text-2xl font-bold text-gray-900">Nuevo banner</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
              Título
            </label>
            <input
              name="title"
              type="text"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-gray-900"
              placeholder="Ej: Gran liquidación de temporada"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
              Subtítulo
            </label>
            <input
              name="subtitle"
              type="text"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-gray-900"
              placeholder="Ej: Hasta 50% de descuento"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
              URL de la imagen *
            </label>
            <input
              name="image_url"
              type="text"
              required
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-gray-900"
              placeholder="https://ejemplo.com/banner.jpg"
            />
            <p className="mt-1 text-[11px] text-gray-400">
              Imagen principal del banner (1920x480 recomendado)
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
              URL de la imagen móvil (opcional)
            </label>
            <input
              name="mobile_image_url"
              type="text"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-gray-900"
              placeholder="https://ejemplo.com/banner-mobile.jpg"
            />
            <p className="mt-1 text-[11px] text-gray-400">
              Versión optimizada para móviles (750x600 recomendado)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                URL de enlace (opcional)
              </label>
              <input
                name="link_url"
                type="text"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-gray-900"
                placeholder="/productos/ofertas"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Texto del botón
              </label>
              <input
                name="link_text"
                type="text"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-gray-900"
                placeholder="Ver ofertas"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Inicia (opcional)
              </label>
              <input
                name="starts_at"
                type="datetime-local"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Termina (opcional)
              </label>
              <input
                name="ends_at"
                type="datetime-local"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-gray-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Orden
              </label>
              <input
                name="sort_order"
                type="number"
                defaultValue={0}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-gray-900"
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  name="is_active"
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-0"
                />
                <span className="text-sm font-medium text-gray-700">Activo</span>
              </label>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-gray-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Crear banner"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-full border border-gray-200 px-6 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
