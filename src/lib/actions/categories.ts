"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const categorySchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  slug: z.string().min(1, "El slug es requerido"),
  description: z.string().optional(),
  parent_id: z.string().uuid().nullable().optional(),
  sort_order: z.coerce.number().int().default(0),
  is_active: z.boolean().default(true),
})

export async function getCategories() {
  const supabase = await createClient()

  const { data: categories, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })

  if (error) throw new Error(error.message)
  return categories
}

export async function getCategoryTree() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("category_tree")
    .select("*")
    .order("path")

  if (error) throw new Error(error.message)
  return data
}

export async function getCategory(id: string) {
  const supabase = await createClient()

  const { data: category, error } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .single()

  if (error) throw new Error(error.message)
  return category
}

export async function getCategoryBySlug(slug: string) {
  const supabase = await createClient()

  const { data: category, error } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .single()

  if (error) throw new Error(error.message)
  return category
}

export async function createCategory(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
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
    description: (formData.get("description") as string) || null,
    parent_id: (formData.get("parent_id") as string) || null,
    sort_order: Number(formData.get("sort_order")) || 0,
    is_active: formData.get("is_active") === "true",
  }

  const validated = categorySchema.parse(raw)

  const { error } = await supabase.from("categories").insert({
    name: validated.name,
    slug: validated.slug,
    description: validated.description || null,
    parent_id: validated.parent_id || null,
    sort_order: validated.sort_order,
    is_active: validated.is_active,
  })

  if (error) throw new Error(error.message)

  revalidatePath("/admin/categories")
  revalidatePath("/")
}

export async function updateCategory(id: string, formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
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
    description: (formData.get("description") as string) || null,
    parent_id: (formData.get("parent_id") as string) || null,
    sort_order: Number(formData.get("sort_order")) || 0,
    is_active: formData.get("is_active") === "true",
  }

  const validated = categorySchema.parse(raw)

  const { error } = await supabase
    .from("categories")
    .update({
      name: validated.name,
      slug: validated.slug,
      description: validated.description || null,
      parent_id: validated.parent_id || null,
      sort_order: validated.sort_order,
      is_active: validated.is_active,
    })
    .eq("id", id)

  if (error) throw new Error(error.message)

  revalidatePath("/admin/categories")
  revalidatePath("/")
}

export async function deleteCategory(id: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("No autorizado")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") throw new Error("No autorizado")

  const { error } = await supabase.from("categories").delete().eq("id", id)

  if (error) throw new Error(error.message)

  revalidatePath("/admin/categories")
  revalidatePath("/")
}

export async function generateSlug(name: string): Promise<string> {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
}
