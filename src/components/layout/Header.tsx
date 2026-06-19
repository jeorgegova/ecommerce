"use client"

import SearchBar from "@/components/store/SearchBar"
import CartBadge from "@/components/store/CartBadge"
import UserMenu from "@/components/layout/UserMenu"
import { createClient } from "@/lib/supabase/client"
import { useAuthModal } from "@/stores/auth-modal"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"

interface CategoryNode {
  id: string
  name: string
  slug: string
  children: CategoryNode[]
}

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

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, full_name")
          .eq("id", data.user.id)
          .single()
        setIsAdmin(profile?.role === "admin")
        setUserName(profile?.full_name || data.user.email?.split("@")[0])
      }
      setLoading(false)
    }
    getUser()

    const fetchCategories = async () => {
      const { data } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true })

      if (data) {
        const buildTree = (items: typeof data, parentId: string | null = null): CategoryNode[] =>
          items
            .filter((item) => item.parent_id === parentId)
            .map((item) => ({
              id: item.id,
              name: item.name,
              slug: item.slug,
              children: buildTree(items, item.id),
            }))
        setCategories(buildTree(data))
      }
    }
    fetchCategories()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) {
        setUserName(undefined)
        setIsAdmin(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex-shrink-0 text-2xl font-bold tracking-tight text-gray-900">
          GoGi
        </Link>

        <SearchBar />

        <nav className="hidden items-center gap-6 md:flex">
          <div className="relative group">
            <button className="text-sm font-medium text-gray-700 hover:text-gray-900">
              Categorías
            </button>
            {categories.length > 0 && (
              <div className="absolute left-0 top-full z-50 hidden w-56 rounded-xl border border-gray-200 bg-white p-2 shadow-lg group-hover:block">
                {categories.map((cat) => (
                  <div key={cat.id} className="relative group/sub">
                    <Link
                      href={`/categories/${cat.slug}`}
                      className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    >
                      {cat.name}
                    </Link>
                    {cat.children.length > 0 && (
                      <div className="absolute left-full top-0 hidden w-56 rounded-xl border border-gray-200 bg-white p-2 shadow-lg group-hover/sub:block">
                        {cat.children.map((child) => (
                          <Link
                            key={child.id}
                            href={`/categories/${child.slug}`}
                            className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <Link href="/products" className="text-sm font-medium text-gray-700 hover:text-gray-900">
            Productos
          </Link>
          <CartBadge className="text-gray-700 hover:text-gray-900" />
        </nav>

        <button
          className="md:hidden text-gray-700"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>

        {loading ? null : user ? (
          <UserMenu
            userName={userName}
            isAdmin={isAdmin}
            onLogout={handleLogout}
          />
        ) : (
          <>
            <button
              onClick={() => openAuth("login")}
              className="hidden text-sm font-medium text-gray-700 hover:text-gray-900 md:block"
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => openAuth("register")}
              className="hidden rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 md:block"
            >
              Registrarse
            </button>
          </>
        )}
      </div>

      {menuOpen && (
        <div className="border-t border-gray-200 px-4 py-4 md:hidden">
          {user ? (
            <div className="mb-4 flex items-center gap-3 border-b border-gray-100 pb-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 text-sm font-medium text-white">
                {(userName || "U").charAt(0).toUpperCase()}
              </span>
              <div>
                <p className="text-sm font-semibold text-gray-900">{userName || "Usuario"}</p>
                <p className="text-xs text-gray-500">{isAdmin ? "Administrador" : "Comprador"}</p>
              </div>
            </div>
          ) : (
            <div className="mb-4 flex gap-2 border-b border-gray-100 pb-4">
              <button
                onClick={() => { setMenuOpen(false); openAuth("login") }}
                className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Iniciar Sesión
              </button>
              <button
                onClick={() => { setMenuOpen(false); openAuth("register") }}
                className="flex-1 rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
              >
                Registrarse
              </button>
            </div>
          )}

          <nav className="space-y-1">
            {user && (
              <>
                <Link
                  href="/account/orders"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setMenuOpen(false)}
                >
                  Mis Pedidos
                </Link>
                <Link
                  href="/account/favorites"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setMenuOpen(false)}
                >
                  Favoritos
                </Link>
                <Link
                  href="/account/profile"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setMenuOpen(false)}
                >
                  Mi Perfil
                </Link>
                <Link
                  href="/account/addresses"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setMenuOpen(false)}
                >
                  Direcciones
                </Link>
                {isAdmin && (
                  <>
                    <div className="my-2 border-t border-gray-100" />
                    <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Administración
                    </p>
                    <Link
                      href="/admin/dashboard"
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/admin/products"
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setMenuOpen(false)}
                    >
                      Productos
                    </Link>
                    <Link
                      href="/admin/orders"
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setMenuOpen(false)}
                    >
                      Pedidos
                    </Link>
                    <Link
                      href="/admin/categories"
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setMenuOpen(false)}
                    >
                      Categorías
                    </Link>
                    <Link
                      href="/admin/inventory"
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setMenuOpen(false)}
                    >
                      Inventario
                    </Link>
                  </>
                )}
                <div className="my-2 border-t border-gray-100" />
                <button
                  onClick={() => { setMenuOpen(false); handleLogout() }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Cerrar Sesión
                </button>
              </>
            )}

            <div className="my-2 border-t border-gray-100" />
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => setMenuOpen(false)}
              >
                {cat.name}
              </Link>
            ))}
            <Link
              href="/products"
              className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setMenuOpen(false)}
            >
              Productos
            </Link>
            <CartBadge
              className="rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full"
              onClick={() => setMenuOpen(false)}
              showLabel
            />
          </nav>
        </div>
      )}
    </header>
  )
}
