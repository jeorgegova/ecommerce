"use client"

import { useAuthModal } from "@/stores/auth-modal"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function RegisterPage() {
  const { openAuth, isOpen } = useAuthModal()
  const router = useRouter()

  useEffect(() => {
    openAuth("register")
  }, [])

  useEffect(() => {
    if (!isOpen) {
      router.replace("/")
    }
  }, [isOpen, router])

  return null
}
