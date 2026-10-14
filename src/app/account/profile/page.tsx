"use client"

import { createClient } from "@/lib/supabase/client"
import {
  IDENTIFICATION_TYPES,
  IDENTIFICATION_TYPE_LIST,
  getIdentificationError,
  isIdentificationType,
  normalizeIdentificationNumber,
  parseIdentificationType,
  type IdentificationType,
} from "@/lib/identification"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function ProfilePage() {
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [identification, setIdentification] = useState("")
  const [identificationType, setIdentificationType] = useState<IdentificationType | "">("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [fieldError, setFieldError] = useState("")
  const [pendingType, setPendingType] = useState(false)
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
        setIdentification(data.identification || "")
        setIdentificationType(parseIdentificationType(data.identification_type) ?? "")
        // Numero guardado sin tipo: hay que preguntar cual era. Solo se avisa
        // una vez, no se adivina.
        setPendingType(Boolean(data.identification?.trim() && !parseIdentificationType(data.identification_type)))
      }
      setLoading(false)
    }
    fetchProfile()
  }, [supabase, router])

  const selectedType = isIdentificationType(identificationType)
    ? IDENTIFICATION_TYPES[identificationType]
    : IDENTIFICATION_TYPES.cc

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(""); setFieldError(""); setSuccess(false)

    if (!isIdentificationType(identificationType)) { setFieldError("Selecciona el tipo de documento"); return }
    const identificationError = getIdentificationError(identificationType, identification)
    if (identificationError) { setFieldError(identificationError); return }

    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const { error: err } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        phone: phone || null,
        identification: identification ? normalizeIdentificationNumber(identificationType, identification) : null,
        identification_type: identification ? identificationType : null,
      })
      .eq("id", user.id)

    if (err) {
      setError(err.message)
    } else {
      setPendingType(false)
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

        {pendingType && (
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Ya tienes un número de identificación guardado, pero falta indicar qué documento es.
            Selecciónalo abajo para que salga bien en tus proformas.
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
          {success && <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">Perfil actualizado</div>}

          <div>
            <label htmlFor="profile-full-name" className="block text-sm font-medium text-gray-700">Nombre completo</label>
            <input id="profile-full-name" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} required />
          </div>

          <div>
            <label htmlFor="profile-identification-type" className="block text-sm font-medium text-gray-700">Tipo de documento</label>
            <select
              id="profile-identification-type"
              value={identificationType}
              onChange={(e) => {
                const next = e.target.value
                setIdentificationType(isIdentificationType(next) ? next : "")
              }}
              className={inputClass}
            >
              <option value="">Sin especificar</option>
              {IDENTIFICATION_TYPE_LIST.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="profile-identification" className="block text-sm font-medium text-gray-700">
              {isIdentificationType(identificationType) ? `Número de ${selectedType.short}` : "Número de identificación"}
            </label>
            <input
              id="profile-identification"
              type="text"
              inputMode={selectedType.charset === "digits" ? "numeric" : "text"}
              value={identification}
              onChange={(e) => setIdentification(e.target.value)}
              placeholder={selectedType.placeholder}
              aria-invalid={!!fieldError}
              aria-describedby={fieldError ? "profile-identification-error" : "profile-identification-hint"}
              className={fieldError ? `${inputClass} border-red-300 bg-red-50/50` : inputClass}
            />
            {fieldError
              ? <p id="profile-identification-error" className="mt-1 text-xs text-red-500">{fieldError}</p>
              : <p id="profile-identification-hint" className="mt-1 text-xs text-gray-500">{selectedType.hint}</p>}
            <p className="mt-1 text-xs text-gray-500">Requerida para generar la proforma de compra.</p>
          </div>

          <div>
            <label htmlFor="profile-phone" className="block text-sm font-medium text-gray-700">Teléfono</label>
            <input id="profile-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+57 300 000 0000" className={inputClass} />
          </div>

          <button type="submit" disabled={saving}
            className="w-full rounded-full bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50">
            {saving ? "Guardando..." : "Guardar Cambios"}
          </button>
        </form>
      </div>
  )
}
