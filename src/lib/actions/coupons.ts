"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const couponSchema = z.object({
  code: z.string().min(2).max(32).transform((v) => v.trim().toUpperCase()),
  type: z.enum(["percentage", "fixed"]),
  value: z.coerce.number().positive(),
  min_order_amount: z.coerce.number().min(0).optional().nullable(),
  max_uses: z.coerce.number().int().positive().optional().nullable(),
  max_uses_per_user: z.coerce.number().int().positive().optional().nullable(),
  is_active: z.boolean().default(true),
  starts_at: z.string().optional().nullable(),
  ends_at: z.string().optional().nullable(),
}).refine((d) => d.type !== "percentage" || d.value <= 100, {
  message: "Porcentaje máximo 100",
  path: ["value"],
})

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("No autorizado")
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== "admin") throw new Error("No autorizado")
  return supabase
}

function parseDates(raw: Record<string, any>) {
  return {
    ...raw,
    starts_at: raw.starts_at ? new Date(raw.starts_at).toISOString() : null,
    ends_at: raw.ends_at ? new Date(raw.ends_at).toISOString() : null,
    min_order_amount: raw.min_order_amount || null,
    max_uses: raw.max_uses || null,
    max_uses_per_user: raw.max_uses_per_user || null,
  }
}

export async function getCoupons() {
  const supabase = await requireAdmin()
  const { data, error } = await supabase.from("coupons").select("*").order("created_at", { ascending: false })
  if (error) throw new Error(error.message)
  return data
}

export async function getCoupon(id: string) {
  const supabase = await requireAdmin()
  const { data, error } = await supabase.from("coupons").select("*").eq("id", id).single()
  if (error) throw new Error(error.message)
  return data
}

export async function createCoupon(formData: FormData) {
  const supabase = await requireAdmin()
  const raw = {
    code: formData.get("code") as string,
    type: formData.get("type") as string,
    value: formData.get("value"),
    min_order_amount: formData.get("min_order_amount") || null,
    max_uses: formData.get("max_uses") || null,
    max_uses_per_user: formData.get("max_uses_per_user") || null,
    is_active: formData.get("is_active") === "true",
    starts_at: (formData.get("starts_at") as string) || null,
    ends_at: (formData.get("ends_at") as string) || null,
  }
  const parsed = couponSchema.parse(raw)
  const payload = parseDates(parsed as any)
  const { error } = await supabase.from("coupons").insert(payload)
  if (error) throw new Error(error.message)
  revalidatePath("/admin/coupons")
}

export async function updateCoupon(id: string, formData: FormData) {
  const supabase = await requireAdmin()
  const raw = {
    code: formData.get("code") as string,
    type: formData.get("type") as string,
    value: formData.get("value"),
    min_order_amount: formData.get("min_order_amount") || null,
    max_uses: formData.get("max_uses") || null,
    max_uses_per_user: formData.get("max_uses_per_user") || null,
    is_active: formData.get("is_active") === "true",
    starts_at: (formData.get("starts_at") as string) || null,
    ends_at: (formData.get("ends_at") as string) || null,
  }
  const parsed = couponSchema.parse(raw)
  const payload = parseDates(parsed as any)
  const { error } = await supabase.from("coupons").update(payload).eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/admin/coupons")
  revalidatePath(`/admin/coupons/${id}`)
}

export async function deleteCoupon(id: string) {
  const supabase = await requireAdmin()
  const { error } = await supabase.from("coupons").delete().eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/admin/coupons")
}

export async function toggleCouponActive(id: string, is_active: boolean) {
  const supabase = await requireAdmin()
  const { error } = await supabase.from("coupons").update({ is_active }).eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/admin/coupons")
}

// Used from checkout (client via RPC, but also server action fallback)
export async function validateCouponCode(code: string, subtotal?: number) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data, error } = await supabase.rpc("validate_coupon", {
    p_code: code,
    p_user_id: user?.id || null,
    p_subtotal: subtotal ?? null,
  })
  if (error) throw new Error(error.message)
  // RPC returns table, take first row
  const row = Array.isArray(data) ? data[0] : data
  return row || null
}
