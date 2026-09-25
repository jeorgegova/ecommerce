"use client"

import { createClient } from "@/lib/supabase/client"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"
import AmelatteLogo from "@/assets/Logo-Amelatte.png"

type Status = "checking" | "confirmed" | "invalid"

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [status, setStatus] = useState<Status>("checking")

  useEffect(() => {
    const verifyToken = async () => {
      const tokenHash = searchParams.get("token_hash")
      const type = searchParams.get("type")

      if (!tokenHash || !type) {
        setStatus("invalid")
        return
      }

      if (type === "recovery") {
        window.location.href = `/reset-password?token_hash=${tokenHash}&type=recovery`
        return
      }

      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as "signup",
      })
      setStatus(error ? "invalid" : "confirmed")
    }
    verifyToken()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-sm rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-xl shadow-gray-900/5">
        <div className="flex justify-center">
          <Image src={AmelatteLogo} alt="Amelatte" className="h-10 w-auto" priority />
        </div>

        {status === "checking" && (
          <div className="mt-10 flex flex-col items-center gap-3 pb-4">
            <svg className="h-8 w-8 animate-spin text-[#C8102E]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm text-gray-500">Verificando tu correo...</p>
          </div>
        )}

        {status === "confirmed" && (
          <>
            <div className="mx-auto mt-8 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h1 className="mt-5 text-2xl font-bold text-gray-900">¡Correo verificado!</h1>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              Tu cuenta quedó activada. Ya puedes iniciar sesión y disfrutar del mejor café.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[#C8102E] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#9E0C24]"
            >
              Iniciar sesión
            </Link>
          </>
        )}

        {status === "invalid" && (
          <>
            <div className="mx-auto mt-8 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <h1 className="mt-5 text-2xl font-bold text-gray-900">Enlace inválido</h1>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              Este enlace expiró o ya fue usado. Regístrate de nuevo para recibir otro correo de
              verificación.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
            >
              Volver a Iniciar Sesión
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  )
}
