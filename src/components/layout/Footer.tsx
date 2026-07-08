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
    <footer className="hidden border-t border-gray-100 bg-gray-50/50 lg:block">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          <div>
            <Link href="/" className="text-lg font-bold tracking-tight text-gray-900">GoGi</Link>
            <p className="mt-3 text-sm text-gray-500 leading-relaxed">Tu tienda de confianza para productos de calidad al mejor precio.</p>
          </div>
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">{title}</h3>
              <ul className="mt-4 space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 border-t border-gray-200 pt-8 flex items-center justify-between">
          <p className="text-[13px] text-gray-400">&copy; {new Date().getFullYear()} GoGi. Todos los derechos reservados.</p>
          <p className="text-[13px] text-gray-400">Hecho en Colombia</p>
        </div>
      </div>
    </footer>
  )
}
