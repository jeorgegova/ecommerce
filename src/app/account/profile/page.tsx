"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function ProfilePage() {
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/login"); return }

      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single()
      if (data) {
        setFullName(data.full_name)
        setPhone(data.phone || "")
      }
      setLoading(false)
    }
    fetchProfile()
  }, [supabase, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setError(""); setSuccess(false)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error: err } = await supabase
      .from("profiles")
      .update({ full_name: fullName, phone: phone || null })
      .eq("id", user.id)

    if (err) {
      setError(err.message)
    } else {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }
    setSaving(false)
  }

  const inputClass = "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"

  if (loading) return <p className="text-center py-12 text-gray-600">Cargando...</p>

  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
          {success && <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">Perfil actualizado</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre completo</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Teléfono</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+57 300 000 0000" className={inputClass} />
          </div>

          <button type="submit" disabled={saving}
            className="w-full rounded-full bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50">
            {saving ? "Guardando..." : "Guardar Cambios"}
          </button>
        </form>
      </div>
  )
}
