"use client"

import { useAuthModal } from "@/stores/auth-modal"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect } from "react"

function LoginContent() {
  const { openAuth, isOpen } = useAuthModal()
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const redirect = searchParams.get("redirect")
    openAuth("login", redirect)
  }, [])

  useEffect(() => {
    if (!isOpen) {
      router.replace("/")
    }
  }, [isOpen, router])

  return null
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}
