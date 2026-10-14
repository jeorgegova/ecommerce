"use client"

import { createClient } from "@/lib/supabase/client"
import {
  IDENTIFICATION_TYPES,
  IDENTIFICATION_TYPE_LIST,
  IDENTIFICATION_TYPE_VALUES,
  getIdentificationError,
  isIdentificationType,
  normalizeIdentificationNumber,
  type IdentificationType,
} from "@/lib/identification"
import { zodResolver } from "@hookform/resolvers/zod"
import { AnimatePresence, motion } from "framer-motion"
import { AlertCircle, ChevronDown, FileBadge, IdCard, Loader2, Phone, X } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"

const proformaDataSchema = z
  .object({
    // "" es el valor inicial del select; superRefine lo convierte en error.
    identificationType: z.union([z.literal(""), z.enum(IDENTIFICATION_TYPE_VALUES)]),
    identification: z.string().trim().min(1, "Ingresa el número de identificación").max(32, "Identificación demasiado larga"),
    phone: z.string().trim().min(7, "Ingresa un teléfono válido").max(24, "Teléfono demasiado largo")
      .refine((value) => value.replace(/\D/g, "").length >= 7, "Ingresa un teléfono válido"),
  })
  .superRefine((values, ctx) => {
    if (!values.identificationType) {
      ctx.addIssue({ code: "custom", path: ["identificationType"], message: "Selecciona el tipo de documento" })
      return
    }
    // Las reglas del numero dependen del tipo elegido, asi que se validan aqui
    // y no con un .refine suelto en el campo.
    const error = getIdentificationError(values.identificationType, values.identification)
    if (error) ctx.addIssue({ code: "custom", path: ["identification"], message: error })
  })

export interface ProformaProfileData {
  identification: string
  identificationType: IdentificationType
  phone: string
}

interface ProformaDataModalProps {
  isOpen: boolean
  defaultIdentification?: string
  defaultIdentificationType?: IdentificationType | null
  defaultPhone?: string
  onClose: () => void
  onSaved: (profile: ProformaProfileData) => void
}

type ProformaDataForm = z.infer<typeof proformaDataSchema>

export default function ProformaDataModal({
  isOpen,
  defaultIdentification = "",
  defaultIdentificationType = null,
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
    control,
    formState: { errors, isSubmitting },
  } = useForm<ProformaDataForm>({
    resolver: zodResolver(proformaDataSchema),
    defaultValues: {
      identification: defaultIdentification,
      identificationType: defaultIdentificationType ?? "",
      phone: defaultPhone,
    },
  })

  // useWatch y no watch(): solo este componente se suscribe al campo y asi el
  // compilador de React no tiene que saltarse el memoizado del form.
  const typeValue = useWatch({ control, name: "identificationType" })
  // Sin tipo elegido se muestran las reglas de CC, que es el caso por defecto.
  const selectedType = isIdentificationType(typeValue) ? IDENTIFICATION_TYPES[typeValue] : IDENTIFICATION_TYPES.cc

  const close = useCallback(() => {
    if (isSubmitting) return
    setSaveError("")
    onClose()
  }, [isSubmitting, onClose])

  useEffect(() => {
    if (!isOpen) return
    reset({
      identification: defaultIdentification,
      identificationType: defaultIdentificationType ?? "",
      phone: defaultPhone,
    })
  }, [isOpen, defaultIdentification, defaultIdentificationType, defaultPhone, reset])

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
    // zod ya lo valida; esto ademas narrowea el tipo para TypeScript.
    if (!isIdentificationType(values.identificationType)) {
      setSaveError("Selecciona el tipo de documento")
      return
    }

    // Se guarda normalizado: sin prefijos ni separadores, para que el PDF
    // pueda formatearlo segun el tipo.
    const identification = normalizeIdentificationNumber(values.identificationType, values.identification)
    const phone = values.phone.trim()

    const { error } = await supabase
      .from("profiles")
      .update({ identification, identification_type: values.identificationType, phone })
      .eq("id", user.id)

    if (error) { setSaveError(error.message); return }
    onSaved({ identification, identificationType: values.identificationType, phone })
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
              Necesitamos tu tipo de documento, número de identificación y teléfono para emitir el documento.
              Los guardaremos en tu perfil para no pedirlos en cada compra.
            </p>

            <form onSubmit={submit} className="mt-5 space-y-4">
              {saveError && (
                <div role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{saveError}</span>
                </div>
              )}

              <div>
                <label htmlFor="proforma-identification-type" className="block text-sm font-medium text-gray-700">
                  Tipo de documento
                </label>
                <div className="relative mt-1">
                  <FileBadge className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <select
                    id="proforma-identification-type"
                    aria-invalid={!!errors.identificationType}
                    aria-describedby={errors.identificationType ? "proforma-identification-type-error" : undefined}
                    {...register("identificationType")}
                    className={`block w-full appearance-none rounded-lg border py-2 pl-9 pr-9 text-sm shadow-sm outline-none focus:ring-1 ${
                      errors.identificationType
                        ? "border-red-300 bg-red-50/50 focus:border-red-400 focus:ring-red-200"
                        : "border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                    }`}
                  >
                    <option value="">Selecciona una opción</option>
                    {IDENTIFICATION_TYPE_LIST.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
                {errors.identificationType && (
                  <p id="proforma-identification-type-error" className="mt-1 text-xs text-red-500">
                    {errors.identificationType.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="proforma-identification" className="block text-sm font-medium text-gray-700">
                  Número de {selectedType.short}
                </label>
                <div className="relative mt-1">
                  <IdCard className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="proforma-identification"
                    type="text"
                    inputMode={selectedType.charset === "digits" ? "numeric" : "text"}
                    placeholder={selectedType.placeholder}
                    autoComplete="off"
                    aria-invalid={!!errors.identification}
                    aria-describedby={errors.identification ? "proforma-identification-error" : undefined}
                    {...register("identification")}
                    className={`block w-full rounded-lg border py-2 pl-9 pr-3 text-sm shadow-sm outline-none focus:ring-1 ${
                      errors.identification
                        ? "border-red-300 bg-red-50/50 focus:border-red-400 focus:ring-red-200"
                        : "border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                    }`}
                  />
                </div>
                {errors.identification ? (
                  <p id="proforma-identification-error" className="mt-1 text-xs text-red-500">
                    {errors.identification.message}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-gray-500">{selectedType.hint}</p>
                )}
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