"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const productSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  slug: z.string().min(1, "Slug requerido"),
  sku: z.string().min(1, "SKU requerido"),
  internal_code: z.string().optional(),
  short_description: z.string().optional(),
  long_description: z.string().optional(),
  technical_specs: z.string().optional(),
  category_id: z.string().uuid("Categoría inválida"),
  base_price: z.coerce.number().min(0, "Precio inválido"),
  sale_price: z.coerce.number().min(0).optional().nullable(),
  cost_price: z.coerce.number().min(0).optional().nullable(),
  stock: z.coerce.number().int().min(0).default(0),
  has_variants: z.boolean().default(false),
  status: z.enum(["draft", "active", "inactive", "discontinued"]).default("draft"),
  is_featured: z.boolean().default(false),
  weight: z.coerce.number().optional().nullable(),
  width: z.coerce.number().optional().nullable(),
  height: z.coerce.number().optional().nullable(),
  length: z.coerce.number().optional().nullable(),
})

export async function getProducts() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("products")
    .select("*, categories(name)")
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export async function getProduct(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("products")
    .select("*, categories(name, slug)")
    .eq("id", id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function getProductBySlug(slug: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("product_listing")
    .select("*")
    .eq("slug", slug)
    .single()

  if (error) throw new Error(error.message)
  return data
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
}

export async function createProduct(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No autorizado")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") throw new Error("No autorizado")

  const raw = {
    name: formData.get("name") as string,
    slug: formData.get("slug") as string || slugify(formData.get("name") as string),
    sku: formData.get("sku") as string,
    internal_code: (formData.get("internal_code") as string) || null,
    short_description: (formData.get("short_description") as string) || null,
    long_description: (formData.get("long_description") as string) || null,
    technical_specs: (formData.get("technical_specs") as string) || null,
    category_id: formData.get("category_id") as string,
    base_price: formData.get("base_price"),
    sale_price: formData.get("sale_price") || null,
    cost_price: formData.get("cost_price") || null,
    stock: formData.get("stock") || 0,
    has_variants: formData.get("has_variants") === "true",
    status: (formData.get("status") as string) || "draft",
    is_featured: formData.get("is_featured") === "true",
    weight: formData.get("weight") || null,
    width: formData.get("width") || null,
    height: formData.get("height") || null,
    length: formData.get("length") || null,
  }

  const validated = productSchema.parse(raw)

  const { error } = await supabase.from("products").insert({
    ...validated,
    sale_price: validated.sale_price || null,
    cost_price: validated.cost_price || null,
  })

  if (error) throw new Error(error.message)

  revalidatePath("/admin/products")
  revalidatePath("/products")
}

export async function updateProduct(id: string, formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No autorizado")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") throw new Error("No autorizado")

  const raw = {
    name: formData.get("name") as string,
    slug: formData.get("slug") as string,
    sku: formData.get("sku") as string,
    internal_code: (formData.get("internal_code") as string) || null,
    short_description: (formData.get("short_description") as string) || null,
    long_description: (formData.get("long_description") as string) || null,
    technical_specs: (formData.get("technical_specs") as string) || null,
    category_id: formData.get("category_id") as string,
    base_price: formData.get("base_price"),
    sale_price: formData.get("sale_price") || null,
    cost_price: formData.get("cost_price") || null,
    stock: formData.get("stock") || 0,
    has_variants: formData.get("has_variants") === "true",
    status: (formData.get("status") as string) || "draft",
    is_featured: formData.get("is_featured") === "true",
    weight: formData.get("weight") || null,
    width: formData.get("width") || null,
    height: formData.get("height") || null,
    length: formData.get("length") || null,
  }

  const validated = productSchema.parse(raw)

  const { error } = await supabase
    .from("products")
    .update({
      ...validated,
      sale_price: validated.sale_price || null,
      cost_price: validated.cost_price || null,
    })
    .eq("id", id)

  if (error) throw new Error(error.message)

  revalidatePath("/admin/products")
  revalidatePath("/admin/products/" + id)
  revalidatePath("/products")
}

export async function deleteProduct(id: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No autorizado")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") throw new Error("No autorizado")

  const { error } = await supabase.from("products").delete().eq("id", id)

  if (error) throw new Error(error.message)

  revalidatePath("/admin/products")
  revalidatePath("/products")
}

export async function generateSlug(name: string): Promise<string> {
  return slugify(name)
}
