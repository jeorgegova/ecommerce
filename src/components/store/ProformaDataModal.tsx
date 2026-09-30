"use client"

import { createClient } from "@/lib/supabase/client"
import { zodResolver } from "@hookform/resolvers/zod"
import { AnimatePresence, motion } from "framer-motion"
import { AlertCircle, IdCard, Loader2, Phone, X } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

const proformaDataSchema = z.object({
  identification: z.string().trim().min(3, "Ingresa tu número de identificación").max(32, "Identificación demasiado larga"),
  phone: z.string().trim().min(7, "Ingresa un teléfono válido").max(24, "Teléfono demasiado largo")
    .refine((value) => value.replace(/\D/g, "").length >= 7, "Ingresa un teléfono válido"),
})

export interface ProformaProfileData {
  identification: string
  phone: string
}

interface ProformaDataModalProps {
  isOpen: boolean
  defaultIdentification?: string
  defaultPhone?: string
  onClose: () => void
  onSaved: (profile: ProformaProfileData) => void
}

type ProformaDataForm = z.infer<typeof proformaDataSchema>

export default function ProformaDataModal({
  isOpen,
  defaultIdentification = "",
  defaultPhone = "",
  onClose,
  onSaved,
}: ProformaDataModalProps) {
  const supabase = createClient()
  const [saveError, setSaveError] = useState("")
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProformaDataForm>({
    resolver: zodResolver(proformaDataSchema),
    defaultValues: { identification: defaultIdentification, phone: defaultPhone },
  })

  const close = useCallback(() => {
    if (isSubmitting) return
    setSaveError("")
    onClose()
  }, [isSubmitting, onClose])

  useEffect(() => {
    if (!isOpen) return
    reset({ identification: defaultIdentification, phone: defaultPhone })
  }, [isOpen, defaultIdentification, defaultPhone, reset])

  useEffect(() => {
    if (!isOpen) return
    document.body.style.overflow = "hidden"
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
    }
    document.addEventListener("keydown", handleEsc)
    return () => {
      document.body.style.overflow = ""
      document.removeEventListener("keydown", handleEsc)
    }
  }, [isOpen, close])

  const submit = handleSubmit(async (values) => {
    setSaveError("")
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaveError("Sesión no disponible"); return }

    const identification = values.identification.trim()
    const phone = values.phone.trim()

    const { error } = await supabase
      .from("profiles")
      .update({ identification, phone })
      .eq("id", user.id)

    if (error) { setSaveError(error.message); return }
    onSaved({ identification, phone })
  })

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="absolute inset-0 bg-black/40" onClick={close} />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="proforma-data-title"
            className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <button
              type="button"
              onClick={close}
              disabled={isSubmitting}
              aria-label="Cerrar"
              className="absolute right-4 top-4 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 id="proforma-data-title" className="text-lg font-semibold text-gray-900">
              Ingresa tus datos para generar la proforma
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Necesitamos tu identificación y teléfono para emitir el documento. Los guardaremos en tu perfil.
            </p>

            <form onSubmit={submit} className="mt-5 space-y-4">
              {saveError && (
                <div role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{saveError}</span>
                </div>
              )}

              <div>
                <label htmlFor="proforma-identification" className="block text-sm font-medium text-gray-700">
                  Identificación
                </label>
                <div className="relative mt-1">
                  <IdCard className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="proforma-identification"
                    type="text"
                    inputMode="text"
                    placeholder="CC 1234567890"
                    autoComplete="off"
                    aria-invalid={!!errors.identification}
                    {...register("identification")}
                    className={`block w-full rounded-lg border py-2 pl-9 pr-3 text-sm shadow-sm outline-none focus:ring-1 ${
                      errors.identification
                        ? "border-red-300 bg-red-50/50 focus:border-red-400 focus:ring-red-200"
                        : "border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                    }`}
                  />
                </div>
                {errors.identification && <p className="mt-1 text-xs text-red-500">{errors.identification.message}</p>}
              </div>

              <div>
                <label htmlFor="proforma-phone" className="block text-sm font-medium text-gray-700">
                  Teléfono
                </label>
                <div className="relative mt-1">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="proforma-phone"
                    type="tel"
                    inputMode="tel"
                    placeholder="+57 300 000 0000"
                    autoComplete="tel"
                    aria-invalid={!!errors.phone}
                    {...register("phone")}
                    className={`block w-full rounded-lg border py-2 pl-9 pr-3 text-sm shadow-sm outline-none focus:ring-1 ${
                      errors.phone
                        ? "border-red-300 bg-red-50/50 focus:border-red-400 focus:ring-red-200"
                        : "border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                    }`}
                  />
                </div>
                {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={close}
                  disabled={isSubmitting}
                  className="flex-1 rounded-full border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isSubmitting ? "Guardando..." : "Guardar y continuar"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}