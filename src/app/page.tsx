import StoreLayout from "@/components/layout/StoreLayout"
import Link from "next/link"

export default function HomePage() {
  return (
    <StoreLayout>
      <section className="bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">GoGi</h1>
            <p className="mt-4 text-lg text-gray-600">Tu tienda de confianza</p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <Link href="/products" className="rounded-full bg-gray-900 px-8 py-3 text-sm font-medium text-white hover:bg-gray-800">
                Ver Productos
              </Link>
            </div>
          </div>
        </div>
      </section>
    </StoreLayout>
  )
}
