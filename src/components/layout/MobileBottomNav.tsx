"use client"

import CartBadge from "@/components/store/CartBadge"
import { createClient } from "@/lib/supabase/client"
import { useAuthModal } from "@/stores/auth-modal"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createPortal } from "react-dom"
import { useEffect, useState } from "react"

export default function MobileBottomNav() {
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { openAuth } = useAuthModal()

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser(data.user)
        supabase.from("profiles").select("role").eq("id", data.user.id).single().then(({ data: profile }) => {
          if (profile?.role === "admin") setIsAdmin(true)
        })
      }
    })
  }, [supabase])

  const isActive = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setMenuOpen(false)
    router.push("/")
    router.refresh()
  }

  const handleFavorites = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    user ? router.push("/account/favorites") : openAuth("login", "/account/favorites")
  }

  const items = [
    { href: "/", label: "Inicio", icon: <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955a1.126 1.126 0 0 1 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /> },
    { href: "/categories", label: "Categorías", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6Zm0 9.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6Zm0 9.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" /> },
  ]

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 flex-shrink-0 lg:hidden bg-white/95 backdrop-blur-xl border-t border-gray-100 z-50" style={{ paddingBottom: "var(--safe-area-inset-bottom)" }}>
        <div className="border-t border-gray-100 bg-white/95 backdrop-blur-xl">
          <div className="mx-auto flex h-14 max-w-lg items-center justify-around px-1">
            <Link href="/" className="touch-target flex flex-1 flex-col items-center justify-center gap-0.5">
              <svg className={`h-6 w-6 transition-colors duration-200 ${isActive("/") ? "text-colombia-blue" : "text-gray-400"}`} viewBox="0 0 24 24" fill={isActive("/") ? "currentColor" : "none"} stroke="currentColor" strokeWidth={isActive("/") ? 0 : 1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955a1.126 1.126 0 0 1 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
              <span className={`text-[10px] font-semibold transition-colors duration-200 ${isActive("/") ? "text-colombia-blue" : "text-gray-400"}`}>Inicio</span>
            </Link>

            <Link href="/categories" className="touch-target flex flex-1 flex-col items-center justify-center gap-0.5">
              <svg className={`h-6 w-6 transition-colors duration-200 ${isActive("/categories") ? "text-colombia-blue" : "text-gray-400"}`} viewBox="0 0 24 24" fill={isActive("/categories") ? "currentColor" : "none"} stroke="currentColor" strokeWidth={isActive("/categories") ? 0 : 1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6Zm0 9.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6Zm0 9.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
              </svg>
              <span className={`text-[10px] font-semibold transition-colors duration-200 ${isActive("/categories") ? "text-colombia-blue" : "text-gray-400"}`}>Categorías</span>
            </Link>

            <button onClick={handleFavorites} className="touch-target flex flex-1 flex-col items-center justify-center gap-0.5">
              <svg className="h-6 w-6 text-gray-400 transition-colors duration-200 hover:text-colombia-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
              </svg>
              <span className="text-[10px] font-medium text-gray-400">Favoritos</span>
            </button>

            <div className="touch-target flex flex-1 flex-col items-center justify-center gap-0.5">
              <CartBadge className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-colombia-blue" />
              <span className="text-[10px] font-medium text-gray-400">Carrito</span>
            </div>

            <Link href="/account" className="touch-target flex flex-1 flex-col items-center justify-center gap-0.5">
              <svg className={`h-6 w-6 transition-colors duration-200 ${isActive("/account") ? "text-colombia-blue" : "text-gray-400"}`} viewBox="0 0 24 24" fill={isActive("/account") ? "currentColor" : "none"} stroke="currentColor" strokeWidth={isActive("/account") ? 0 : 1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
              <span className={`text-[10px] font-semibold transition-colors duration-200 ${isActive("/account") ? "text-colombia-blue" : "text-gray-400"}`}>Perfil</span>
            </Link>

            {isAdmin && (
              <button onClick={() => setMenuOpen(true)} className="touch-target flex flex-1 flex-col items-center justify-center gap-0.5">
                <svg className={`h-6 w-6 transition-colors duration-200 ${menuOpen ? "text-colombia-blue" : "text-gray-400"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
                <span className={`text-[10px] font-semibold transition-colors duration-200 ${menuOpen ? "text-colombia-blue" : "text-gray-400"}`}>Más</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {mounted && menuOpen && isAdmin && createPortal(
        <>
          <div className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm lg:hidden" onClick={() => setMenuOpen(false)} />
          <div className="fixed inset-x-0 bottom-0 z-[70] mx-auto max-w-lg lg:hidden animate-slide-up rounded-t-2xl border-t border-gray-100 bg-white shadow-2xl shadow-black/5" style={{ paddingBottom: "var(--safe-area-inset-bottom)" }}>
            <div className="flex items-center justify-center py-2">
              <div className="h-1 w-8 rounded-full bg-gray-300" />
            </div>
            <div className="px-5 pb-6">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Administración</p>
              <div className="mt-3 grid grid-cols-4 gap-2">
                <Link href="/admin/dashboard" onClick={() => setMenuOpen(false)}
                  className="flex flex-col items-center gap-1.5 rounded-xl bg-gray-50 py-3 transition-colors hover:bg-gray-100 active:bg-gray-200">
                  <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="text-[10px] font-medium text-gray-600">Dashboard</span>
                </Link>
                <Link href="/admin/products" onClick={() => setMenuOpen(false)}
                  className="flex flex-col items-center gap-1.5 rounded-xl bg-gray-50 py-3 transition-colors hover:bg-gray-100 active:bg-gray-200">
                  <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <span className="text-[10px] font-medium text-gray-600">Productos</span>
                </Link>
                <Link href="/admin/orders" onClick={() => setMenuOpen(false)}
                  className="flex flex-col items-center gap-1.5 rounded-xl bg-gray-50 py-3 transition-colors hover:bg-gray-100 active:bg-gray-200">
                  <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-[10px] font-medium text-gray-600">Pedidos</span>
                </Link>
                <Link href="/admin/categories" onClick={() => setMenuOpen(false)}
                  className="flex flex-col items-center gap-1.5 rounded-xl bg-gray-50 py-3 transition-colors hover:bg-gray-100 active:bg-gray-200">
                  <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <span className="text-[10px] font-medium text-gray-600">Categorías</span>
                </Link>
                <Link href="/admin/inventory" onClick={() => setMenuOpen(false)}
                  className="flex flex-col items-center gap-1.5 rounded-xl bg-gray-50 py-3 transition-colors hover:bg-gray-100 active:bg-gray-200">
                  <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <span className="text-[10px] font-medium text-gray-600">Inventario</span>
                </Link>
                <Link href="/admin/reviews" onClick={() => setMenuOpen(false)}
                  className="flex flex-col items-center gap-1.5 rounded-xl bg-gray-50 py-3 transition-colors hover:bg-gray-100 active:bg-gray-200">
                  <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  <span className="text-[10px] font-medium text-gray-600">Reseñas</span>
                </Link>
                <Link href="/admin/questions" onClick={() => setMenuOpen(false)}
                  className="flex flex-col items-center gap-1.5 rounded-xl bg-gray-50 py-3 transition-colors hover:bg-gray-100 active:bg-gray-200">
                  <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-[10px] font-medium text-gray-600">Preguntas</span>
                </Link>
                <Link href="/admin/import" onClick={() => setMenuOpen(false)}
                  className="flex flex-col items-center gap-1.5 rounded-xl bg-gray-50 py-3 transition-colors hover:bg-gray-100 active:bg-gray-200">
                  <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span className="text-[10px] font-medium text-gray-600">Importar</span>
                </Link>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  )
}
