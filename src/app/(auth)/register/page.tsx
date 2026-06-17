"use client"

import { createClient } from "@/lib/supabase/client"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { z } from "zod"

const registerSchema = z
  .object({
    fullName: z.string().min(2, "Nombre demasiado corto"),
    email: z.string().email("Correo inválido"),
    password: z.string().min(6, "Mínimo 6 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  })

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterForm) => {
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
        },
      },
    })

    if (error) {
      setError("root", { message: error.message })
      return
    }

    router.push("/login?registered=true")
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900">Crear Cuenta</h1>
        <p className="mt-1 text-sm text-gray-600">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-medium text-gray-900 underline">
            Iniciar Sesión
          </Link>
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
          {errors.root && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {errors.root.message}
            </div>
          )}

          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
              Nombre completo
            </label>
            <input
              id="fullName"
              type="text"
              {...register("fullName")}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
            {errors.fullName && (
              <p className="mt-1 text-xs text-red-500">{errors.fullName.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              {...register("email")}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Contraseña
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
            {isSubmitting ? "Creando cuenta..." : "Crear Cuenta"}
          </button>
        </form>
      </div>
    </div>
  )
}
