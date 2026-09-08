"use client"

import CartBadge from "@/components/store/CartBadge"
import NotificationBell from "@/components/store/NotificationBell"
import UserMenu from "@/components/layout/UserMenu"
import { createClient } from "@/lib/supabase/client"
import { useAuthModal } from "@/stores/auth-modal"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useMemo, useState, useSyncExternalStore } from "react"
import { createPortal } from "react-dom"
import type { User } from "@supabase/supabase-js"

const emptySubscribe = () => () => {}

const NAV_LINKS = [
  { href: "/", label: "INICIO" },
  { href: "/somos", label: "SOMOS" },
  { href: "/recetas", label: "RECETAS" },
  { href: "/products", label: "TIENDA" },
  { href: "/contacto", label: "CONTACTO" },
]

export default function Header() {
  const [user, setUser] = useState<User | null>(null)
  const [userName, setUserName] = useState<string | undefined>(undefined)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = useMemo(() => createClient(), [])
  const { openAuth } = useAuthModal()

  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)

  useEffect(() => {
    const loadUser = async (authUser: User | null) => {
      setUser(authUser)
      if (authUser) {
        const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", authUser.id).single()
        setIsAdmin(profile?.role === "admin")
        setUserName(profile?.full_name || authUser.email?.split("@")[0])
      } else {
        setUserName(undefined)
        setIsAdmin(false)
      }
      setLoading(false)
    }
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      await loadUser(data.user)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      void loadUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [supabase])

  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/"); router.refresh() }

  const isActive = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href)

  return (
    <header className={`fixed inset-x-0 top-0 z-50 bg-gray-500/40 backdrop-blur-md supports-[backdrop-filter]:bg-gray-500/30 ${menuOpen ? "z-[60]" : ""}`}>
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:h-16 lg:gap-8 lg:px-8">
        <Link href="/" className="flex-shrink-0 hover:opacity-90 transition-opacity">
          <span
            className="block text-2xl leading-none text-white drop-shadow-sm lg:text-3xl -rotate-2"
            style={{ fontFamily: "var(--font-logo), cursive" }}
          >
            amelatte
          </span>
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-6 lg:flex xl:gap-9">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-[13px] font-semibold tracking-wide text-white transition-opacity hover:opacity-75 ${
                isActive(link.href) ? "underline underline-offset-8 decoration-2" : ""
              }`}
            >
              {link.label}
            </Link>
          ))}

          <Link
            href="/search"
            aria-label="Buscar"
            className="flex h-9 w-9 items-center justify-center rounded-full text-white transition-colors hover:bg-white/20"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
            </svg>
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-3 lg:ml-0 lg:gap-4">
          <CartBadge className="hidden items-center text-white hover:opacity-80 transition-opacity lg:inline-flex" showTotal />

          {loading ? null : user ? (
            <>
              <div className="hidden lg:block text-white"><NotificationBell /></div>
              <div className="hidden lg:block"><UserMenu userName={userName} isAdmin={isAdmin} onLogout={handleLogout} /></div>
            </>
          ) : (
            <button onClick={() => openAuth("login")} className="hidden text-[13px] font-semibold text-white hover:opacity-75 transition-opacity lg:block">
              Iniciar Sesión
            </button>
          )}

          <CartBadge className="inline-flex items-center text-white lg:hidden" />

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menú"
            className="flex h-9 w-9 items-center justify-center rounded-full text-white transition-colors hover:bg-white/20 lg:hidden"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />}
            </svg>
          </button>
        </div>
      </div>

      {mounted && menuOpen && createPortal(
        <>
          <div className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm lg:hidden" onClick={() => setMenuOpen(false)} />
          <div className="fixed inset-y-0 right-0 z-[70] w-[300px] max-w-[85vw] overflow-y-auto border-l border-gray-100 bg-white shadow-2xl shadow-black/5 lg:hidden animate-slide-down">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-50 bg-white/95 px-5 py-4 backdrop-blur-xl">
              <span
                className="text-xl leading-none text-gray-900"
                style={{ fontFamily: "var(--font-logo), cursive" }}
              >
                amelatte
              </span>
              <button onClick={() => setMenuOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="px-5 py-5">
              <nav className="space-y-1 border-b border-gray-100 pb-5">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={`block rounded-xl px-3 py-2.5 text-sm font-semibold uppercase tracking-wide transition-colors ${
                      isActive(link.href) ? "bg-gray-50 text-[#C8102E]" : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              {user ? (
                <div className="mb-6 mt-5 flex items-center gap-3.5">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-900 text-sm font-semibold text-white">{(userName || "U").charAt(0).toUpperCase()}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{userName || "Usuario"}</p>
                    <p className="text-xs text-gray-400">{isAdmin ? "Administrador" : "Comprador"}</p>
                  </div>
                </div>
              ) : (
                <div className="mb-6 mt-5 flex gap-2">
                  <button onClick={() => { setMenuOpen(false); openAuth("login") }} className="flex-1 rounded-full border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Iniciar Sesión</button>
                  <button onClick={() => { setMenuOpen(false); openAuth("register") }} className="flex-1 rounded-full bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors">Registrarse</button>
                </div>
              )}

              {user && (
                <div className="space-y-1 mb-6">
                  <Link href="/account/orders" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                    Mis Pedidos
                  </Link>
                  <Link href="/account/favorites" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                    Favoritos
                  </Link>
                  <Link href="/notifications" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>
                    Notificaciones
                  </Link>
                  <Link href="/account/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    Mi Perfil
                  </Link>
                  {isAdmin && (
                    <>
                      <div className="my-1 border-t border-gray-50" />
                      <Link href="/admin/dashboard" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-500 hover:bg-gray-50 transition-colors">
                        <svg className="h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        Dashboard
                      </Link>
                    </>
                  )}
                </div>
              )}

              <CartBadge className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors w-full" onClick={() => setMenuOpen(false)} showLabel showTotal />

              {user && (
                <button onClick={() => { setMenuOpen(false); handleLogout() }}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-gray-200 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors">
                  Cerrar Sesión
                </button>
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </header>
  )
}
