import Link from "next/link"

export default function AdminPage() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
          <p className="mt-1 text-sm text-gray-600">Gestiona tu tienda</p>
        </div>
        <Link href="/admin/dashboard" className="rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">Dashboard</Link>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/admin/products" className="rounded-xl border border-gray-200 p-6 hover:border-gray-300"><h2 className="text-lg font-semibold text-gray-900">Productos</h2><p className="mt-1 text-sm text-gray-600">Gestionar catálogo</p></Link>
        <Link href="/admin/orders" className="rounded-xl border border-gray-200 p-6 hover:border-gray-300"><h2 className="text-lg font-semibold text-gray-900">Pedidos</h2><p className="mt-1 text-sm text-gray-600">Gestionar pedidos</p></Link>
        <Link href="/admin/categories" className="rounded-xl border border-gray-200 p-6 hover:border-gray-300"><h2 className="text-lg font-semibold text-gray-900">Categorías</h2><p className="mt-1 text-sm text-gray-600">Organizar categorías</p></Link>
        <Link href="/admin/inventory" className="rounded-xl border border-gray-200 p-6 hover:border-gray-300"><h2 className="text-lg font-semibold text-gray-900">Inventario</h2><p className="mt-1 text-sm text-gray-600">Control de stock</p></Link>
        <Link href="/admin/reviews" className="rounded-xl border border-gray-200 p-6 hover:border-gray-300"><h2 className="text-lg font-semibold text-gray-900">Reseñas</h2><p className="mt-1 text-sm text-gray-600">Moderar reseñas</p></Link>
        <Link href="/admin/questions" className="rounded-xl border border-gray-200 p-6 hover:border-gray-300"><h2 className="text-lg font-semibold text-gray-900">Preguntas</h2><p className="mt-1 text-sm text-gray-600">Responder preguntas</p></Link>
        <Link href="/admin/import" className="rounded-xl border border-gray-200 p-6 hover:border-gray-300"><h2 className="text-lg font-semibold text-gray-900">Importar</h2><p className="mt-1 text-sm text-gray-600">Importación CSV</p></Link>
        <Link href="/admin/users" className="rounded-xl border border-gray-200 p-6 hover:border-gray-300"><h2 className="text-lg font-semibold text-gray-900">Usuarios</h2><p className="mt-1 text-sm text-gray-600">Gestionar usuarios</p></Link>
        <Link href="/admin/banners" className="rounded-xl border border-gray-200 p-6 hover:border-gray-300"><h2 className="text-lg font-semibold text-gray-900">Banners</h2><p className="mt-1 text-sm text-gray-600">Gestionar banners</p></Link>
        <Link href="/admin/settings" className="rounded-xl border border-gray-200 p-6 hover:border-gray-300"><h2 className="text-lg font-semibold text-gray-900">Configuración</h2><p className="mt-1 text-sm text-gray-600">Ajustes de la tienda</p></Link>
      </div>
    </div>
  )
}
