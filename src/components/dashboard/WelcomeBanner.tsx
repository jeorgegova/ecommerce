"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export default function WelcomeBanner() {
  const [userName, setUserName] = useState("")
  const [dateTime, setDateTime] = useState("")
  const supabase = createClient()

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single()

        if (profile) {
          setUserName(profile.full_name || user.email?.split("@")[0] || "Admin")
        }
      }
    }
    fetchUser()

    const updateDateTime = () => {
      setDateTime(
        new Intl.DateTimeFormat("es-CO", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(new Date())
      )
    }
    updateDateTime()
    const interval = setInterval(updateDateTime, 60000)
    return () => clearInterval(interval)
  }, [supabase])

  return (
    <div className="flex items-start justify-between rounded-xl border border-gray-200 bg-white p-6">
      <div>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900 text-sm font-semibold text-white">
            {userName.charAt(0).toUpperCase() || "A"}
          </div>
          <h1 className="text-lg font-bold text-gray-900">
            Hola, {userName || "Admin"}
          </h1>
        </div>
        <p className="mt-1.5 text-sm text-gray-500">
          Este es el estado de tu tienda hoy.
        </p>
      </div>
      <time className="hidden text-right text-sm text-gray-400 sm:block">
        {dateTime}
      </time>
    </div>
  )
}
