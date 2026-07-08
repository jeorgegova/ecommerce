"use client"

import CartBadge from "@/components/store/CartBadge"
import { useAuthModal } from "@/stores/auth-modal"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function MobileBottomNav() {
  const pathname = usePathname()
  const { openAuth } = useAuthModal()

  const isActive = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href)

  return (
    <nav className="flex-shrink-0 lg:hidden" style={{ paddingBottom: "var(--safe-area-inset-bottom)" }}>
      <div className="border-t border-gray-100 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-around px-1">
          <Link href="/" className="touch-target flex flex-1 flex-col items-center justify-center gap-0.5">
            <svg className={`h-6 w-6 transition-colors duration-200 ${isActive("/") ? "text-gray-900" : "text-gray-400"}`} viewBox="0 0 24 24" fill={isActive("/") ? "currentColor" : "none"} stroke="currentColor" strokeWidth={isActive("/") ? 0 : 1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955a1.126 1.126 0 0 1 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            <span className={`text-[10px] font-medium transition-colors duration-200 ${isActive("/") ? "text-gray-900" : "text-gray-400"}`}>Inicio</span>
          </Link>

          <Link href="/categories" className="touch-target flex flex-1 flex-col items-center justify-center gap-0.5">
            <svg className={`h-6 w-6 transition-colors duration-200 ${isActive("/categories") ? "text-gray-900" : "text-gray-400"}`} viewBox="0 0 24 24" fill={isActive("/categories") ? "currentColor" : "none"} stroke="currentColor" strokeWidth={isActive("/categories") ? 0 : 1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6Zm0 9.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6Zm0 9.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
            </svg>
            <span className={`text-[10px] font-medium transition-colors duration-200 ${isActive("/categories") ? "text-gray-900" : "text-gray-400"}`}>Categorías</span>
          </Link>

          <button onClick={() => openAuth("login", "/account/favorites")} className="touch-target flex flex-1 flex-col items-center justify-center gap-0.5">
            <svg className="h-6 w-6 text-gray-400 transition-colors duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
            </svg>
            <span className="text-[10px] font-medium text-gray-400">Favoritos</span>
          </button>

          <div className="touch-target flex flex-1 flex-col items-center justify-center gap-0.5">
            <CartBadge className="flex flex-col items-center gap-0.5 text-gray-400" />
            <span className="text-[10px] font-medium text-gray-400">Carrito</span>
          </div>

          <Link href="/account" className="touch-target flex flex-1 flex-col items-center justify-center gap-0.5">
            <svg className={`h-6 w-6 transition-colors duration-200 ${isActive("/account") ? "text-gray-900" : "text-gray-400"}`} viewBox="0 0 24 24" fill={isActive("/account") ? "currentColor" : "none"} stroke="currentColor" strokeWidth={isActive("/account") ? 0 : 1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
            <span className={`text-[10px] font-medium transition-colors duration-200 ${isActive("/account") ? "text-gray-900" : "text-gray-400"}`}>Perfil</span>
          </Link>
        </div>
      </div>
    </nav>
  )
}
