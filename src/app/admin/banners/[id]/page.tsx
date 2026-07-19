"use client"

import { createClient } from "@/lib/supabase/client"
import { updateBanner } from "@/lib/actions/banners"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface BannerData {
  title: string | null
  subtitle: string | null
  image_url: string
  mobile_image_url: string | null
  link_url: string | null
  link_text: string | null
  is_active: boolean
  sort_order: number
  starts_at: string | null
  ends_at: string | null
}

export default function EditBannerPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [banner, setBanner] = useState<BannerData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchBanner = async () => {
      const { data } = await supabase
        .from("banners")
        .select("*")
        .eq("id", id)
        .single()

      if (data) setBanner(data)
      setLoading(false)
    }
    fetchBanner()
  }, [supabase, id])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    setError("")

    try {
      await updateBanner(id, new FormData(e.currentTarget))
      router.push("/admin/banners")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl animate-pulse space-y-6">
        <div className="h-8 w-40 rounded bg-gray-200" />
        <div className="h-96 rounded-xl border border-gray-200 bg-white" />
      </div>
    )
  }

  if (!banner) {
    return (
      <div className="mx-auto max-w-2xl text-center py-12">
        <p className="text-gray-500">Banner no encontrado</p>
      </div>
    )
  }

  const toDateTimeLocal = (dateStr: string | null) => {
    if (!dateStr) return ""
    return new Date(dateStr).toISOString().slice(0, 16)
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Banners
        </h2>
        <p className="mt-1 text-2xl font-bold text-gray-900">Editar banner</p>
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
              defaultValue={banner.title || ""}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-gray-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
              Subtítulo
            </label>
            <input
              name="subtitle"
              type="text"
              defaultValue={banner.subtitle || ""}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-gray-900"
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
              defaultValue={banner.image_url}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-gray-900"
            />
            <div className="mt-2 h-24 w-full overflow-hidden rounded-lg bg-gray-100">
              <img
                src={banner.image_url}
                alt="Preview"
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
              URL de la imagen móvil (opcional)
            </label>
            <input
              name="mobile_image_url"
              type="text"
              defaultValue={banner.mobile_image_url || ""}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-gray-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                URL de enlace (opcional)
              </label>
              <input
                name="link_url"
                type="text"
                defaultValue={banner.link_url || ""}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Texto del botón
              </label>
              <input
                name="link_text"
                type="text"
                defaultValue={banner.link_text || ""}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-gray-900"
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
                defaultValue={toDateTimeLocal(banner.starts_at)}
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
                defaultValue={toDateTimeLocal(banner.ends_at)}
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
                defaultValue={banner.sort_order}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-gray-900"
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  name="is_active"
                  type="checkbox"
                  defaultChecked={banner.is_active}
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
            {saving ? "Guardando..." : "Guardar cambios"}
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
