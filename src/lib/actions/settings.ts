"use server"

import { createClient } from "@/lib/supabase/server"

export type SettingsMap = Record<string, string>

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

export async function updateSetting(key: string, value: string) {
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

  const { error } = await supabase.from("settings").upsert({ key, value }, { onConflict: "key" })

  if (error) throw new Error(error.message)
}
