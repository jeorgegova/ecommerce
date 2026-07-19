"use client"

import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toggleBanner, deleteBanner } from "@/lib/actions/banners"

interface Banner {
  id: string
  title: string | null
  image_url: string
  is_active: boolean
  sort_order: number
  starts_at: string | null
  ends_at: string | null
  link_url: string | null
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  const fetchBanners = useCallback(async () => {
    const { data } = await supabase
      .from("banners")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
    if (data) setBanners(data)
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchBanners()
  }, [fetchBanners])

  const handleToggle = async (id: string, current: boolean) => {
    await toggleBanner(id, !current)
    fetchBanners()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este banner?")) return
    await deleteBanner(id)
    fetchBanners()
  }

  const isActive = (b: Banner) => {
    const now = new Date()
    if (!b.is_active) return false
    if (b.starts_at && new Date(b.starts_at) > now) return false
    if (b.ends_at && new Date(b.ends_at) < now) return false
    return true
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl animate-pulse space-y-4">
        <div className="h-8 w-32 rounded bg-gray-200" />
        <div className="h-64 rounded-xl border border-gray-200 bg-white" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Gestión
          </h2>
          <p className="mt-1 text-2xl font-bold text-gray-900">Banners</p>
        </div>
        <Link
          href="/admin/banners/new"
          className="inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nuevo banner
        </Link>
      </div>

      {banners.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6.75c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6.75A1.125 1.125 0 012.25 10.875v-3.75zM5.25 18.75h13.5M5.25 18.75v-3.75M18.75 18.75v-3.75M20.25 15.75H3.75a1.125 1.125 0 01-1.125-1.125v-3.75" />
            </svg>
          </div>
          <h3 className="mt-4 text-sm font-semibold text-gray-900">No hay banners</h3>
          <p className="mt-1 text-sm text-gray-500">Crea tu primer banner promocional</p>
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((banner) => (
            <div
              key={banner.id}
              className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 transition-all hover:shadow-sm"
            >
              <div className="h-16 w-28 shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:h-20 sm:w-36">
                <img
                  src={banner.image_url}
                  alt={banner.title || ""}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-gray-900 truncate">
                    {banner.title || "Sin título"}
                  </h4>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      isActive(banner)
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {isActive(banner) ? "Activo" : "Inactivo"}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-gray-500">
                  Orden: {banner.sort_order}
                  {banner.link_url && ` · Enlace: ${banner.link_url}`}
                </p>
                {(banner.starts_at || banner.ends_at) && (
                  <p className="mt-0.5 text-[11px] text-gray-400">
                    {banner.starts_at && `Desde: ${new Date(banner.starts_at).toLocaleDateString("es-CO")}`}
                    {banner.starts_at && banner.ends_at && " · "}
                    {banner.ends_at && `Hasta: ${new Date(banner.ends_at).toLocaleDateString("es-CO")}`}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggle(banner.id, banner.is_active)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    banner.is_active
                      ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                  }`}
                >
                  {banner.is_active ? "Desactivar" : "Activar"}
                </button>
                <Link
                  href={`/admin/banners/${banner.id}`}
                  className="rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100"
                >
                  Editar
                </Link>
                <button
                  onClick={() => handleDelete(banner.id)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
