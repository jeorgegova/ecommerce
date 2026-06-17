"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  parent_id: string | null
  sort_order: number
  is_active: boolean
}

export default function NewCategoryPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [description, setDescription] = useState("")
  const [parentId, setParentId] = useState("")
  const [sortOrder, setSortOrder] = useState(0)
  const [isActive, setIsActive] = useState(true)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order")
      setCategories(data || [])
    }
    fetchCategories()
  }, [supabase])

  const generateSlug = (val: string) => {
    const s = val
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim()
    setSlug(s)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const { error: err } = await supabase.from("categories").insert({
      name,
      slug,
      description: description || null,
      parent_id: parentId || null,
      sort_order: sortOrder,
      is_active: isActive,
    })

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    router.push("/admin/categories")
    router.refresh()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Nueva Categoría</h1>

      <form onSubmit={handleSubmit} className="mt-8 max-w-lg space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">Nombre</label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              generateSlug(e.target.value)
            }}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Slug</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Descripción</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Categoría Padre</label>
          <select
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          >
            <option value="">Ninguna (raíz)</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Orden</label>
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
          />
          <label htmlFor="isActive" className="text-sm text-gray-700">
            Activa
          </label>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-gray-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Crear Categoría"}
          </button>
          <a
            href="/admin/categories"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Cancelar
          </a>
        </div>
      </form>
    </div>
  )
}
