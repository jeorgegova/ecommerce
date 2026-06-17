"use client"

import SearchBar from "@/components/store/SearchBar"
import { createClient } from "@/lib/supabase/client"
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
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [categories, setCategories] = useState<CategoryNode[]>([])
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
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
          <Link href="/cart" className="text-sm font-medium text-gray-700 hover:text-gray-900">
            Carrito
          </Link>
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
          <>
            <Link
              href="/account"
              className="hidden text-sm font-medium text-gray-700 hover:text-gray-900 md:block"
            >
              Mi Cuenta
            </Link>
            <button
              onClick={handleLogout}
              className="hidden text-sm font-medium text-gray-500 hover:text-gray-700 md:block"
            >
              Cerrar Sesión
            </button>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="hidden text-sm font-medium text-gray-700 hover:text-gray-900 md:block"
            >
              Iniciar Sesión
            </Link>
            <Link
              href="/register"
              className="hidden rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 md:block"
            >
              Registrarse
            </Link>
          </>
        )}
      </div>

      {menuOpen && (
        <div className="border-t border-gray-200 px-4 py-4 md:hidden">
          <nav className="space-y-2">
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
            <Link
              href="/cart"
              className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setMenuOpen(false)}
            >
              Carrito
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
