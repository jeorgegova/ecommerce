"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { SettingItem, SettingsMap } from "@/lib/constants/settings"

export async function getSettings(keys: string[]): Promise<SettingsMap> {
  const supabase = await createClient()
  const { data } = await supabase.from("settings").select("key, value").in("key", keys)
  const map: SettingsMap = {}
  if (data) {
    for (const row of data) {
      map[row.key] = typeof row.value === "string" ? row.value : JSON.stringify(row.value)
    }
  }
  return map
}

export async function getAllSettings(): Promise<SettingsMap> {
  const supabase = await createClient()
  const { data } = await supabase.from("settings").select("key, value")
  const map: SettingsMap = {}
  if (data) {
    for (const row of data) {
      map[row.key] = typeof row.value === "string" ? row.value : JSON.stringify(row.value)
    }
  }
  return map
}

export async function getSettingsList(): Promise<SettingItem[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .order("key", { ascending: true })

  if (error) throw new Error(error.message)
  return data || []
}

export async function updateSetting(key: string, value: any, description?: string | null) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No autorizado")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") throw new Error("No autorizado")

  const payload: { key: string; value: any; description?: string | null } = { key, value }
  if (description !== undefined) {
    payload.description = description
  }

  const { error } = await supabase.from("settings").upsert(payload, { onConflict: "key" })
  if (error) throw new Error(error.message)

  revalidatePath("/admin/settings")
  revalidatePath("/")
}

export async function saveSettingsBatch(
  items: Array<{ key: string; value: any; description?: string | null }>
) {
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
    .from("settings")
    .upsert(items, { onConflict: "key" })

  if (error) throw new Error(error.message)

  revalidatePath("/admin/settings")
  revalidatePath("/")
  revalidatePath("/cart/checkout")
}

export async function deleteSetting(key: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No autorizado")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") throw new Error("No autorizado")

  const { error } = await supabase.from("settings").delete().eq("key", key)
  if (error) throw new Error(error.message)

  revalidatePath("/admin/settings")
}
