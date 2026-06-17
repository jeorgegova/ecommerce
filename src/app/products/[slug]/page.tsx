import StoreLayout from "@/components/layout/StoreLayout"
import ViewTracker from "@/components/store/ViewTracker"
import AddToCartButton from "@/components/store/AddToCartButton"
import FavoriteButton from "@/components/store/FavoriteButton"
import { createClient } from "@/lib/supabase/server"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: product } = await supabase.from("product_listing").select("*").eq("slug", slug).single()
  if (!product) notFound()

  const { data: variants } = await supabase.from("product_variants").select("*").eq("product_id", product.id).eq("is_active", true).order("sort_order")
  const { data: attributes } = await supabase.from("product_attribute_values").select("*, attributes(name, type)").eq("product_id", product.id)
  const { data: images } = await supabase.from("product_images").select("*").eq("product_id", product.id).order("sort_order")
  const { data: reviews } = await supabase.from("reviews").select("*, profiles(full_name)").eq("product_id", product.id).eq("is_approved", true).order("created_at", { ascending: false }).limit(10)

  return (
    <StoreLayout>
      <ViewTracker productId={product.id} productName={product.name} productSlug={product.slug} productPrice={product.current_price} productSalePrice={product.sale_price} />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Link href={`/categories/${product.category_slug}`} className="text-sm text-gray-500 hover:text-gray-900">← {product.category_name}</Link>
        <div className="mt-6 grid gap-12 lg:grid-cols-2">
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-100">
            {images?.[0] ? (
              <Image src={images[0].url} alt={images[0].alt || product.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" priority />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">Sin imagen</div>
            )}
          </div>
          <div>
            <div className="flex items-center justify-between"><h1 className="text-3xl font-bold text-gray-900">{product.name}</h1><FavoriteButton productId={product.id} /></div>
            {product.short_description && <p className="mt-4 text-gray-600">{product.short_description}</p>}
            <div className="mt-6 flex items-baseline gap-3">
              {product.sale_price ? (
                <><span className="text-3xl font-bold text-gray-900">${Number(product.sale_price).toLocaleString("es-CO")}</span><span className="text-xl text-gray-400 line-through">${Number(product.base_price).toLocaleString("es-CO")}</span></>
              ) : (
                <span className="text-3xl font-bold text-gray-900">${Number(product.current_price).toLocaleString("es-CO")}</span>
              )}
            </div>
            <div className="mt-6"><AddToCartButton productId={product.id} stock={product.stock} hasVariants={product.has_variants} /></div>
            {attributes && attributes.length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold text-gray-900">Características</h2>
                <dl className="mt-4 space-y-3">
                  {attributes.map((attr) => (
                    <div key={attr.id} className="flex gap-4 text-sm"><dt className="w-32 font-medium text-gray-500">{attr.attributes?.name}</dt><dd className="text-gray-900">{attr.value}</dd></div>
                  ))}
                </dl>
              </div>
            )}
            {product.long_description && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold text-gray-900">Descripción</h2>
                <div className="mt-4 text-sm text-gray-600 whitespace-pre-line">{product.long_description}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </StoreLayout>
  )
}
