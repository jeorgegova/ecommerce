"use client"

import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
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
  const [productCounts, setProductCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: cats }, { data: products }] = await Promise.all([
        supabase
          .from("categories")
          .select("*")
          .order("sort_order", { ascending: true })
          .order("name", { ascending: true }),
        supabase.from("products").select("category_id"),
      ])

      setCategories(cats || [])

      const counts: Record<string, number> = {}
      if (products) {
        for (const p of products) {
          if (p.category_id) {
            counts[p.category_id] = (counts[p.category_id] || 0) + 1
          }
        }
      }

      const countIncludingChildren = (catId: string): number => {
        let total = counts[catId] || 0
        for (const child of (cats || []).filter((c) => c.parent_id === catId)) {
          total += countIncludingChildren(child.id)
        }
        return total
      }

      const finalCounts: Record<string, number> = {}
      for (const cat of cats || []) {
        finalCounts[cat.id] = countIncludingChildren(cat.id)
      }
      setProductCounts(finalCounts)
      setLoading(false)
    }
    fetchData()
  }, [supabase])

  const buildTree = (
    items: Category[],
    parentId: string | null = null,
    depth = 0
  ): (Category & { depth: number; isLastChild: boolean })[] => {
    const children = items.filter((item) => item.parent_id === parentId)
    return children.flatMap((item, index) => {
      const isLast = index === children.length - 1
      return [
        { ...item, depth, isLastChild: isLast },
        ...buildTree(items, item.id, depth + 1),
      ]
    })
  }

  const tree = buildTree(categories)

  const activeCount = categories.filter((c) => c.is_active).length
  const rootCount = categories.filter((c) => !c.parent_id).length

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-7 w-32 rounded bg-gray-200" />
            <div className="h-4 w-48 rounded bg-gray-200" />
          </div>
          <div className="h-9 w-36 rounded-full bg-gray-200" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-gray-200 p-5">
              <div className="h-4 w-20 rounded bg-gray-200" />
              <div className="mt-2 h-7 w-12 rounded bg-gray-200" />
            </div>
          ))}
        </div>
        <div className="overflow-hidden rounded-xl border border-gray-200">
          <div className="divide-y divide-gray-200">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-6 px-6 py-4">
                <div className="h-4 w-32 rounded bg-gray-200" />
                <div className="h-4 w-24 rounded bg-gray-200" />
                <div className="h-5 w-14 rounded-full bg-gray-200" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">
            Organiza tus productos en categorías y subcategorías para que los clientes encuentren todo más fácil.
          </p>
        </div>
        <Link
          href="/admin/categories/new"
          className="inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nueva Categoría
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
            Total Categorías
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{categories.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
            Activas
          </p>
          <p className="mt-1 text-2xl font-bold text-green-600">{activeCount}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
            Categorías Raíz
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{rootCount}</p>
        </div>
      </div>

      {categories.length === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
          <svg className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
          </svg>
          <h2 className="mt-4 text-lg font-semibold text-gray-900">No hay categorías aún</h2>
          <p className="mt-1 max-w-sm text-sm text-gray-500">
            Crea tu primera categoría para empezar a organizar tu tienda. Las categorías ayudan a tus clientes a navegar y encontrar productos.
          </p>
          <Link
            href="/admin/categories/new"
            className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Crear Primera Categoría
          </Link>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Nivel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Productos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {tree.map((category) => (
                <tr
                  key={category.id}
                  className={`hover:bg-gray-50 transition-colors ${category.depth === 0
                      ? "bg-white"
                      : category.depth === 1
                        ? "bg-gray-50/40"
                        : "bg-gray-100/60"
                    }`}
                >
                  <td className="px-6 py-3.5 text-sm font-medium text-gray-900">
                    <div className="flex items-center">
                      {category.depth > 0 && (
                        <span className="mr-1 select-none font-mono text-xs text-gray-300">
                          {"\u00A0".repeat(category.depth * 2)}
                          {category.isLastChild ? "\u2514 " : "\u251C "}
                        </span>
                      )}
                      <span className={category.depth === 0 ? "font-semibold" : ""}>
                        {category.name}
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-3.5">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${category.depth === 0
                          ? "bg-blue-50 text-blue-700"
                          : "bg-gray-50 text-gray-500"
                        }`}
                    >
                      {category.depth === 0 ? "Raíz" : `Nivel ${category.depth}`}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-3.5">
                    <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                      <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                      </svg>
                      {productCounts[category.id] ?? 0}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${category.is_active
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-600"
                        }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${category.is_active ? "bg-green-500" : "bg-red-400"
                          }`}
                      />
                      {category.is_active ? "Activa" : "Inactiva"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-3.5 text-right text-sm">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/categories/${category.slug}`}
                        className="font-medium text-gray-400 hover:text-gray-600 transition-colors"
                        title="Ver en la tienda"
                      >
                        Ver
                      </Link>
                      <Link
                        href={`/admin/categories/${category.id}`}
                        className="font-medium text-gray-900 hover:text-gray-600 transition-colors"
                      >
                        Editar
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
