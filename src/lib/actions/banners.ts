"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const bannerSchema = z.object({
  title: z.string().nullable().optional(),
  subtitle: z.string().nullable().optional(),
  image_url: z.string().min(1, "Imagen requerida"),
  mobile_image_url: z.string().nullable().optional(),
  link_url: z.string().nullable().optional(),
  link_text: z.string().nullable().optional(),
  is_active: z.preprocess((v) => {
    if (v === null || v === undefined) return false
    if (v === "false" || v === false) return false
    return true
  }, z.boolean()),
  sort_order: z.coerce.number().int().default(0),
  starts_at: z.string().nullable().optional(),
  ends_at: z.string().nullable().optional(),
})

export type BannerFormData = z.infer<typeof bannerSchema>

export async function getBanners() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("banners")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export async function getBanner(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("banners")
    .select("*")
    .eq("id", id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function createBanner(formData: FormData) {
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
    title: (formData.get("title") as string)?.trim() || null,
    subtitle: (formData.get("subtitle") as string)?.trim() || null,
    image_url: formData.get("image_url") as string,
    mobile_image_url: (formData.get("mobile_image_url") as string)?.trim() || null,
    link_url: (formData.get("link_url") as string)?.trim() || null,
    link_text: (formData.get("link_text") as string)?.trim() || null,
    is_active: formData.get("is_active"),
    sort_order: formData.get("sort_order") || 0,
    starts_at: (formData.get("starts_at") as string) || null,
    ends_at: (formData.get("ends_at") as string) || null,
  }

  const validated = bannerSchema.parse(raw)

  const { error } = await supabase.from("banners").insert({
    ...validated,
    starts_at: validated.starts_at || null,
    ends_at: validated.ends_at || null,
  })

  if (error) throw new Error(error.message)

  revalidatePath("/admin/banners")
  revalidatePath("/")
}

export async function updateBanner(id: string, formData: FormData) {
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
    title: (formData.get("title") as string)?.trim() || null,
    subtitle: (formData.get("subtitle") as string)?.trim() || null,
    image_url: formData.get("image_url") as string,
    mobile_image_url: (formData.get("mobile_image_url") as string)?.trim() || null,
    link_url: (formData.get("link_url") as string)?.trim() || null,
    link_text: (formData.get("link_text") as string)?.trim() || null,
    is_active: formData.get("is_active"),
    sort_order: formData.get("sort_order") || 0,
    starts_at: (formData.get("starts_at") as string) || null,
    ends_at: (formData.get("ends_at") as string) || null,
  }

  const validated = bannerSchema.parse(raw)

  const { error } = await supabase
    .from("banners")
    .update({
      ...validated,
      starts_at: validated.starts_at || null,
      ends_at: validated.ends_at || null,
    })
    .eq("id", id)

  if (error) throw new Error(error.message)

  revalidatePath("/admin/banners")
  revalidatePath("/admin/banners/" + id)
  revalidatePath("/")
}

export async function deleteBanner(id: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No autorizado")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") throw new Error("No autorizado")

  const { error } = await supabase.from("banners").delete().eq("id", id)

  if (error) throw new Error(error.message)

  revalidatePath("/admin/banners")
  revalidatePath("/")
}

export async function toggleBanner(id: string, isActive: boolean) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No autorizado")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") throw new Error("No autorizado")

  const { error } = await supabase
    .from("banners")
    .update({ is_active: isActive })
    .eq("id", id)

  if (error) throw new Error(error.message)

  revalidatePath("/admin/banners")
  revalidatePath("/")
}
