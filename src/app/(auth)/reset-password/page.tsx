"use client"

import { createClient } from "@/lib/supabase/client"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import AmelatteLogo from "@/assets/Logo-Amelatte.png"

const resetSchema = z
  .object({
    password: z.string().min(6, "Mínimo 6 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  })

type ResetForm = z.infer<typeof resetSchema>

type Status = "checking" | "ready" | "invalid" | "done"

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [status, setStatus] = useState<Status>("checking")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
  })

  useEffect(() => {
    const validateToken = async () => {
      const tokenHash = searchParams.get("token_hash")
      const type = searchParams.get("type")

      if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as "recovery",
        })
        if (error) {
          setStatus("invalid")
          return
        }
        setStatus("ready")
        return
      }

      const { data } = await supabase.auth.getSession()
      setStatus(data.session ? "ready" : "invalid")
    }
    validateToken()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onSubmit = async (data: ResetForm) => {
    const { error } = await supabase.auth.updateUser({
      password: data.password,
    })

    if (error) {
      setError("root", { message: error.message })
      return
    }

    setStatus("done")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-sm rounded-3xl border border-gray-100 bg-white p-8 shadow-xl shadow-gray-900/5">
        <div className="flex justify-center">
          <Image src={AmelatteLogo} alt="Amelatte" className="h-10 w-auto" priority />
        </div>

        {status === "checking" && (
          <div className="mt-10 flex flex-col items-center gap-3 pb-4">
            <svg className="h-8 w-8 animate-spin text-[#C8102E]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm text-gray-500">Validando tu enlace...</p>
          </div>
        )}

        {status === "invalid" && (
          <div className="mt-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <h1 className="mt-5 text-2xl font-bold text-gray-900">Enlace inválido</h1>
            <p className="mt-2 text-sm text-gray-600">
              Este enlace expiró o ya fue usado. Solicita uno nuevo para continuar.
            </p>
            <Link
              href="/forgot-password"
              className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
            >
              Solicitar nuevo enlace
            </Link>
          </div>
        )}

        {status === "done" && (
          <div className="mt-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h1 className="mt-5 text-2xl font-bold text-gray-900">Contraseña actualizada</h1>
            <p className="mt-2 text-sm text-gray-600">
              Ya puedes iniciar sesión con tu nueva contraseña.
            </p>
            <button
              onClick={() => router.push("/login")}
              className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[#C8102E] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#9E0C24]"
            >
              Iniciar sesión
            </button>
          </div>
        )}

        {status === "ready" && (
          <>
            <h1 className="mt-8 text-center text-2xl font-bold text-gray-900">
              Nueva contraseña
            </h1>
            <p className="mt-2 text-center text-sm text-gray-600">
              Crea una contraseña segura para tu cuenta.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
              {errors.root && (
                <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-medium text-red-700">
                  {errors.root.message}
                </div>
              )}

              <div>
                <label htmlFor="password" className="mb-1.5 block text-[13px] font-semibold text-gray-700">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    {...register("password")}
                    className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 pr-11 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-[#C8102E]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-900"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs font-medium text-red-500">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="mb-1.5 block text-[13px] font-semibold text-gray-700">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Repite la contraseña"
                    {...register("confirmPassword")}
                    className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 pr-11 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-[#C8102E]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    aria-label={showConfirm ? "Ocultar contraseña" : "Mostrar contraseña"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-900"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs font-medium text-red-500">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-full bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
              >
                {isSubmitting ? "Guardando..." : "Guardar contraseña"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  )
}
