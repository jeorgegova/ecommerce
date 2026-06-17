"use client"

import { createClient } from "@/lib/supabase/client"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { z } from "zod"

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

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
  })

  const onSubmit = async (data: ResetForm) => {
    const { error } = await supabase.auth.updateUser({
      password: data.password,
    })

    if (error) {
      setError("root", { message: error.message })
      return
    }

    router.push("/login?reset=true")
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900">Nueva Contraseña</h1>
        <p className="mt-1 text-sm text-gray-600">
          Ingresa tu nueva contraseña
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
          {errors.root && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {errors.root.message}
            </div>
          )}

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Nueva contraseña
            </label>
            <input
              id="password"
              type="password"
              {...register("password")}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700"
            >
              Confirmar contraseña
            </label>
            <input
              id="confirmPassword"
              type="password"
              {...register("confirmPassword")}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-500">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {isSubmitting ? "Guardando..." : "Guardar Contraseña"}
          </button>
        </form>
      </div>
    </div>
  )
}
