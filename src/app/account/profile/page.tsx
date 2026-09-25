"use client"

import { createClient } from "@/lib/supabase/client"
import { Eye, EyeOff } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function ProfilePage() {
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState("")
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
      setUserEmail(user.email || "")
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

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingPassword(true); setPasswordError(""); setPasswordSuccess(false)

    if (newPassword.length < 6) {
      setPasswordError("La nueva contraseña debe tener al menos 6 caracteres")
      setSavingPassword(false)
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Las contraseñas no coinciden")
      setSavingPassword(false)
      return
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: currentPassword,
    })
    if (signInError) {
      setPasswordError("Tu contraseña actual no es correcta")
      setSavingPassword(false)
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
    if (updateError) {
      setPasswordError(updateError.message)
    } else {
      setPasswordSuccess(true)
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("")
      setTimeout(() => setPasswordSuccess(false), 4000)
    }
    setSavingPassword(false)
  }

  const passwordInput = (value: string, onChange: (v: string) => void, show: boolean, onToggle: () => void, placeholder: string) => (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required
        minLength={6}
        className="block w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-900"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )

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

        <div className="mt-12 border-t border-gray-100 pt-8">
          <h2 className="text-xl font-bold text-gray-900">Cambiar contraseña</h2>
          <p className="mt-1 text-sm text-gray-500">Te pedimos tu contraseña actual por seguridad.</p>

          <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-5">
            {passwordError && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{passwordError}</div>}
            {passwordSuccess && <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">Contraseña actualizada correctamente</div>}

            <div>
              <label className="block text-sm font-medium text-gray-700">Contraseña actual</label>
              <div className="mt-1">
                {passwordInput(currentPassword, setCurrentPassword, showCurrent, () => setShowCurrent(!showCurrent), "Tu contraseña actual")}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Nueva contraseña</label>
              <div className="mt-1">
                {passwordInput(newPassword, setNewPassword, showNew, () => setShowNew(!showNew), "Mínimo 6 caracteres")}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Confirmar nueva contraseña</label>
              <div className="mt-1">
                {passwordInput(confirmPassword, setConfirmPassword, showConfirm, () => setShowConfirm(!showConfirm), "Repite la nueva contraseña")}
              </div>
            </div>

            <button type="submit" disabled={savingPassword}
              className="w-full rounded-full bg-[#C8102E] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#9E0C24] disabled:opacity-50">
              {savingPassword ? "Actualizando..." : "Cambiar contraseña"}
            </button>
          </form>
        </div>
      </div>
  )
}
