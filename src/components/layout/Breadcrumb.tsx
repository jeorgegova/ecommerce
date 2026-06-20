"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const pathLabels: Record<string, string> = {
  account: "Mi Cuenta",
  orders: "Mis Pedidos",
  favorites: "Favoritos",
  addresses: "Direcciones",
  profile: "Mi Perfil",
  history: "Historial",
  admin: "Administración",
  dashboard: "Dashboard",
  products: "Productos",
  categories: "Categorías",
  inventory: "Inventario",
  reviews: "Reseñas",
  questions: "Preguntas",
  import: "Importar",
  new: "Nuevo",
  checkout: "Checkout",
  cart: "Carrito",
  search: "Buscar",
}

interface BreadcrumbProps {
  currentLabel?: string
}

export default function Breadcrumb({ currentLabel }: BreadcrumbProps) {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  if (segments.length === 0) return null

  const crumbs = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/")
    const isLast = index === segments.length - 1
    const isDynamic = segment.match(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    )
    const label = isLast && currentLabel
      ? currentLabel
      : isDynamic
        ? `#${segment.slice(0, 8)}`
        : pathLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)

    return { href, label, isLast }
  })

  // Ensure Home is always first
  if (crumbs.length === 0 || crumbs[0].label !== "Inicio") {
    crumbs.unshift({ href: "/", label: "Inicio", isLast: false })
  }

  return (
    <nav aria-label="Migas de pan" className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
      <ol className="flex flex-wrap items-center gap-1 text-sm">
        {crumbs.map((crumb, index) => (
          <li key={crumb.href} className="flex items-center gap-1">
            {index > 0 && (
              <svg
                className="h-4 w-4 flex-shrink-0 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            )}
            {crumb.isLast ? (
              <span className="font-medium text-gray-900">{crumb.label}</span>
            ) : (
              <Link
                href={crumb.href}
                className="text-gray-500 transition-colors hover:text-gray-700"
              >
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
