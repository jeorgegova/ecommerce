import ProductFilterEngine from "@/components/store/ProductFilterEngine"
import RecentlyViewed from "@/components/store/RecentlyViewed"
import StoreLayout from "@/components/layout/StoreLayout"
import { createClient } from "@/lib/supabase/server"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Repuestos para Máquinas Vending en Colombia | PARTEX",
  description: "Distribuidor especializado de repuestos para máquinas vending y expendedoras en Colombia. Bombas Ulka, motores de espiral, validadores, monederos y componentes con envíos nacionales.",
  alternates: {
    canonical: "/",
  },
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  const [productsRes, categoriesRes] = await Promise.all([
    supabase.from("product_listing").select("*", { count: "exact" }).order("created_at", { ascending: false }).limit(20),
    supabase.from("categories").select("*").eq("is_active", true).order("sort_order", { ascending: true }).order("name", { ascending: true }),
  ])

  const productIds = (productsRes.data || []).map((p: any) => p.id)
  let initialImages: Record<string, string[]> = {}
  if (productIds.length > 0) {
    const { data: allImages } = await supabase
      .from("product_images")
      .select("product_id, url")
      .in("product_id", productIds)
      .order("sort_order")
    if (allImages) {
      for (const img of allImages) {
        if (!initialImages[img.product_id]) initialImages[img.product_id] = []
        initialImages[img.product_id].push(img.url)
      }
    }
  }

  const initialProducts = (productsRes.data || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    base_price: p.base_price,
    sale_price: p.sale_price,
    promotion_active: p.promotion_active,
    current_price: p.current_price,
    category_name: p.category_name,
    avg_rating: p.avg_rating,
    main_image: p.main_image || null,
  }))

  return (
    <StoreLayout>
      <div className="flex gap-6 mx-auto max-w-7xl">
        <div className="flex-1 min-w-0">
          <ProductFilterEngine
            initialProducts={initialProducts}
            initialTotal={productsRes.count || initialProducts.length}
            initialCategories={(categoriesRes.data || []) as any}
            initialImages={initialImages}
            initialSearch={params.q || ""}
          />
        </div>
        <aside className="hidden w-56 flex-shrink-0 xl:block mt-4 lg:mt-8">
          <RecentlyViewed />
        </aside>
      </div>

      {/* Sección SEO: Relevancia temática y semántica para Google en Colombia */}
      <section aria-labelledby="seo-heading" className="mx-auto max-w-7xl mt-16 border-t border-gray-100 pt-12 pb-8 px-4 sm:px-6">
        <div className="max-w-3xl">
          <h2 id="seo-heading" className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
            Especialistas en Repuestos para Máquinas Vending en Colombia
          </h2>
          <p className="mt-3 text-sm sm:text-base leading-relaxed text-gray-600">
            En <strong>PARTEX</strong> somos distribuidores especializados de <strong>repuestos para máquinas vending</strong> y café en Colombia. Proveemos componentes originales y compatibles certificados para operadores de máquinas expendedoras de snacks, bebidas frías y café en grano o soluble.
          </p>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-5">
            <h3 className="text-sm font-semibold text-gray-900">Bombas y Sistema Hidráulico</h3>
            <p className="mt-2 text-xs leading-relaxed text-gray-500">
              Bombas vibratorias Ulka EP5 (120V / 230V), electroválvulas ODE, racores rápidos, mangueras de teflón y calderas para máquinas de café vending.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-5">
            <h3 className="text-sm font-semibold text-gray-900">Motores y Mecanismos</h3>
            <p className="mt-2 text-xs leading-relaxed text-gray-500">
              Motores de espiral a 24V, motorreductores de paletas, piñones, espirales metálicas y resortes de caída para máquinas expendedoras de snacks.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-5">
            <h3 className="text-sm font-semibold text-gray-900">Sistemas de Pago MDB</h3>
            <p className="mt-2 text-xs leading-relaxed text-gray-500">
              Validadores de billetes ICT / Currenza, monederos de cambio con protocolo MDB / Executive y lectores de tarjeta contactless.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-5">
            <h3 className="text-sm font-semibold text-gray-900">Envíos a toda Colombia</h3>
            <p className="mt-2 text-xs leading-relaxed text-gray-500">
              Despachos coordinados a Bogotá, Medellín, Cali, Barranquilla, Bucaramanga, Pereira y todas las ciudades del país, con proforma inmediata.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-gray-50 p-5 text-xs text-gray-500 leading-relaxed">
          <strong className="text-gray-700">Marcas compatibles en nuestro catálogo:</strong> Repuestos y consumibles para máquinas Saeco, Necta, FAS International, Bianchi Vending, Jofemar, Azkoyen, Crane National y Rheavendors.
        </div>
      </section>
    </StoreLayout>
  )
}
