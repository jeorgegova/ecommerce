"use client"

import { createClient } from "@/lib/supabase/client"
import { DEFAULT_STORE_SETTINGS } from "@/lib/constants/settings"
import { useEffect, useState } from "react"

let cachedSettings: Record<string, any> | null = null
const subscribers = new Set<() => void>()

export function useStoreSettings() {
  const [settings, setSettings] = useState<Record<string, any>>(() => {
    if (cachedSettings) return cachedSettings
    const defaults: Record<string, any> = {}
    for (const item of DEFAULT_STORE_SETTINGS) {
      defaults[item.key] = item.value
    }
    return defaults
  })
  const [loading, setLoading] = useState(!cachedSettings)

  useEffect(() => {
    const handleUpdate = () => {
      if (cachedSettings) setSettings(cachedSettings)
    }
    subscribers.add(handleUpdate)

    if (!cachedSettings) {
      const supabase = createClient()
      supabase
        .from("settings")
        .select("key, value")
        .then(({ data, error }) => {
          if (!error && data) {
            const map: Record<string, any> = {}
            for (const def of DEFAULT_STORE_SETTINGS) {
              map[def.key] = def.value
            }
            for (const row of data) {
              map[row.key] = row.value
            }
            cachedSettings = map
            setSettings(map)
            subscribers.forEach((fn) => fn())
          }
          setLoading(false)
        })
    }

    return () => {
      subscribers.delete(handleUpdate)
    }
  }, [])

  return { settings, loading }
}
