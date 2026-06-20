"use client"

import { createClient } from "@/lib/supabase/client"
import { useAuthModal } from "@/stores/auth-modal"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

const loginSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
})

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
  const overlayRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setVisible(true)
      requestAnimationFrame(() => setAnimating(true))
      document.body.style.overflow = "hidden"
    } else {
      setAnimating(false)
      const timer = setTimeout(() => setVisible(false), 200)
      document.body.style.overflow = ""
      return () => clearTimeout(timer)
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAuth()
    }
    if (isOpen) document.addEventListener("keydown", handleEsc)
    return () => document.removeEventListener("keydown", handleEsc)
  }, [isOpen, closeAuth])

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === overlayRef.current) closeAuth()
  }, [closeAuth])

  if (!visible) return null

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200 motion-reduce:transition-none ${
        animating ? "bg-black/50 backdrop-blur-sm" : "bg-transparent"
      }`}
    >
      <div
        className={`relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-black/5 transition-all duration-300 motion-reduce:transition-none ${
          animating ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-95 opacity-0"
        }`}
      >
        <button
          onClick={closeAuth}
          className="absolute top-4 right-4 rounded-lg p-1 text-gray-400 transition-all duration-150 hover:rotate-90 hover:bg-gray-100 hover:text-gray-600 motion-reduce:transition-none motion-reduce:hover:rotate-0"
          aria-label="Cerrar"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="animate-slide-down motion-reduce:animate-none" key={view}>
          {view === "login" && (
            <LoginForm
              supabase={supabase}
              router={router}
              redirectTo={redirectTo}
              registeredMessage={registeredMessage}
              onRegisterClick={() => {
                setAuthView("register")
                setRegisteredMessage(false)
              }}
              onForgotClick={() => setAuthView("forgot-password")}
              onSuccess={() => closeAuth()}
            />
          )}

          {view === "register" && (
            <RegisterForm
              supabase={supabase}
              onLoginClick={() => setAuthView("login")}
              onSuccess={() => {
                setRegisteredMessage(true)
                setAuthView("login")
              }}
            />
          )}

          {view === "forgot-password" && (
            <ForgotPasswordForm
              supabase={supabase}
              onLoginClick={() => setAuthView("login")}
            />
          )}
        </div>
      </div>
    </div>
  )
}

const inputClasses =
  "mt-1 block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm shadow-sm transition-all duration-200 placeholder:text-gray-400 focus:border-gray-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-gray-900/10 motion-reduce:transition-none"

const inputErrorClasses =
  "mt-1 block w-full rounded-xl border border-red-300 bg-red-50 px-4 py-2.5 text-sm shadow-sm transition-all duration-200 placeholder:text-gray-400 focus:border-red-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-red-500/10 motion-reduce:transition-none"

function LoginForm({
  supabase,
  router,
  redirectTo,
  registeredMessage,
  onRegisterClick,
  onForgotClick,
  onSuccess,
}: {
  supabase: ReturnType<typeof createClient>
  router: ReturnType<typeof useRouter>
  redirectTo: string | null
  registeredMessage: boolean
  onRegisterClick: () => void
  onForgotClick: () => void
  onSuccess: () => void
}) {
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

    onSuccess()
    router.refresh()
    if (redirectTo) {
      router.push(redirectTo)
    }
  }

  return (
    <div>
      <div className="mb-1 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900 text-white">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Iniciar Sesión</h2>
          <p className="text-sm text-gray-500">
            ¿No tienes cuenta?{" "}
            <button onClick={onRegisterClick} className="font-medium text-gray-900 underline underline-offset-2 transition-colors hover:text-gray-600 motion-reduce:transition-none">
              Registrarse
            </button>
          </p>
        </div>
      </div>

      {registeredMessage && (
        <div className="mt-4 animate-slide-down rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700 motion-reduce:animate-none">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Cuenta creada exitosamente. Ahora puedes iniciar sesión.
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        {errors.root && (
          <div className="animate-slide-down rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600 motion-reduce:animate-none">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {errors.root.message}
            </div>
          </div>
        )}

        <div>
          <label htmlFor="login-email" className="block text-sm font-medium text-gray-700">
            Correo electrónico
          </label>
          <div className="relative mt-1">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <input
              id="login-email"
              type="email"
              placeholder="tu@correo.com"
              {...register("email")}
              className={errors.email ? `pl-10 ${inputErrorClasses}` : `pl-10 ${inputClasses}`}
            />
          </div>
          {errors.email && (
            <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="login-password" className="block text-sm font-medium text-gray-700">
            Contraseña
          </label>
          <div className="relative mt-1">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <input
              id="login-password"
              type="password"
              placeholder="••••••••"
              {...register("password")}
              className={errors.password ? `pl-10 ${inputErrorClasses}` : `pl-10 ${inputClasses}`}
            />
          </div>
          {errors.password && (
            <p className="mt-1.5 text-xs text-red-500">{errors.password.message}</p>
          )}
        </div>

        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={onForgotClick}
            className="text-xs font-medium text-gray-500 underline underline-offset-2 transition-colors hover:text-gray-900 motion-reduce:transition-none"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-gray-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-gray-900/20 transition-all duration-200 hover:bg-gray-800 hover:shadow-gray-900/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none motion-reduce:active:scale-100"
        >
          {isSubmitting ? (
            <>
              <Spinner />
              Iniciando sesión...
            </>
          ) : (
            "Iniciar Sesión"
          )}
        </button>
      </form>
    </div>
  )
}

function RegisterForm({
  supabase,
  onLoginClick,
  onSuccess,
}: {
  supabase: ReturnType<typeof createClient>
  onLoginClick: () => void
  onSuccess: () => void
}) {
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

    onSuccess()
  }

  return (
    <div>
      <div className="mb-1 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900 text-white">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Crear Cuenta</h2>
          <p className="text-sm text-gray-500">
            ¿Ya tienes cuenta?{" "}
            <button onClick={onLoginClick} className="font-medium text-gray-900 underline underline-offset-2 transition-colors hover:text-gray-600 motion-reduce:transition-none">
              Iniciar Sesión
            </button>
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        {errors.root && (
          <div className="animate-slide-down rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600 motion-reduce:animate-none">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {errors.root.message}
            </div>
          </div>
        )}

        <div>
          <label htmlFor="reg-fullName" className="block text-sm font-medium text-gray-700">
            Nombre completo
          </label>
          <div className="relative mt-1">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <input
              id="reg-fullName"
              type="text"
              placeholder="Tu nombre"
              {...register("fullName")}
              className={errors.fullName ? `pl-10 ${inputErrorClasses}` : `pl-10 ${inputClasses}`}
            />
          </div>
          {errors.fullName && (
            <p className="mt-1.5 text-xs text-red-500">{errors.fullName.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700">
            Correo electrónico
          </label>
          <div className="relative mt-1">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <input
              id="reg-email"
              type="email"
              placeholder="tu@correo.com"
              {...register("email")}
              className={errors.email ? `pl-10 ${inputErrorClasses}` : `pl-10 ${inputClasses}`}
            />
          </div>
          {errors.email && (
            <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700">
            Contraseña
          </label>
          <div className="relative mt-1">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <input
              id="reg-password"
              type="password"
              placeholder="••••••••"
              {...register("password")}
              className={errors.password ? `pl-10 ${inputErrorClasses}` : `pl-10 ${inputClasses}`}
            />
          </div>
          {errors.password && (
            <p className="mt-1.5 text-xs text-red-500">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="reg-confirmPassword" className="block text-sm font-medium text-gray-700">
            Confirmar contraseña
          </label>
          <div className="relative mt-1">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <input
              id="reg-confirmPassword"
              type="password"
              placeholder="••••••••"
              {...register("confirmPassword")}
              className={errors.confirmPassword ? `pl-10 ${inputErrorClasses}` : `pl-10 ${inputClasses}`}
            />
          </div>
          {errors.confirmPassword && (
            <p className="mt-1.5 text-xs text-red-500">{errors.confirmPassword.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-gray-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-gray-900/20 transition-all duration-200 hover:bg-gray-800 hover:shadow-gray-900/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none motion-reduce:active:scale-100"
        >
          {isSubmitting ? (
            <>
              <Spinner />
              Creando cuenta...
            </>
          ) : (
            "Crear Cuenta"
          )}
        </button>
      </form>
    </div>
  )
}

function ForgotPasswordForm({
  supabase,
  onLoginClick,
}: {
  supabase: ReturnType<typeof createClient>
  onLoginClick: () => void
}) {
  const [sent, setSent] = useState(false)

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

    setSent(true)
  }

  if (sent) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900">Revisa tu correo</h2>
        <p className="mt-2 text-sm text-gray-500">
          Te hemos enviado un enlace para restablecer tu contraseña.
        </p>
        <button
          onClick={onLoginClick}
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-gray-900 underline underline-offset-2 transition-colors hover:text-gray-600 motion-reduce:transition-none"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver a Iniciar Sesión
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-1 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900 text-white">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Recuperar Contraseña</h2>
          <p className="text-sm text-gray-500">
            <button onClick={onLoginClick} className="font-medium text-gray-900 underline underline-offset-2 transition-colors hover:text-gray-600 motion-reduce:transition-none">
              Volver
            </button>
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        {errors.root && (
          <div className="animate-slide-down rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600 motion-reduce:animate-none">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {errors.root.message}
            </div>
          </div>
        )}

        <p className="text-sm text-gray-500">
          Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
        </p>

        <div>
          <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700">
            Correo electrónico
          </label>
          <div className="relative mt-1">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <input
              id="forgot-email"
              type="email"
              placeholder="tu@correo.com"
              {...register("email")}
              className={errors.email ? `pl-10 ${inputErrorClasses}` : `pl-10 ${inputClasses}`}
            />
          </div>
          {errors.email && (
            <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-gray-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-gray-900/20 transition-all duration-200 hover:bg-gray-800 hover:shadow-gray-900/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none motion-reduce:active:scale-100"
        >
          {isSubmitting ? (
            <>
              <Spinner />
              Enviando...
            </>
          ) : (
            "Enviar enlace"
          )}
        </button>
      </form>
    </div>
  )
}
