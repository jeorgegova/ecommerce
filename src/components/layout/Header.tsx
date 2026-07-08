"use client"

import SearchBar from "@/components/store/SearchBar"
import CartBadge from "@/components/store/CartBadge"
import UserMenu from "@/components/layout/UserMenu"
import { createClient } from "@/lib/supabase/client"
import { useAuthModal } from "@/stores/auth-modal"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import type { User } from "@supabase/supabase-js"

interface CategoryNode { id: string; name: string; slug: string; children: CategoryNode[] }

export default function Header() {
  const [user, setUser] = useState<User | null>(null)
  const [userName, setUserName] = useState<string | undefined>(undefined)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [categories, setCategories] = useState<CategoryNode[]>([])
  const router = useRouter()
  const supabase = createClient()
  const { openAuth } = useAuthModal()

  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
      if (data.user) {
        const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", data.user.id).single()
        setIsAdmin(profile?.role === "admin")
        setUserName(profile?.full_name || data.user.email?.split("@")[0])
      }
      setLoading(false)
    }
    getUser()

    const fetchCategories = async () => {
      const { data } = await supabase.from("categories").select("*").eq("is_active", true).order("sort_order", { ascending: true }).order("name", { ascending: true })
      if (data) {
        const buildTree = (items: typeof data, parentId: string | null = null): CategoryNode[] =>
          items.filter((item) => item.parent_id === parentId).map((item) => ({ id: item.id, name: item.name, slug: item.slug, children: buildTree(items, item.id) }))
        setCategories(buildTree(data))
      }
    }
    fetchCategories()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) { setUserName(undefined); setIsAdmin(false) }
    })
    return () => subscription.unsubscribe()
  }, [supabase])

  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/"); router.refresh() }

  return (
    <header className={`sticky top-0 border-b border-gray-100 bg-white/90 backdrop-blur-xl supports-[backdrop-filter]:bg-white/80 ${menuOpen ? "z-50" : "z-40"}`}>
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:h-16 lg:gap-5 lg:px-8">
        <Link href="/" className="flex-shrink-0 text-xl font-bold tracking-tight text-gray-900 lg:text-2xl hover:opacity-80 transition-opacity">
          GoGi
        </Link>

        <div className="flex-1 max-w-xl mx-auto">
          <SearchBar />
        </div>

        <nav className="hidden items-center gap-6 lg:flex">
          <div className="relative group">
            <button className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors py-1">
              Categorías
            </button>
            {categories.length > 0 && (
              <div className="absolute left-0 top-full z-50 hidden w-56 rounded-2xl border border-gray-100 bg-white p-1.5 shadow-xl shadow-gray-100 group-hover:block animate-scale-in origin-top-left">
                {categories.map((cat) => (
                  <div key={cat.id} className="relative group/sub">
                    <Link href={`/categories/${cat.slug}`} className="block rounded-xl px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">{cat.name}</Link>
                    {cat.children.length > 0 && (
                      <div className="absolute left-full top-0 hidden w-56 rounded-2xl border border-gray-100 bg-white p-1.5 shadow-xl shadow-gray-100 group-hover/sub:block ml-1">
                        {cat.children.map((child) => (
                          <Link key={child.id} href={`/categories/${child.slug}`} className="block rounded-xl px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">{child.name}</Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <Link href="/products" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Productos</Link>
          <CartBadge className="text-gray-600 hover:text-gray-900 transition-colors" />
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:hidden">
          <CartBadge className="touch-target flex items-center justify-center text-gray-700" />
          <button className="touch-target flex items-center justify-center text-gray-700" onClick={() => setMenuOpen(!menuOpen)}>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>

        {loading ? null : user ? (
          <div className="hidden lg:block"><UserMenu userName={userName} isAdmin={isAdmin} onLogout={handleLogout} /></div>
        ) : (
          <>
            <button onClick={() => openAuth("login")} className="hidden text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors lg:block">Iniciar Sesión</button>
            <button onClick={() => openAuth("register")} className="hidden rounded-full bg-gray-900 px-5 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-all duration-200 hover:shadow-md lg:block">Registrarse</button>
          </>
        )}
      </div>

      {mounted && menuOpen && createPortal(
        <>
          <div className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm lg:hidden" onClick={() => setMenuOpen(false)} />
          <div className="fixed inset-y-0 right-0 z-[70] w-[300px] max-w-[85vw] border-l border-gray-100 bg-white shadow-2xl shadow-black/5 lg:hidden animate-slide-down overflow-y-auto">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-50 bg-white/95 backdrop-blur-xl px-5 py-4">
              <p className="text-sm font-semibold text-gray-900">Menú</p>
              <button onClick={() => setMenuOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="px-5 py-5">
              {user ? (
                <div className="mb-6 flex items-center gap-3.5">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-900 text-sm font-semibold text-white">{(userName || "U").charAt(0).toUpperCase()}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{userName || "Usuario"}</p>
                    <p className="text-xs text-gray-400">{isAdmin ? "Administrador" : "Comprador"}</p>
                  </div>
                </div>
              ) : (
                <div className="mb-6 flex gap-2">
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
                  <Link href="/account/addresses" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    Direcciones
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
                      <Link href="/admin/products" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-500 hover:bg-gray-50 transition-colors">
                        <svg className="h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                        Productos
                      </Link>
                      <Link href="/admin/orders" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-500 hover:bg-gray-50 transition-colors">
                        <svg className="h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        Pedidos
                      </Link>
                    </>

                  )}
                </div>
              )}

              <CartBadge className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors w-full" onClick={() => setMenuOpen(false)} showLabel />

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

function MenuRowLink({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
  return <Link href={href} onClick={onClick} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[14px] text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">{children}</Link>
}

function MenuQuickLink({ href, icon, label, onClick }: { href: string; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick}
      className="flex flex-col items-center gap-1.5 rounded-2xl bg-gray-50 py-3.5 text-center transition-colors hover:bg-gray-100">
      <span className="text-gray-500">{icon}</span>
      <span className="text-[12px] font-medium text-gray-600">{label}</span>
    </Link>
  )
}
