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
        <div className="h-1.5 w-full flex">
          <div className="h-full w-1/2 bg-colombia-yellow" />
          <div className="h-full w-1/4 bg-colombia-blue" />
          <div className="h-full w-1/4 bg-colombia-red" />
        </div>

        <button
          onClick={closeAuth}
          className="absolute top-5 right-5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-all duration-200 hover:bg-gray-200 hover:text-gray-600"
          aria-label="Cerrar"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden select-none opacity-[0.04]">
          <svg className="absolute -top-10 -right-10 h-40 w-40 text-gray-900 rotate-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2v4M12 18v4M4 12h4M16 12h4M6.34 6.34l2.83 2.83M14.83 14.83l2.83 2.83M6.34 17.66l2.83-2.83M14.83 9.17l2.83-2.83" />
          </svg>
          <svg className="absolute -bottom-8 -left-8 h-36 w-36 text-gray-900 -rotate-45" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
          <svg className="absolute top-1/2 right-0 h-28 w-28 text-gray-900 translate-x-1/3 -translate-y-1/2 rotate-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="5" cy="18" r="3" />
            <circle cx="19" cy="18" r="3" />
            <path d="M5 18l3-6 4 1 3-5h3l1.5 2h-2.5l-3 4-2-1-3 5" />
          </svg>
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

const inputClass = "block w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-[15px] text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-colombia-yellow/40 focus:border-colombia-blue transition-all duration-200"

const inputErrorClass = "block w-full rounded-2xl border border-red-300 bg-red-50 px-4 py-3.5 text-[15px] text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-500 transition-all duration-200"

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
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-colombia-blue border border-colombia-yellow/45 shadow-sm">
          <svg className="h-7 w-7 text-colombia-yellow stroke-colombia-yellow" viewBox="0 0 24 24" strokeWidth="2" fill="none">
            <circle cx="5" cy="17" r="2.5" />
            <circle cx="19" cy="17" r="2.5" />
            <path d="M5 17h14" className="stroke-colombia-red" />
            <path d="M7.5 17l2-5h5.5l2 5" />
            <path d="M9.5 12L8 8H6" />
            <path d="M15 12l-1-4h-4" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Iniciar sesión</h2>
        <p className="mt-1.5 text-[15px] text-gray-500">Bienvenido de vuelta a GoGi Motos</p>
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
            className="text-[13px] font-medium text-gray-400 hover:text-colombia-blue transition-colors">
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        <button type="submit" disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-colombia-blue py-3.5 text-[15px] font-semibold text-white shadow-sm transition-all duration-200 hover:bg-col-blue-dark border border-colombia-yellow/30 hover:shadow-md active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40">
          {isSubmitting ? <><Spinner /> Iniciando sesión...</> : "Iniciar sesión"}
        </button>
      </form>

      <p className="mt-6 text-center text-[14px] text-gray-400">
        ¿No tienes cuenta?{" "}
        <button onClick={onRegisterClick} className="font-semibold text-colombia-blue hover:underline underline-offset-2 transition-colors">
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
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-colombia-blue border border-colombia-yellow/45 shadow-sm">
          <svg className="h-7 w-7 text-colombia-yellow stroke-colombia-yellow" viewBox="0 0 24 24" strokeWidth="2" fill="none">
            <circle cx="5" cy="17" r="2.5" />
            <circle cx="19" cy="17" r="2.5" />
            <path d="M5 17h14" className="stroke-colombia-red" />
            <path d="M7.5 17l2-5h5.5l2 5" />
            <path d="M9.5 12L8 8H6" />
            <path d="M15 12l-1-4h-4" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Crear cuenta</h2>
        <p className="mt-1.5 text-[15px] text-gray-500">Únete a GoGi Motos hoy</p>
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
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-colombia-blue py-3.5 text-[15px] font-semibold text-white shadow-sm transition-all duration-200 hover:bg-col-blue-dark border border-colombia-yellow/30 hover:shadow-md active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40">
          {isSubmitting ? <><Spinner /> Creando cuenta...</> : "Crear cuenta"}
        </button>
      </form>

      <p className="mt-6 text-center text-[14px] text-gray-400">
        ¿Ya tienes cuenta?{" "}
        <button onClick={onLoginClick} className="font-semibold text-colombia-blue hover:underline underline-offset-2 transition-colors">
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
          className="mt-8 inline-flex items-center gap-1.5 text-[15px] font-semibold text-colombia-blue hover:underline underline-offset-2 transition-colors">
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
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-colombia-blue border border-colombia-yellow/45 shadow-sm">
          <svg className="h-6 w-6 text-colombia-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-colombia-blue py-3.5 text-[15px] font-semibold text-white shadow-sm transition-all duration-200 hover:bg-col-blue-dark border border-colombia-yellow/30 hover:shadow-md active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40">
          {isSubmitting ? <><Spinner /> Enviando...</> : "Enviar enlace"}
        </button>
      </form>

      <p className="mt-6 text-center text-[14px] text-gray-400">
        <button onClick={onLoginClick} className="font-semibold text-colombia-blue hover:underline underline-offset-2 transition-colors">
          Volver a iniciar sesión
        </button>
      </p>
    </div>
  )
}
