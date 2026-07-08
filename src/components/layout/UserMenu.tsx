"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"

interface MenuItem { href: string; label: string; description: string; icon: React.ReactNode }

function MenuItemCard({ item, onClick }: { item: MenuItem; onClick?: () => void }) {
  return (
    <Link href={item.href} onClick={onClick}
      className="flex flex-col items-center gap-1.5 rounded-2xl px-2 py-3.5 text-center transition-all duration-200 hover:bg-gray-50 active:bg-gray-100">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-gray-500 transition-colors group-hover:bg-gray-100">{item.icon}</div>
      <p className="text-xs font-medium text-gray-900 leading-tight">{item.label}</p>
      <p className="text-[10px] text-gray-400 leading-tight line-clamp-2">{item.description}</p>
    </Link>
  )
}

const buyerItems: MenuItem[] = [
  { href: "/account/orders", label: "Mis Pedidos", description: "Historial y estado", icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg> },
  { href: "/account/favorites", label: "Favoritos", description: "Productos guardados", icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg> },
  { href: "/account/history", label: "Historial", description: "Vistos recientemente", icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  { href: "/account/addresses", label: "Direcciones", description: "Tus direcciones de envío", icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
  { href: "/account/profile", label: "Mi Perfil", description: "Información personal", icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
]

const adminItems: MenuItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", description: "Estadísticas", icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
  { href: "/admin/products", label: "Productos", description: "Catálogo", icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg> },
  { href: "/admin/orders", label: "Pedidos", description: "Órdenes", icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
  { href: "/admin/categories", label: "Categorías", description: "Organizar", icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg> },
  { href: "/admin/inventory", label: "Inventario", description: "Stock", icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg> },
  { href: "/admin/reviews", label: "Reseñas", description: "Moderar", icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg> },
  { href: "/admin/questions", label: "Preguntas", description: "Responder", icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  { href: "/admin/import", label: "Importar", description: "CSV", icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg> },
]

export default function UserMenu({ userName, isAdmin, onLogout }: { userName: string | undefined; isAdmin: boolean; onLogout: () => void }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false) }
    if (open) document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    if (open) document.addEventListener("keydown", handleEsc)
    return () => document.removeEventListener("keydown", handleEsc)
  }, [open])

  const displayName = userName || "Mi Cuenta"

  return (
    <div ref={menuRef} className="relative">
      <button onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
          open ? "border-gray-200 bg-gray-50 text-gray-900" : "border-transparent text-gray-600 hover:border-gray-200 hover:bg-gray-50"
        }`}>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-[11px] font-semibold text-white">{displayName.charAt(0).toUpperCase()}</span>
        <span className="hidden sm:inline max-w-[120px] truncate">{displayName}</span>
        <svg className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[420px] origin-top-right animate-scale-in rounded-2xl border border-gray-100 bg-white p-3 shadow-xl shadow-gray-100">
          <div className="border-b border-gray-50 px-2 pb-3 pt-1">
            <p className="text-sm font-semibold text-gray-900">{displayName}</p>
            <p className="text-[11px] text-gray-400">{isAdmin ? "Administrador" : "Comprador"}</p>
          </div>
          <div className="py-2">
            <p className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-widest text-gray-400">Mi Cuenta</p>
            <div className="grid grid-cols-3 gap-0.5">{buyerItems.map((item) => <MenuItemCard key={item.href} item={item} onClick={() => setOpen(false)} />)}</div>
          </div>
          {isAdmin && (
            <div className="border-t border-gray-50 py-2">
              <p className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-widest text-gray-400">Administración</p>
              <div className="grid grid-cols-3 gap-0.5">{adminItems.map((item) => <MenuItemCard key={item.href} item={item} onClick={() => setOpen(false)} />)}</div>
            </div>
          )}
          <div className="border-t border-gray-50 pt-2">
            <button onClick={() => { setOpen(false); onLogout() }}
              className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-50">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              </div>
              <div className="text-left"><p>Cerrar Sesión</p></div>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
