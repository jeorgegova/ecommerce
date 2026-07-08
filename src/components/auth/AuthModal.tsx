"use client"

import { createClient } from "@/lib/supabase/client"
import { useAuthModal } from "@/stores/auth-modal"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

const loginSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
})

const registerSchema = z.object({
  fullName: z.string().min(2, "Nombre demasiado corto"),
  email: z.string().email("Correo inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
})

const forgotSchema = z.object({
  email: z.string().email("Correo inválido"),
})

type LoginForm = z.infer<typeof loginSchema>
type RegisterForm = z.infer<typeof registerSchema>
type ForgotForm = z.infer<typeof forgotSchema>

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  )
}

export default function AuthModal() {
  const { isOpen, view, redirectTo, registeredMessage, closeAuth, setAuthView, setRegisteredMessage } = useAuthModal()
  const router = useRouter()
  const supabase = createClient()
  const [visible, setVisible] = useState(false)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setVisible(true)
      requestAnimationFrame(() => setAnimating(true))
      document.body.style.overflow = "hidden"
    } else {
      setAnimating(false)
      const timer = setTimeout(() => setVisible(false), 300)
      document.body.style.overflow = ""
      return () => clearTimeout(timer)
    }
    return () => { document.body.style.overflow = "" }
  }, [isOpen])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAuth()
    }
    if (isOpen) document.addEventListener("keydown", handleEsc)
    return () => document.removeEventListener("keydown", handleEsc)
  }, [isOpen, closeAuth])

  if (!visible) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        animating ? "bg-black/40 backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <div
        className={`relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl shadow-black/10 transition-all duration-400 ${
          animating ? "translate-y-0 scale-100 opacity-100" : "translate-y-8 scale-[0.97] opacity-0"
        }`}
      >
        <button
          onClick={closeAuth}
          className="absolute top-5 right-5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-all duration-200 hover:bg-gray-200 hover:text-gray-600"
          aria-label="Cerrar"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden select-none">
          <svg className="absolute -top-10 -right-10 h-40 w-40 text-gray-100 rotate-12" viewBox="0 0 24 24" fill="currentColor"><path d="M2.25 2.25a.75.75 0 000 1.5h1.386c.17 0 .318.114.362.278l2.558 9.592a3.752 3.752 0 00-2.806 3.63c0 .414.336.75.75.75h15.75a.75.75 0 000-1.5H5.378A2.25 2.25 0 017.5 15h11.218a2.25 2.25 0 002.163-1.684l2.25-8.25A2.25 2.25 0 0020.97 2.25H5.256l-.624-2.34A1.862 1.862 0 003.636.75H2.25zM9.75 19.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm6.75 0a1.5 1.5 0 100 3 1.5 1.5 0 000-3z"/></svg>
          <svg className="absolute -bottom-8 -left-8 h-36 w-36 text-gray-100 -rotate-12" viewBox="0 0 24 24" fill="currentColor"><path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z"/></svg>
          <svg className="absolute top-1/2 right-0 h-24 w-24 text-gray-100 translate-x-1/2 -translate-y-1/2 rotate-12" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" /></svg>
          <svg className="absolute bottom-1/4 right-1/4 h-20 w-20 text-gray-100 rotate-45" viewBox="0 0 24 24" fill="currentColor"><path d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zm0 9.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zm0 9.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"/></svg>
          <svg className="absolute top-1/4 left-0 h-16 w-16 text-gray-100 -translate-x-1/2 rotate-6" viewBox="0 0 24 24" fill="currentColor"><path d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/></svg>
        </div>

        <div className="relative z-[1] px-8 pb-8 pt-10">
          <div key={view} className="animate-slide-down">
            {view === "login" && (
              <LoginForm
                supabase={supabase} router={router} redirectTo={redirectTo}
                registeredMessage={registeredMessage}
                onRegisterClick={() => { setAuthView("register"); setRegisteredMessage(false) }}
                onForgotClick={() => setAuthView("forgot-password")}
                onSuccess={() => closeAuth()}
              />
            )}
            {view === "register" && (
              <RegisterForm supabase={supabase}
                onLoginClick={() => setAuthView("login")}
                onSuccess={() => { setRegisteredMessage(true); setAuthView("login") }}
              />
            )}
            {view === "forgot-password" && (
              <ForgotPasswordForm supabase={supabase} onLoginClick={() => setAuthView("login")} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const inputClass = "block w-full rounded-2xl border-0 bg-gray-50 px-4 py-3.5 text-[15px] text-gray-900 placeholder:text-gray-400 focus:bg-gray-100 focus:outline-none focus:ring-0 transition-colors duration-200"

const inputErrorClass = "block w-full rounded-2xl border-0 bg-red-50 px-4 py-3.5 text-[15px] text-gray-900 placeholder:text-gray-400 focus:bg-red-100 focus:outline-none focus:ring-0 transition-colors duration-200"

function LoginForm({
  supabase, router, redirectTo, registeredMessage, onRegisterClick, onForgotClick, onSuccess,
}: {
  supabase: ReturnType<typeof createClient>
  router: ReturnType<typeof useRouter>
  redirectTo: string | null
  registeredMessage: boolean
  onRegisterClick: () => void
  onForgotClick: () => void
  onSuccess: () => void
}) {
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginForm) => {
    const { error } = await supabase.auth.signInWithPassword({ email: data.email, password: data.password })
    if (error) { setError("root", { message: error.message }); return }
    onSuccess()
    router.refresh()
    if (redirectTo) router.push(redirectTo)
  }

  return (
    <div>
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-900">
          <span className="text-lg font-bold text-white">G</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Iniciar sesión</h2>
        <p className="mt-1.5 text-[15px] text-gray-500">Bienvenido de vuelta a GoGi</p>
      </div>

      {registeredMessage && (
        <div className="mb-6 animate-slide-down rounded-2xl bg-green-50 px-4 py-3 text-center text-[14px] font-medium text-green-700">
          Cuenta creada. Ya puedes iniciar sesión.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errors.root && (
          <div className="animate-slide-down rounded-2xl bg-red-50 px-4 py-3 text-center text-[14px] font-medium text-red-600">
            {errors.root.message}
          </div>
        )}

        <div>
          <input
            type="email" placeholder="Correo electrónico" {...register("email")}
            className={errors.email ? inputErrorClass : inputClass}
          />
          {errors.email && <p className="mt-1.5 px-1 text-[13px] text-red-500">{errors.email.message}</p>}
        </div>

        <div>
          <input
            type="password" placeholder="Contraseña" {...register("password")}
            className={errors.password ? inputErrorClass : inputClass}
          />
          {errors.password && <p className="mt-1.5 px-1 text-[13px] text-red-500">{errors.password.message}</p>}
        </div>

        <div className="flex justify-end">
          <button type="button" onClick={onForgotClick}
            className="text-[13px] font-medium text-gray-400 hover:text-gray-700 transition-colors">
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        <button type="submit" disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-900 py-3.5 text-[15px] font-semibold text-white shadow-sm transition-all duration-200 hover:bg-gray-800 hover:shadow-md active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40">
          {isSubmitting ? <><Spinner /> Iniciando sesión...</> : "Iniciar sesión"}
        </button>
      </form>

      <p className="mt-6 text-center text-[14px] text-gray-400">
        ¿No tienes cuenta?{" "}
        <button onClick={onRegisterClick} className="font-semibold text-gray-900 hover:underline underline-offset-2 transition-colors">
          Crear cuenta
        </button>
      </p>
    </div>
  )
}

function RegisterForm({
  supabase, onLoginClick, onSuccess,
}: {
  supabase: ReturnType<typeof createClient>
  onLoginClick: () => void
  onSuccess: () => void
}) {
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) })

  const onSubmit = async (data: RegisterForm) => {
    const { error } = await supabase.auth.signUp({
      email: data.email, password: data.password,
      options: { data: { full_name: data.fullName } },
    })
    if (error) { setError("root", { message: error.message }); return }
    onSuccess()
  }

  return (
    <div>
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-900">
          <span className="text-lg font-bold text-white">G</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Crear cuenta</h2>
        <p className="mt-1.5 text-[15px] text-gray-500">Únete a GoGi hoy</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errors.root && (
          <div className="animate-slide-down rounded-2xl bg-red-50 px-4 py-3 text-center text-[14px] font-medium text-red-600">
            {errors.root.message}
          </div>
        )}

        <div>
          <input type="text" placeholder="Nombre completo" {...register("fullName")}
            className={errors.fullName ? inputErrorClass : inputClass} />
          {errors.fullName && <p className="mt-1.5 px-1 text-[13px] text-red-500">{errors.fullName.message}</p>}
        </div>

        <div>
          <input type="email" placeholder="Correo electrónico" {...register("email")}
            className={errors.email ? inputErrorClass : inputClass} />
          {errors.email && <p className="mt-1.5 px-1 text-[13px] text-red-500">{errors.email.message}</p>}
        </div>

        <div>
          <input type="password" placeholder="Contraseña" {...register("password")}
            className={errors.password ? inputErrorClass : inputClass} />
          {errors.password && <p className="mt-1.5 px-1 text-[13px] text-red-500">{errors.password.message}</p>}
        </div>

        <div>
          <input type="password" placeholder="Confirmar contraseña" {...register("confirmPassword")}
            className={errors.confirmPassword ? inputErrorClass : inputClass} />
          {errors.confirmPassword && <p className="mt-1.5 px-1 text-[13px] text-red-500">{errors.confirmPassword.message}</p>}
        </div>

        <button type="submit" disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-900 py-3.5 text-[15px] font-semibold text-white shadow-sm transition-all duration-200 hover:bg-gray-800 hover:shadow-md active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40">
          {isSubmitting ? <><Spinner /> Creando cuenta...</> : "Crear cuenta"}
        </button>
      </form>

      <p className="mt-6 text-center text-[14px] text-gray-400">
        ¿Ya tienes cuenta?{" "}
        <button onClick={onLoginClick} className="font-semibold text-gray-900 hover:underline underline-offset-2 transition-colors">
          Iniciar sesión
        </button>
      </p>
    </div>
  )
}

function ForgotPasswordForm({
  supabase, onLoginClick,
}: {
  supabase: ReturnType<typeof createClient>
  onLoginClick: () => void
}) {
  const [sent, setSent] = useState(false)
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<ForgotForm>({ resolver: zodResolver(forgotSchema) })

  const onSubmit = async (data: ForgotForm) => {
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) { setError("root", { message: error.message }); return }
    setSent(true)
  }

  if (sent) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50">
          <svg className="h-7 w-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Revisa tu correo</h2>
        <p className="mt-2 text-[15px] text-gray-500">Te enviamos un enlace para restablecer tu contraseña.</p>
        <button onClick={onLoginClick}
          className="mt-8 inline-flex items-center gap-1.5 text-[15px] font-semibold text-gray-900 hover:underline underline-offset-2 transition-colors">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver a iniciar sesión
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100">
          <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Recuperar contraseña</h2>
        <p className="mt-1.5 text-[15px] text-gray-500">Te enviaremos un enlace de recuperación</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errors.root && (
          <div className="animate-slide-down rounded-2xl bg-red-50 px-4 py-3 text-center text-[14px] font-medium text-red-600">
            {errors.root.message}
          </div>
        )}

        <div>
          <input type="email" placeholder="Correo electrónico" {...register("email")}
            className={errors.email ? inputErrorClass : inputClass} />
          {errors.email && <p className="mt-1.5 px-1 text-[13px] text-red-500">{errors.email.message}</p>}
        </div>

        <button type="submit" disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-900 py-3.5 text-[15px] font-semibold text-white shadow-sm transition-all duration-200 hover:bg-gray-800 hover:shadow-md active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40">
          {isSubmitting ? <><Spinner /> Enviando...</> : "Enviar enlace"}
        </button>
      </form>

      <p className="mt-6 text-center text-[14px] text-gray-400">
        <button onClick={onLoginClick} className="font-semibold text-gray-900 hover:underline underline-offset-2 transition-colors">
          Volver a iniciar sesión
        </button>
      </p>
    </div>
  )
}
