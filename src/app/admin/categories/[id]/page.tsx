"use client"

import { createClient } from "@/lib/supabase/client"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  parent_id: string | null
  level: number
  sort_order: number
  is_active: boolean
}

export default function EditCategoryPage() {
  const { id } = useParams<{ id: string }>()
  const [categories, setCategories] = useState<Category[]>([])
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [description, setDescription] = useState("")
  const [parentId, setParentId] = useState("")
  const [sortOrder, setSortOrder] = useState(0)
  const [isActive, setIsActive] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)
  const [original, setOriginal] = useState<{ name: string; slug: string; description: string; parentId: string; sortOrder: number; isActive: boolean } | null>(null)
  const [confirmNavigation, setConfirmNavigation] = useState<(() => void) | null>(null)
  const dirtyRef = useRef(false)
  const router = useRouter()
  const supabase = createClient()

  const isDirty = original !== null && (
    name !== original.name ||
    slug !== original.slug ||
    description !== original.description ||
    parentId !== original.parentId ||
    sortOrder !== original.sortOrder ||
    isActive !== original.isActive
  )

  useEffect(() => {
    if (!isDirty || success) {
      if (dirtyRef.current) {
        window.history.back()
        dirtyRef.current = false
      }
      return
    }

    const beforeUnloadHandler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", beforeUnloadHandler)

    if (!dirtyRef.current) {
      window.history.pushState({ dirty: true }, "")
      dirtyRef.current = true
    }

    const popStateHandler = () => {
      window.history.pushState({ dirty: true }, "")
      setConfirmNavigation(() => () => {
        dirtyRef.current = false
        window.history.back()
      })
    }
    window.addEventListener("popstate", popStateHandler)

    return () => {
      window.removeEventListener("beforeunload", beforeUnloadHandler)
      window.removeEventListener("popstate", popStateHandler)
    }
  }, [isDirty, success])

  useEffect(() => {
    const fetchData = async () => {
      const { data: cat } = await supabase
        .from("categories")
        .select("*")
        .eq("id", id)
        .single()

      const { data: cats } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order")
        .order("name")

      if (cat) {
        setName(cat.name)
        setSlug(cat.slug)
        setDescription(cat.description || "")
        setParentId(cat.parent_id || "")
        setSortOrder(cat.sort_order)
        setIsActive(cat.is_active)
        setOriginal({
          name: cat.name,
          slug: cat.slug,
          description: cat.description || "",
          parentId: cat.parent_id || "",
          sortOrder: cat.sort_order,
          isActive: cat.is_active,
        })
      }

      setCategories(cats?.filter((c) => c.id !== id) || [])
      setLoading(false)
    }
    fetchData()
  }, [supabase, id])

  const navigateAway = (href: string) => {
    if (isDirty && !success) {
      setConfirmNavigation(() => () => router.push(href))
    } else {
      router.push(href)
    }
  }

  const slugify = (val: string) =>
    val
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim()

  const handleNameChange = (val: string) => {
    setName(val)
    setSlug(slugify(val))
  }

  const buildTree = (items: Category[], parentId: string | null = null, depth = 0): (Category & { displayName: string })[] => {
    return items
      .filter((item) => item.parent_id === parentId)
      .flatMap((item) => [
        { ...item, displayName: `${"\u00A0\u00A0".repeat(depth)}${depth > 0 ? "— " : ""}${item.name}` },
        ...buildTree(items, item.id, depth + 1),
      ])
  }

  const parentOptions = buildTree(categories)

  const siblings = useMemo(() => {
    const sameParent = (parentId || null) === null ? null : (parentId || null)
    return categories
      .filter((c) => (c.parent_id || null) === sameParent)
      .sort((a, b) => a.sort_order - b.sort_order)
  }, [categories, parentId])

  const currentPositionIndex = useMemo(() => {
    if (siblings.length === 0) return 0
    const idx = siblings.findIndex((s) => s.sort_order >= sortOrder)
    return idx === -1 ? siblings.length : idx
  }, [siblings, sortOrder])

  const positionLabel = useMemo(() => {
    if (siblings.length === 0) return "única"
    if (sortOrder <= siblings[0].sort_order) return "primera"
    if (sortOrder > siblings[siblings.length - 1].sort_order) return "última"
    const after = [...siblings].reverse().find((s) => s.sort_order < sortOrder)
    return after ? `después de ${after.name}` : "primera"
  }, [siblings, sortOrder])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")
    setSuccess(false)

    const { error: err } = await supabase
      .from("categories")
      .update({
        name,
        slug,
        description: description || null,
        parent_id: parentId || null,
        sort_order: Math.round(sortOrder),
        is_active: isActive,
      })
      .eq("id", id)

    if (err) {
      setError(err.message)
      setSaving(false)
      return
    }

    setSuccess(true)
    setSaving(false)
    setTimeout(() => {
      router.push("/admin/categories")
      router.refresh()
    }, 800)
  }

  const handleDelete = async () => {
    setDeleting(true)
    setError("")

    const { error: err } = await supabase.from("categories").delete().eq("id", id)

    if (err) {
      setError(err.message)
      setDeleting(false)
      return
    }

    router.push("/admin/categories")
    router.refresh()
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 rounded bg-gray-200" />
          <div className="h-4 w-24 rounded bg-gray-200" />
          <div className="h-4 w-3 rounded bg-gray-200" />
          <div className="h-7 w-40 rounded bg-gray-200" />
        </div>
        <div className="rounded-xl border border-gray-200 p-6 space-y-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-16 rounded bg-gray-200" />
              <div className="h-10 w-full rounded-lg bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-2 text-sm">
        <button
          type="button"
          onClick={() => navigateAway("/admin/categories")}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => navigateAway("/admin/categories")}
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          Categorías
        </button>
        <span className="text-gray-300">/</span>
        <span className="font-medium text-gray-900">Editar</span>
      </div>

      <h1 className="mt-3 text-2xl font-bold text-gray-900">{name || "Editar Categoría"}</h1>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6 max-w-xl">
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <svg className="mt-0.5 h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            Categoría actualizada correctamente. Redirigiendo...
          </div>
        )}

        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
            Información básica
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nombre
            </label>
            <p className="mb-1.5 text-xs text-gray-400">
              Nombre visible de la categoría para tus clientes.
            </p>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              placeholder="Ej: Filtros de Agua"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              URL de la categoría
            </label>
            <p className="mb-1.5 text-xs text-gray-400">
              El slug se genera automáticamente a partir del nombre.
            </p>
            <div className="mt-1 flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
              <span className="text-gray-400">/categories/</span>
              <span className="font-mono font-medium text-gray-700">{slug || "..."}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Descripción
            </label>
            <p className="mb-1.5 text-xs text-gray-400">
              Texto opcional que describe esta categoría. Puede mostrarse en la página de la categoría.
            </p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              placeholder="Describe brevemente esta categoría..."
            />
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
            Jerarquía y orden
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Categoría Padre
            </label>
            <p className="mb-1.5 text-xs text-gray-400">
              Selecciona una categoría superior para convertir esta en una subcategoría, o déjala vacía para que sea una categoría raíz.
            </p>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            >
              <option value="">Ninguna (categoría raíz)</option>
              {parentOptions.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.displayName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Posición entre sus hermanas
            </label>
            <p className="mb-1.5 text-xs text-gray-400">
              Arrastra esta categoría o usa los botones para reordenarla entre sus hermanas del mismo nivel.
            </p>

            {siblings.length === 0 ? (
              <div className="mt-2 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-center text-sm text-gray-400">
                No hay otras categorías en este nivel. Será la única.
              </div>
            ) : (
              <div className="mt-2 overflow-hidden rounded-lg border border-gray-200">
                {siblings.map((sibling, idx) => {
                  const isCurrentHere = sibling.sort_order >= sortOrder && currentPositionIndex === idx
                  return (
                    <div key={sibling.id}>
                      {isCurrentHere && (
                        <div
                          draggable
                          onDragStart={() => setDragOverIdx(null)}
                          onDragEnd={() => setDragOverIdx(null)}
                          className="group flex items-center border-y-2 border-gray-900 bg-gray-900/5 px-4 py-2.5 cursor-grab active:cursor-grabbing"
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <svg className="h-4 w-4 flex-shrink-0 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
                            </svg>
                            <span className="text-sm font-semibold text-gray-900">{name || "Esta categoría"}</span>
                            <span className="text-xs text-gray-500">(posición actual)</span>
                          </div>
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={() => {
                                const prev = siblings[idx - 1]
                                if (prev) setSortOrder(prev.sort_order - 0.5)
                              }}
                              disabled={idx === 0}
                              className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              title="Mover arriba"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const current = siblings[idx]
                                if (current) setSortOrder(current.sort_order + 0.5)
                              }}
                              className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-colors"
                              title="Mover abajo"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}
                      <div
                        onDragOver={(e) => {
                          e.preventDefault()
                          setDragOverIdx(idx)
                        }}
                        onDragLeave={() => setDragOverIdx(null)}
                        onDrop={(e) => {
                          e.preventDefault()
                          setDragOverIdx(null)
                          setSortOrder(sibling.sort_order + 0.5)
                        }}
                        className={`flex items-center px-4 py-2.5 transition-colors ${
                          dragOverIdx === idx ? "bg-blue-50" : ""
                        } ${isCurrentHere ? "" : "border-b border-gray-100 last:border-b-0"}`}
                      >
                        <span className="flex-1 text-sm text-gray-600">{sibling.name}</span>
                        {dragOverIdx === idx && (
                          <span className="text-xs text-blue-500 font-medium">Soltar aquí</span>
                        )}
                      </div>
                    </div>
                  )
                })}
                {currentPositionIndex >= siblings.length && (
                  <div
                    draggable
                    onDragStart={() => setDragOverIdx(null)}
                    onDragEnd={() => setDragOverIdx(null)}
                    className="group flex items-center border-t-2 border-gray-900 bg-gray-900/5 px-4 py-2.5 cursor-grab active:cursor-grabbing"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <svg className="h-4 w-4 flex-shrink-0 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
                      </svg>
                      <span className="text-sm font-semibold text-gray-900">{name || "Esta categoría"}</span>
                      <span className="text-xs text-gray-500">(posición actual)</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          const prev = siblings[siblings.length - 1]
                          if (prev) setSortOrder(prev.sort_order - 0.5)
                        }}
                        className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-colors"
                        title="Mover arriba"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        disabled
                        className="rounded p-1 text-gray-300 disabled:cursor-not-allowed"
                        title="Mover abajo"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            <p className="mt-2 text-xs text-gray-400">
              Posición actual: <span className="font-medium text-gray-600">{positionLabel}</span>
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
            Visibilidad
          </h2>

          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                Categoría activa
              </label>
              <p className="text-xs text-gray-400">
                {isActive
                  ? "Visible para los clientes en la tienda."
                  : "Oculta para los clientes. No aparecerá en menús ni listados."}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isActive}
              id="isActive"
              onClick={() => setIsActive(!isActive)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 ${
                isActive ? "bg-gray-900" : "bg-gray-200"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isActive ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {saving ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Guardando...
              </>
            ) : (
              "Guardar Cambios"
            )}
          </button>
          <button
            type="button"
            onClick={() => navigateAway("/admin/categories")}
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Cancelar
          </button>
        </div>

        <div className="rounded-xl border border-red-200 bg-white p-6 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-red-500">
            Zona de peligro
          </h2>
          <p className="text-sm text-gray-600">
            Eliminar esta categoría es permanente. Las subcategorías que dependan de ella pasarán a ser categorías raíz.
            Los productos en esta categoría quedarán sin categoría asignada.
          </p>
          {deleteConfirm ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleting ? "Eliminando..." : "Sí, eliminar"}
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirm(false)}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setDeleteConfirm(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
              Eliminar categoría
            </button>
          )}
        </div>
      </form>

      {confirmNavigation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-start gap-3">
              <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Cambios sin guardar</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Tenés cambios que no se guardaron. Si salís ahora, se perderán.
                </p>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmNavigation(null)}
                className="rounded-full px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  dirtyRef.current = false
                  const fn = confirmNavigation
                  setConfirmNavigation(null)
                  fn()
                }}
                className="rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
              >
                Salir sin guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
