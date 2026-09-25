"use client"

import { createClient } from "@/lib/supabase/client"
import { zodResolver } from "@hookform/resolvers/zod"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import AmelatteLogo from "@/assets/Logo-Amelatte.png"

const forgotSchema = z.object({
  email: z.string().email("Correo inválido"),
})

type ForgotForm = z.infer<typeof forgotSchema>

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [sentTo, setSentTo] = useState("")
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
  })

  const onSubmit = async (data: ForgotForm) => {
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      setError("root", { message: error.message })
      return
    }

    setSentTo(data.email)
    setSent(true)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-sm rounded-3xl border border-gray-100 bg-white p-8 shadow-xl shadow-gray-900/5">
        <div className="flex justify-center">
          <Image src={AmelatteLogo} alt="Amelatte" className="h-10 w-auto" priority />
        </div>

        {sent ? (
          <div className="mt-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h1 className="mt-5 text-2xl font-bold text-gray-900">Revisa tu correo</h1>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              Te enviamos un enlace para restablecer tu contraseña a{" "}
              <span className="font-semibold text-gray-900">{sentTo}</span>.
              Si no lo ves, revisa tu carpeta de spam.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
            >
              Volver a Iniciar Sesión
            </Link>
          </div>
        ) : (
          <>
            <h1 className="mt-8 text-center text-2xl font-bold text-gray-900">
              Recuperar contraseña
            </h1>
            <p className="mt-2 text-center text-sm text-gray-600">
              Ingresa tu correo y te enviaremos un enlace para crear una nueva contraseña.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
              {errors.root && (
                <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-medium text-red-700">
                  {errors.root.message}
                </div>
              )}

              <div>
                <label htmlFor="email" className="mb-1.5 block text-[13px] font-semibold text-gray-700">
                  Correo electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="tu@correo.com"
                  {...register("email")}
                  className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-[#C8102E]"
                />
                {errors.email && (
                  <p className="mt-1 text-xs font-medium text-red-500">{errors.email.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-full bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
              >
                {isSubmitting ? "Enviando..." : "Enviar enlace"}
              </button>

              <Link
                href="/login"
                className="block text-center text-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
              >
                Volver a Iniciar Sesión
              </Link>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
