import Link from "next/link"

const footerLinks = {
  repuestos: [
    { label: "Kit de Arrastre", href: "/categories/kit-de-arrastre" },
    { label: "Frenos y Suspensiones", href: "/categories/frenos-y-suspensiones" },
    { label: "Motor y Transmisión", href: "/categories/motor" },
    { label: "Accesorios y Lujos", href: "/categories/accesorios" },
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
                <svg className="h-6 w-6 text-colombia-yellow stroke-colombia-yellow" viewBox="0 0 24 24" strokeWidth="1.5" fill="none">
                  <circle cx="5" cy="17" r="2.5" className="stroke-colombia-yellow" strokeWidth="2" />
                  <circle cx="19" cy="17" r="2.5" className="stroke-colombia-yellow" strokeWidth="2" />
                  <path d="M5 17h14" className="stroke-colombia-red" strokeWidth="2" />
                  <path d="M7.5 17l2-5h5.5l2 5" className="stroke-colombia-blue" strokeWidth="2" />
                  <path d="M9.5 12L8 8H6" strokeWidth="2" />
                  <path d="M15 12l-1-4h-4" strokeWidth="2" />
                  <path d="M14 8l1-2.5h2" className="stroke-colombia-yellow" strokeWidth="2" />
                </svg>
              </div>
              <span className="text-base font-extrabold tracking-tight text-white leading-none">
                GoGi <span className="text-xs font-semibold text-colombia-yellow">Motos</span>
              </span>
            </Link>
            <p className="text-xs text-gray-400 leading-relaxed">
              Tu distribuidora de confianza de repuestos premium de motos importados desde Colombia 🇨🇴. Potencia y calidad garantizada para tu ruta.
            </p>
            <div className="flex h-1 w-24 overflow-hidden rounded-full">
              <div className="h-full w-1/2 bg-colombia-yellow" />
              <div className="h-full w-1/4 bg-colombia-blue" />
              <div className="h-full w-1/4 bg-colombia-red" />
            </div>
          </div>
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">{title}</h3>
              <ul className="mt-4 space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-gray-400 hover:text-colombia-yellow transition-colors">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Vista Móvil (compacta, funcional y simplificada) */}
        <div className="md:hidden flex flex-col items-center text-center gap-3.5 py-4">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-colombia-yellow stroke-colombia-yellow" viewBox="0 0 24 24" strokeWidth="1.5" fill="none">
              <circle cx="5" cy="17" r="2.5" className="stroke-colombia-yellow" strokeWidth="2" />
              <circle cx="19" cy="17" r="2.5" className="stroke-colombia-yellow" strokeWidth="2" />
              <path d="M5 17h14" className="stroke-colombia-red" strokeWidth="2" />
              <path d="M7.5 17l2-5h5.5l2 5" className="stroke-colombia-blue" strokeWidth="2" />
            </svg>
            <span className="text-sm font-extrabold text-white">GoGi Motos</span>
            <span className="flex h-2.5 w-4 overflow-hidden rounded-xs border border-gray-800 ml-1">
              <span className="h-full w-1/2 bg-colombia-yellow" />
              <span className="h-full w-1/4 bg-colombia-blue" />
              <span className="h-full w-1/4 bg-colombia-red" />
            </span>
          </div>

          <p className="text-[11px] text-gray-400 max-w-[280px] leading-relaxed">
            Tu distribuidora de repuestos premium de motos importados desde Colombia 🇨🇴.
          </p>

          {/* Enlaces clave rápidos para móvil */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-gray-500 font-semibold my-1">
            <Link href="/contacto" className="hover:text-colombia-yellow transition-colors">Contacto</Link>
            <span>•</span>
            <Link href="/faq" className="hover:text-colombia-yellow transition-colors">Preguntas Frecuentes</Link>
            <span>•</span>
            <Link href="/garantias" className="hover:text-colombia-yellow transition-colors">Garantías</Link>
          </div>

          <p className="text-[10px] text-gray-600">
            &copy; {new Date().getFullYear()} GoGi Motos. Todos los derechos reservados.
          </p>
        </div>

        {/* Borde inferior para Desktop */}
        <div className="hidden md:flex mt-12 border-t border-gray-900 pt-8 items-center justify-between">
          <p className="text-[13px] text-gray-500">&copy; {new Date().getFullYear()} GoGi Motos. Todos los derechos reservados.</p>
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-gray-500">Importado desde Colombia</span>
            <span className="flex h-2.5 w-4 overflow-hidden rounded-xs border border-gray-800">
              <span className="h-full w-1/2 bg-colombia-yellow" />
              <span className="h-full w-1/4 bg-colombia-blue" />
              <span className="h-full w-1/4 bg-colombia-red" />
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}

