"use client"

import { createClient } from "@/lib/supabase/client"
import { useAuthModal } from "@/stores/auth-modal"
import { useAuthStore } from "@/stores/auth"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion, AnimatePresence } from "framer-motion"
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft, CheckCircle2, AlertCircle, ShieldCheck, ChevronRight, X, Loader2, LogIn, UserPlus, KeyRound } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
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

function translateAuthError(message: string): string {
  const translations: Record<string, string> = {
    "Invalid login credentials": "Correo o contraseña incorrectos",
    "Invalid email or password": "Correo o contraseña incorrectos",
    "Email not confirmed": "Debes verificar tu correo electrónico antes de iniciar sesión",
    "User not found": "No existe una cuenta con este correo",
    "User already registered": "Este correo electrónico ya está registrado",
    "Password should be at least 6 characters": "La contraseña debe tener al menos 6 caracteres",
    "Signup requires a valid email": "Ingresa un correo electrónico válido",
    "Unable to validate email address: invalid format": "El formato del correo no es válido",
    "For security purposes, you can only request this once every 60 seconds": "Por seguridad, espera 60 segundos antes de intentar de nuevo",
    "Email rate limit exceeded": "Demasiados intentos. Intenta de nuevo más tarde",
    "Email link is invalid or has expired": "El enlace de verificación no es válido o ya expiró",
    "Token has expired or is invalid": "El enlace expiró. Solicita uno nuevo",
  }
  for (const [key, value] of Object.entries(translations)) {
    if (message.toLowerCase().includes(key.toLowerCase())) return value
  }
  return message
}

const stagger = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  }),
}

const inputBase = "w-full h-14 rounded-2xl border bg-white/80 backdrop-blur-sm px-4 pl-11 text-[15px] text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-200 hover:border-gray-300 focus:border-gray-400 focus:bg-white focus:ring-4 focus:ring-gray-400/10 shadow-sm"
const inputError = "w-full h-14 rounded-2xl border-2 border-red-300 bg-red-50/50 px-4 pl-11 text-[15px] text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-200 focus:border-red-400 focus:ring-4 focus:ring-red-200 shadow-sm"

export default function AuthModal() {
  const { isOpen, view, redirectTo, registeredMessage, closeAuth, setAuthView, setRegisteredMessage } = useAuthModal()
  const router = useRouter()
  const supabase = createClient()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setVisible(true)
      document.body.style.overflow = "hidden"
    } else {
      const timer = setTimeout(() => setVisible(false), 350)
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
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-gray-100 via-gray-50/50 to-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-gray-300/10 blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-gray-200/10 blur-3xl" />
            <div className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full bg-gray-300/5 blur-3xl" />
            <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-gray-200/10 blur-2xl" />
            <svg className="absolute top-0 right-0 opacity-[0.03]" width="400" height="400" viewBox="0 0 400 400">
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-gray-900" />
              </pattern>
              <rect width="400" height="400" fill="url(#grid)" />
            </svg>
          </div>

          <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" onClick={closeAuth} />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-50 w-full max-w-5xl overflow-hidden rounded-[28px] bg-white/90 backdrop-blur-xl shadow-2xl shadow-black/10 ring-1 ring-white/20 border border-white/50"
          >
            <div className="flex min-h-[580px]">
              <div className="hidden lg:flex lg:w-[42%] relative overflow-hidden bg-gradient-to-br from-gray-800 via-gray-900 to-gray-950">
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-white/20 blur-3xl -translate-y-1/2 translate-x-1/4" />
                  <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-gray-300/20 blur-3xl translate-y-1/3 -translate-x-1/4" />
                  <svg className="absolute inset-0 opacity-10" width="100%" height="100%">
                    <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                      <circle cx="2" cy="2" r="1" fill="white" />
                    </pattern>
                    <rect width="100%" height="100%" fill="url(#dots)" />
                  </svg>
                </div>

                <div className="relative z-10 flex flex-col justify-between p-10 w-full">
                  <div>
                    <motion.img
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, duration: 0.5 }}
                      src="/logoWillyMotos.png"
                      alt="Willy Motos"
                      className="h-10 w-10 object-contain brightness-0 invert mb-6"
                    />
                    <motion.h2
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.5 }}
                      className="text-3xl font-bold tracking-tight text-white leading-tight"
                    >
                      Tu tienda de repuestos
                      <br />
                      para máquinas vending
                    </motion.h2>
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4, duration: 0.5 }}
                      className="mt-3 text-gray-400 text-[15px] leading-relaxed"
                    >
                      Todo lo que necesitas para mantener tus máquinas funcionando al máximo.
                    </motion.p>
                  </div>
                </div>
              </div>

              <div className="flex-1 relative">
                <button
                  onClick={closeAuth}
                  className="absolute top-4 right-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-gray-100/80 text-gray-400 backdrop-blur-sm transition-all duration-200 hover:bg-gray-200 hover:text-gray-600 hover:scale-105"
                  aria-label="Cerrar"
                >
                  <X className="h-4 w-4" strokeWidth={2.5} />
                </button>

                <div className="h-full overflow-y-auto">
                  <div className="px-6 py-10 sm:px-10 sm:py-12">
                    <AnimatePresence mode="wait">
                      {view === "login" && (
                        <LoginForm
                          key="login"
                          supabase={supabase} router={router} redirectTo={redirectTo}
                          registeredMessage={registeredMessage}
                          onRegisterClick={() => { setAuthView("register"); setRegisteredMessage(false) }}
                          onForgotClick={() => setAuthView("forgot-password")}
                          onSuccess={() => closeAuth()}
                        />
                      )}
                      {view === "register" && (
                        <RegisterForm
                          key="register"
                          supabase={supabase}
                          onLoginClick={() => setAuthView("login")}
                          onSuccess={() => { setRegisteredMessage(true); setAuthView("login") }}
                        />
                      )}
                      {view === "forgot-password" && (
                        <ForgotPasswordForm key="forgot" supabase={supabase} onLoginClick={() => setAuthView("login")} />
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

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
  const [showPassword, setShowPassword] = useState(false)

  const onSubmit = async (data: LoginForm) => {
    const { error } = await supabase.auth.signInWithPassword({ email: data.email, password: data.password })
    if (error) { setError("root", { message: translateAuthError(error.message) }); return }
    onSuccess()
    await useAuthStore.getState().refresh()
    router.refresh()
    if (redirectTo) router.push(redirectTo)
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div className="mb-6 flex items-center gap-3 lg:hidden">
        <img src="/logoWillyMotos.png" alt="Willy Motos" className="h-8 w-8 object-contain" />
        <span className="text-lg font-extrabold tracking-tight text-gray-900">Willy Motos</span>
      </motion.div>

      <motion.div custom={0} variants={stagger} initial="hidden" animate="visible" className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-[26px] font-bold tracking-tight text-gray-900">Bienvenido nuevamente</h1>
        </div>
        <p className="text-[15px] text-gray-500 leading-relaxed">
          Accede para administrar tu tienda y continuar donde lo dejaste.
        </p>
      </motion.div>

      {registeredMessage && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mb-5 rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-3.5"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-500" />
            <p className="text-[14px] font-medium text-emerald-800">Cuenta creada con éxito. Ya puedes iniciar sesión.</p>
          </div>
        </motion.div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        {errors.root && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 rounded-2xl bg-red-50 border border-red-100 px-4 py-3"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500" />
              <p className="text-[14px] font-medium text-red-700">{errors.root.message}</p>
            </div>
          </motion.div>
        )}

        <div className="space-y-4">
          <motion.div custom={1} variants={stagger} initial="hidden" animate="visible">
            <label className="block text-[13px] font-semibold text-gray-700 mb-2">Correo electrónico</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-[18px] w-[18px] text-gray-400" />
              </div>
              <input
                type="email" placeholder="tu@correo.com" {...register("email")}
                className={errors.email ? inputError : inputBase}
              />
            </div>
            {errors.email && <p className="mt-1.5 pl-1 text-[12px] text-red-500 font-medium">{errors.email.message}</p>}
          </motion.div>

          <motion.div custom={2} variants={stagger} initial="hidden" animate="visible">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[13px] font-semibold text-gray-700">Contraseña</label>
              <button type="button" onClick={onForgotClick}
                className="text-[12px] font-semibold text-gray-700 hover:text-gray-900 transition-colors">
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-[18px] w-[18px] text-gray-400" />
              </div>
              <input
                type={showPassword ? "text" : "password"} placeholder="••••••••" {...register("password")}
                className={errors.password ? inputError : `${inputBase} pr-12`}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
              </button>
            </div>
            {errors.password && <p className="mt-1.5 pl-1 text-[12px] text-red-500 font-medium">{errors.password.message}</p>}
          </motion.div>

          <motion.div custom={3} variants={stagger} initial="hidden" animate="visible">
            <button type="submit" disabled={isSubmitting}
              className="relative mt-2 flex w-full h-14 items-center justify-center gap-2.5 rounded-2xl bg-gray-900 text-[15px] font-semibold text-white shadow-lg shadow-gray-900/20 transition-all duration-300 hover:bg-gray-800 hover:shadow-xl hover:shadow-gray-900/25 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Iniciando sesión...</>
              ) : (
                <><LogIn className="h-4 w-4" /> Iniciar sesión</>
              )}
            </button>
          </motion.div>
        </div>
      </form>

      <motion.div custom={4} variants={stagger} initial="hidden" animate="visible" className="mt-8">
        <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-5">
          <p className="text-[14px] text-gray-600 mb-3">
            <span className="font-semibold text-gray-900">¿Nuevo en la plataforma?</span>
          </p>
          <p className="text-[13px] text-gray-500 mb-4">
            Crea tu cuenta gratis y comienza a vender repuestos para máquinas vending.
          </p>
          <button onClick={onRegisterClick}
            className="flex w-full h-12 items-center justify-center gap-2 rounded-2xl border-2 border-gray-200 bg-white text-[14px] font-semibold text-gray-700 transition-all duration-200 hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm">
            <UserPlus className="h-4 w-4" />
            Crear cuenta gratis
            <ChevronRight className="h-4 w-4 ml-1" />
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-6 flex items-center justify-center gap-1.5 text-[12px] text-gray-400"
      >
        <ShieldCheck className="h-3.5 w-3.5" />
        Tus datos están protegidos mediante cifrado SSL
      </motion.div>
    </motion.div>
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
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const onSubmit = async (data: RegisterForm) => {
    const { error } = await supabase.auth.signUp({
      email: data.email, password: data.password,
      options: { data: { full_name: data.fullName } },
    })
    if (error) { setError("root", { message: translateAuthError(error.message) }); return }
    onSuccess()
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div className="mb-6 flex items-center gap-3 lg:hidden">
        <img src="/logoWillyMotos.png" alt="Willy Motos" className="h-8 w-8 object-contain" />
        <span className="text-lg font-extrabold tracking-tight text-gray-900">Willy Motos</span>
      </motion.div>

      <motion.div custom={0} variants={stagger} initial="hidden" animate="visible" className="mb-8">
        <h1 className="text-[26px] font-bold tracking-tight text-gray-900 mb-1">Crear cuenta</h1>
        <p className="text-[15px] text-gray-500 leading-relaxed">
          Únete a Willy Motos y comienza a comprar repuestos para tus máquinas.
        </p>
      </motion.div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {errors.root && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 rounded-2xl bg-red-50 border border-red-100 px-4 py-3"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500" />
              <p className="text-[14px] font-medium text-red-700">{errors.root.message}</p>
            </div>
          </motion.div>
        )}

        <div className="space-y-4">
          <motion.div custom={1} variants={stagger} initial="hidden" animate="visible">
            <label className="block text-[13px] font-semibold text-gray-700 mb-2">Nombre completo</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-[18px] w-[18px] text-gray-400" />
              </div>
              <input type="text" placeholder="Tu nombre completo" {...register("fullName")}
                className={errors.fullName ? inputError : inputBase} />
            </div>
            {errors.fullName && <p className="mt-1.5 pl-1 text-[12px] text-red-500 font-medium">{errors.fullName.message}</p>}
          </motion.div>

          <motion.div custom={2} variants={stagger} initial="hidden" animate="visible">
            <label className="block text-[13px] font-semibold text-gray-700 mb-2">Correo electrónico</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-[18px] w-[18px] text-gray-400" />
              </div>
              <input type="email" placeholder="tu@correo.com" {...register("email")}
                className={errors.email ? inputError : inputBase} />
            </div>
            {errors.email && <p className="mt-1.5 pl-1 text-[12px] text-red-500 font-medium">{errors.email.message}</p>}
          </motion.div>

          <motion.div custom={3} variants={stagger} initial="hidden" animate="visible">
            <label className="block text-[13px] font-semibold text-gray-700 mb-2">Contraseña</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-[18px] w-[18px] text-gray-400" />
              </div>
              <input
                type={showPassword ? "text" : "password"} placeholder="Mínimo 6 caracteres" {...register("password")}
                className={errors.password ? inputError : `${inputBase} pr-12`}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
              </button>
            </div>
            {errors.password && <p className="mt-1.5 pl-1 text-[12px] text-red-500 font-medium">{errors.password.message}</p>}
          </motion.div>

          <motion.div custom={4} variants={stagger} initial="hidden" animate="visible">
            <label className="block text-[13px] font-semibold text-gray-700 mb-2">Confirmar contraseña</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-[18px] w-[18px] text-gray-400" />
              </div>
              <input
                type={showConfirm ? "text" : "password"} placeholder="Repite la contraseña" {...register("confirmPassword")}
                className={errors.confirmPassword ? inputError : `${inputBase} pr-12`}
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={showConfirm ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showConfirm ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="mt-1.5 pl-1 text-[12px] text-red-500 font-medium">{errors.confirmPassword.message}</p>}
          </motion.div>

          <motion.div custom={5} variants={stagger} initial="hidden" animate="visible">
            <button type="submit" disabled={isSubmitting}
              className="relative mt-2 flex w-full h-14 items-center justify-center gap-2.5 rounded-2xl bg-gray-900 text-[15px] font-semibold text-white shadow-lg shadow-gray-900/20 transition-all duration-300 hover:bg-gray-800 hover:shadow-xl hover:shadow-gray-900/25 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Creando cuenta...</>
              ) : (
                <><UserPlus className="h-4 w-4" /> Crear cuenta</>
              )}
            </button>
          </motion.div>
        </div>
      </form>

      <motion.div custom={6} variants={stagger} initial="hidden" animate="visible" className="mt-8 text-center">
        <p className="text-[14px] text-gray-500">
          ¿Ya tienes cuenta?{" "}
          <button onClick={onLoginClick} className="font-semibold text-gray-700 hover:text-gray-900 transition-colors">
            Iniciar sesión
          </button>
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-6 flex items-center justify-center gap-1.5 text-[12px] text-gray-400"
      >
        <ShieldCheck className="h-3.5 w-3.5" />
        Tus datos están protegidos mediante cifrado SSL
      </motion.div>
    </motion.div>
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
    if (error) { setError("root", { message: translateAuthError(error.message) }); return }
    setSent(true)
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      {sent ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center text-center py-8"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-100 mb-5">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </div>
          <h2 className="text-[22px] font-bold tracking-tight text-gray-900">Revisa tu correo</h2>
          <p className="mt-2 text-[15px] text-gray-500 max-w-sm">
            Te enviamos un enlace para restablecer tu contraseña. Si no lo encuentras, revisa tu carpeta de spam.
          </p>
          <button onClick={onLoginClick}
            className="mt-8 inline-flex items-center gap-2 text-[15px] font-semibold text-gray-700 hover:text-gray-900 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Volver a iniciar sesión
          </button>
        </motion.div>
      ) : (
        <>
          <motion.div className="mb-6 flex items-center gap-3 lg:hidden">
            <img src="/logoWillyMotos.png" alt="Willy Motos" className="h-8 w-8 object-contain" />
            <span className="text-lg font-extrabold tracking-tight text-gray-900">Willy Motos</span>
          </motion.div>

          <motion.div custom={0} variants={stagger} initial="hidden" animate="visible" className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <button onClick={onLoginClick}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <KeyRound className="h-6 w-6 text-gray-700" />
            </div>
            <h1 className="text-[26px] font-bold tracking-tight text-gray-900 mb-1">Recuperar contraseña</h1>
            <p className="text-[15px] text-gray-500 leading-relaxed">
              Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
            </p>
          </motion.div>

          <form onSubmit={handleSubmit(onSubmit)}>
            {errors.root && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 rounded-2xl bg-red-50 border border-red-100 px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500" />
                  <p className="text-[14px] font-medium text-red-700">{errors.root.message}</p>
                </div>
              </motion.div>
            )}

            <motion.div custom={1} variants={stagger} initial="hidden" animate="visible">
              <label className="block text-[13px] font-semibold text-gray-700 mb-2">Correo electrónico</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-[18px] w-[18px] text-gray-400" />
                </div>
                <input type="email" placeholder="tu@correo.com" {...register("email")}
                  className={errors.email ? inputError : inputBase} />
              </div>
              {errors.email && <p className="mt-1.5 pl-1 text-[12px] text-red-500 font-medium">{errors.email.message}</p>}
            </motion.div>

            <motion.div custom={2} variants={stagger} initial="hidden" animate="visible">
              <button type="submit" disabled={isSubmitting}
                className="relative mt-6 flex w-full h-14 items-center justify-center gap-2.5 rounded-2xl bg-gray-900 text-[15px] font-semibold text-white shadow-lg shadow-gray-900/20 transition-all duration-300 hover:bg-gray-800 hover:shadow-xl hover:shadow-gray-900/25 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                {isSubmitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</>
                ) : (
                  "Enviar enlace de recuperación"
                )}
              </button>
            </motion.div>
          </form>
        </>
      )}
    </motion.div>
  )
}
