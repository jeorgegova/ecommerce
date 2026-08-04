import Link from "next/link"

const footerLinks = {
  repuestos: [
    { label: "Sistemas de Pago", href: "/categories/sistemas-de-pago" },
    { label: "Mecanismos y Motores", href: "/categories/mecanismos-y-motores" },
    { label: "Componentes Electrónicos", href: "/categories/componentes-electronicos" },
    { label: "Sistemas de Refrigeración", href: "/categories/sistemas-de-refrigeracion" },
  ],
  soporte: [
    { label: "Contacto", href: "/contacto" },
    { label: "Preguntas Frecuentes", href: "/faq" },
    { label: "Garantías y Cambios", href: "/garantias" },
    { label: "Términos de Envío", href: "/envios" },
  ],
  cuenta: [
    { label: "Mi Perfil", href: "/account" },
    { label: "Historial de Pedidos", href: "/account/orders" },
    { label: "Mis Favoritos", href: "/account/favorites" },
  ],
}

export default function Footer() {
  return (
    <footer className="border-t border-gray-900 bg-gray-950 text-gray-400 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Vista Desktop (md y superior) */}
        <div className="hidden md:grid grid-cols-4 gap-10 py-12">
          <div className="space-y-4">
            <Link href="/" className="group flex items-center gap-2 hover:opacity-90 transition-opacity">
              <div className="relative flex items-center justify-center p-1 bg-gray-900 rounded-lg border border-gray-800 shadow-xs">
                <img src="/logoWilMotos.png" alt="Wil Motos" className="h-6 w-6 object-contain" />
              </div>
              <span className="text-base font-extrabold tracking-tight text-white leading-none">
                Wil <span className="text-xs font-semibold text-gray-400">Motos</span>
              </span>
            </Link>
            <p className="text-xs text-gray-400 leading-relaxed">
              Tu proveedor de confianza de repuestos para motos. Calidad garantizada para mantener tu negocio en marcha.
            </p>
          </div>
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">{title}</h3>
              <ul className="mt-4 space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-gray-400 hover:text-white transition-colors">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Vista Móvil (compacta, funcional y simplificada) */}
        <div className="md:hidden flex flex-col items-center text-center gap-3.5 py-4">
          <div className="flex items-center gap-2">
            <img src="/logoWilMotos.png" alt="Wil Motos" className="h-5 w-5 object-contain" />
            <span className="text-sm font-extrabold text-white">wilMotos</span>
          </div>

          <p className="text-[11px] text-gray-400 max-w-[280px] leading-relaxed">
            Tu proveedor de repuestos para motos.
          </p>

          {/* Enlaces clave rápidos para móvil */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-gray-500 font-semibold my-1">
            <Link href="/contacto" className="hover:text-white transition-colors">Contacto</Link>
            <span>•</span>
            <Link href="/faq" className="hover:text-white transition-colors">Preguntas Frecuentes</Link>
            <span>•</span>
            <Link href="/garantias" className="hover:text-white transition-colors">Garantías</Link>
          </div>

          <p className="text-[10px] text-gray-600">
            &copy; {new Date().getFullYear()} Wil Motos. Todos los derechos reservados.
          </p>
        </div>

        {/* Borde inferior para Desktop */}
        <div className="hidden md:flex mt-12 border-t border-gray-900 pt-8 items-center justify-between">
          <p className="text-[13px] text-gray-500">&copy; {new Date().getFullYear()} Wil Motos. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  )
}

