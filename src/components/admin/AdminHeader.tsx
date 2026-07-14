"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useMemo } from "react"

const pathLabels: Record<string, string> = {
  admin: "Panel",
  dashboard: "Dashboard",
  products: "Productos",
  orders: "Pedidos",
  categories: "Categorías",
  inventory: "Inventario",
  reviews: "Reseñas",
  questions: "Preguntas",
  import: "Importar",
  new: "Nuevo",
}

export default function AdminHeader() {
  const pathname = usePathname()

  const breadcrumbs = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean)
    return segments.map((seg, i) => {
      const href = "/" + segments.slice(0, i + 1).join("/")
      const label =
        seg.length === 36
          ? "#" + seg.slice(0, 8)
          : pathLabels[seg] || seg.charAt(0).toUpperCase() + seg.slice(1)
      return { href, label, isLast: i === segments.length - 1 }
    })
  }, [pathname])

  const title = breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].label : "Panel"

  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white">
      <div className="flex h-14 items-center gap-4 px-4 lg:px-6">
        <div className="flex-1 min-w-0">
          {breadcrumbs.length > 1 && (
            <nav className="flex items-center gap-1 text-[11px] text-gray-400">
              {breadcrumbs.slice(0, -1).map((crumb) => (
                <span key={crumb.href} className="flex items-center gap-1">
                  <Link href={crumb.href} className="text-gray-400 transition-colors hover:text-gray-600">{crumb.label}</Link>
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </span>
              ))}
            </nav>
          )}
          <h1 className="text-sm font-semibold text-gray-900 truncate">{title}</h1>
        </div>

        <a
          href="/"
          className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-700"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
          Ver tienda
        </a>
      </div>
    </header>
  )
}
