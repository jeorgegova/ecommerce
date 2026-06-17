"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  parent_id: string | null
  level: number
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true })

      setCategories(data || [])
      setLoading(false)
    }
    fetchCategories()
  }, [supabase])

  const buildTree = (items: Category[], parentId: string | null = null, depth = 0): (Category & { displayName: string })[] => {
    return items
      .filter((item) => item.parent_id === parentId)
      .flatMap((item) => [
        {
          ...item,
          displayName: `${"\u00A0".repeat(depth * 4)}${depth > 0 ? "└ " : ""}${item.name}`,
        },
        ...buildTree(items, item.id, depth + 1),
      ])
  }

  const tree = buildTree(categories)

  if (loading) {
    return <p className="text-gray-600">Cargando...</p>
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categorías</h1>
          <p className="mt-1 text-sm text-gray-600">
            {categories.length} categorías
          </p>
        </div>
        <a
          href="/admin/categories/new"
          className="rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Nueva Categoría
        </a>
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Slug
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Estado
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Orden
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {tree.map((category) => (
              <tr key={category.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                  <span style={{ fontFamily: "monospace" }}>{category.displayName}</span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {category.slug}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      category.is_active
                        ? "bg-green-50 text-green-700"
                        : "bg-gray-50 text-gray-500"
                    }`}
                  >
                    {category.is_active ? "Activa" : "Inactiva"}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-500">
                  {category.sort_order}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                  <a
                    href={`/admin/categories/${category.id}`}
                    className="font-medium text-gray-900 hover:text-gray-600"
                  >
                    Editar
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
