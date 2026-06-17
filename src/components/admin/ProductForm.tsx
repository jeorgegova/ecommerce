"use client"

import ImageUpload from "@/components/admin/ImageUpload"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"

interface Category {
  id: string
  name: string
  parent_id: string | null
  level: number
}

interface Product {
  id?: string
  name: string
  slug: string
  sku: string
  internal_code: string | null
  short_description: string | null
  long_description: string | null
  technical_specs: string | null
  category_id: string
  base_price: number
  sale_price: number | null
  cost_price: number | null
  stock: number
  has_variants: boolean
  status: string
  is_featured: boolean
  weight: number | null
  width: number | null
  height: number | null
  length: number | null
}

export default function ProductForm({ product }: { product?: Product }) {
  const isEdit = !!product
  const router = useRouter()
  const supabase = createClient()

  const [categories, setCategories] = useState<Category[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const [form, setForm] = useState({
    name: product?.name || "",
    slug: product?.slug || "",
    sku: product?.sku || "",
    internal_code: product?.internal_code || "",
    short_description: product?.short_description || "",
    long_description: product?.long_description || "",
    technical_specs: product?.technical_specs || "",
    category_id: product?.category_id || "",
    base_price: product?.base_price?.toString() || "",
    sale_price: product?.sale_price?.toString() || "",
    cost_price: product?.cost_price?.toString() || "",
    stock: product?.stock?.toString() || "0",
    has_variants: product?.has_variants || false,
    status: product?.status || "draft",
    is_featured: product?.is_featured || false,
    weight: product?.weight?.toString() || "",
    width: product?.width?.toString() || "",
    height: product?.height?.toString() || "",
    length: product?.length?.toString() || "",
  })

  const [images, setImages] = useState<Array<{
    url: string; alt: string; is_main: boolean; sort_order: number; width?: number; height?: number; file_size?: number
  }>>([])

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

  useEffect(() => {
    if (!isEdit || !product?.id) return
    const fetchImages = async () => {
      const { data } = await supabase
        .from("product_images")
        .select("*")
        .eq("product_id", product.id as string)
        .order("sort_order", { ascending: true })
      if (data) setImages(data)
    }
    fetchImages()
  }, [supabase, isEdit, product?.id])

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim()

  const handleNameChange = (name: string) => {
    setForm((prev) => ({
      ...prev,
      name,
      slug: isEdit ? prev.slug : slugify(name),
    }))
  }

  const buildTree = useCallback(
    (items: Category[], parentId: string | null = null, depth = 0): (Category & { displayName: string })[] => {
      return items
        .filter((item) => item.parent_id === parentId)
        .flatMap((item) => [
          { ...item, displayName: `${"\u00A0".repeat(depth * 2)}${item.name}` },
          ...buildTree(items, item.id, depth + 1),
        ])
    },
    []
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")

    const payload = {
      name: form.name,
      slug: form.slug,
      sku: form.sku,
      internal_code: form.internal_code || null,
      short_description: form.short_description || null,
      long_description: form.long_description || null,
      technical_specs: form.technical_specs || null,
      category_id: form.category_id,
      base_price: form.base_price,
      sale_price: form.sale_price || null,
      cost_price: form.cost_price || null,
      stock: form.stock,
      has_variants: form.has_variants,
      status: form.status,
      is_featured: form.is_featured,
      weight: form.weight || null,
      width: form.width || null,
      height: form.height || null,
      length: form.length || null,
    }

    let productId = product?.id as string | undefined

    if (isEdit && productId) {
      const { error: err } = await supabase
        .from("products")
        .update(payload)
        .eq("id", productId)

      if (err) {
        setError(err.message)
        setSaving(false)
        return
      }
    } else {
      const { data: newProduct, error: err } = await supabase
        .from("products")
        .insert(payload)
        .select("id")
        .single()

      if (err) {
        setError(err.message)
        setSaving(false)
        return
      }

      productId = newProduct.id
    }

    if (productId) {
      if (isEdit) {
        await supabase.from("product_images").delete().eq("product_id", productId)
      }

      if (images.length > 0) {
        const { error: imgErr } = await supabase.from("product_images").insert(
          images.map((img) => ({
            product_id: productId,
            url: img.url,
            alt: img.alt,
            is_main: img.is_main,
            sort_order: img.sort_order,
            width: img.width || null,
            height: img.height || null,
            file_size: img.file_size || null,
          }))
        )

        if (imgErr) console.error("Failed to save images:", imgErr)
      }
    }

    router.push("/admin/products")
    router.refresh()
  }

  const inputClass =
    "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
  const labelClass = "block text-sm font-medium text-gray-700"

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      <section>
        <h2 className="text-lg font-semibold text-gray-900">Información Básica</h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Nombre</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Slug</label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className={labelClass}>SKU</label>
            <input
              type="text"
              value={form.sku}
              onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Código Interno</label>
            <input
              type="text"
              value={form.internal_code}
              onChange={(e) => setForm((p) => ({ ...p, internal_code: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Categoría</label>
            <select
              value={form.category_id}
              onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value }))}
              className={inputClass}
              required
            >
              <option value="">Seleccionar categoría</option>
              {buildTree(categories).map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.displayName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Estado</label>
            <select
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
              className={inputClass}
            >
              <option value="draft">Borrador</option>
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
              <option value="discontinued">Descontinuado</option>
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className={labelClass}>Descripción Corta</label>
          <textarea
            value={form.short_description}
            onChange={(e) => setForm((p) => ({ ...p, short_description: e.target.value }))}
            rows={2}
            className={inputClass}
          />
        </div>

        <div className="mt-4">
          <label className={labelClass}>Descripción Larga</label>
          <textarea
            value={form.long_description}
            onChange={(e) => setForm((p) => ({ ...p, long_description: e.target.value }))}
            rows={4}
            className={inputClass}
          />
        </div>

        <div className="mt-4">
          <label className={labelClass}>Ficha Técnica</label>
          <textarea
            value={form.technical_specs}
            onChange={(e) => setForm((p) => ({ ...p, technical_specs: e.target.value }))}
            rows={4}
            className={inputClass}
          />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">Precios y Stock</h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-4">
          <div>
            <label className={labelClass}>Precio Base</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.base_price}
              onChange={(e) => setForm((p) => ({ ...p, base_price: e.target.value }))}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Precio Promoción</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.sale_price}
              onChange={(e) => setForm((p) => ({ ...p, sale_price: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Costo</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.cost_price}
              onChange={(e) => setForm((p) => ({ ...p, cost_price: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Stock</label>
            <input
              type="number"
              min="0"
              value={form.stock}
              onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">Dimensiones y Peso</h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-4">
          <div>
            <label className={labelClass}>Peso (kg)</label>
            <input
              type="number"
              step="0.01"
              value={form.weight}
              onChange={(e) => setForm((p) => ({ ...p, weight: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Ancho (cm)</label>
            <input
              type="number"
              step="0.01"
              value={form.width}
              onChange={(e) => setForm((p) => ({ ...p, width: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Alto (cm)</label>
            <input
              type="number"
              step="0.01"
              value={form.height}
              onChange={(e) => setForm((p) => ({ ...p, height: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Largo (cm)</label>
            <input
              type="number"
              step="0.01"
              value={form.length}
              onChange={(e) => setForm((p) => ({ ...p, length: e.target.value }))}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">Imágenes</h2>
        <p className="mt-1 text-sm text-gray-500">
          Se comprimen y convierten a WebP automáticamente. Mínimo 1920px recomendado.
        </p>
        <div className="mt-4">
          <ImageUpload images={images} onChange={setImages} />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">Opciones</h2>
        <div className="mt-4 space-y-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.has_variants}
              onChange={(e) => setForm((p) => ({ ...p, has_variants: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
            />
            <span className="text-sm text-gray-700">
              Tiene variantes (talla, color, etc.)
            </span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={(e) => setForm((p) => ({ ...p, is_featured: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
            />
            <span className="text-sm text-gray-700">Producto destacado</span>
          </label>
        </div>
      </section>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-gray-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {saving ? "Guardando..." : isEdit ? "Guardar Cambios" : "Crear Producto"}
        </button>
        <a
          href="/admin/products"
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          Cancelar
        </a>
      </div>
    </form>
  )
}
