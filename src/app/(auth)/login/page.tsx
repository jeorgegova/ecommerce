"use client"

import { createClient } from "@/lib/supabase/client"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { z } from "zod"

const loginSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) {
      setError("root", { message: error.message })
      return
    }

    router.push("/")
    router.refresh()
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900">Iniciar Sesión</h1>
        <p className="mt-1 text-sm text-gray-600">
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="font-medium text-gray-900 underline">
            Registrarse
          </Link>
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
          {errors.root && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {errors.root.message}
            </div>
          )}

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

          <div className="flex items-center justify-end">
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-gray-600 hover:text-gray-900"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {isSubmitting ? "Iniciando sesión..." : "Iniciar Sesión"}
          </button>
        </form>
      </div>
    </div>
  )
}
