import Link from "next/link"

const footerLinks = {
  productos: [
    { label: "Filtros de Agua", href: "/categories/filtros-de-agua" },
    { label: "Accesorios", href: "/categories/accesorios" },
    { label: "Ofertas", href: "/categories/ofertas" },
  ],
  soporte: [
    { label: "Contacto", href: "/contacto" },
    { label: "Preguntas Frecuentes", href: "/faq" },
    { label: "Términos y Condiciones", href: "/terminos" },
    { label: "Política de Privacidad", href: "/privacidad" },
  ],
  cuenta: [
    { label: "Mi Cuenta", href: "/account" },
    { label: "Mis Pedidos", href: "/account/orders" },
    { label: "Favoritos", href: "/account/favorites" },
  ],
}

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">GoGi</h3>
            <p className="mt-2 text-sm text-gray-600">
              Tu tienda de confianza
            </p>
          </div>
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold text-gray-900 capitalize">
                {title}
              </h3>
              <ul className="mt-2 space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-600 hover:text-gray-900"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-8 border-t border-gray-200 pt-8 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} GoGi. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  )
}
