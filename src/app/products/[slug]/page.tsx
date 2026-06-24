import StoreLayout from "@/components/layout/StoreLayout"
import ProductGallery from "@/components/store/ProductGallery"
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

  const { data: product } = await supabase
    .from("products")
    .select("*, categories(name, slug)")
    .eq("slug", slug)
    .eq("status", "active")
    .single()
  if (!product) notFound()

  const { data: variants } = await supabase
    .from("product_variants")
    .select("*")
    .eq("product_id", product.id)
    .eq("is_active", true)
    .order("sort_order")

  const { data: attributes } = await supabase
    .from("product_attribute_values")
    .select("*, attributes(name, type)")
    .eq("product_id", product.id)

  const { data: images } = await supabase
    .from("product_images")
    .select("*")
    .eq("product_id", product.id)
    .order("sort_order")

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*, profiles(full_name, avatar_url)")
    .eq("product_id", product.id)
    .eq("is_approved", true)
    .order("created_at", { ascending: false })
    .limit(20)

  const currentPrice = product.sale_price ?? product.base_price
  const categoryName = product.categories?.name || ""
  const categorySlug = product.categories?.slug || ""
  const mainImage = images?.find((img: any) => img.is_main)?.url || images?.[0]?.url || null

  return (
    <StoreLayout>
      <ViewTracker
        productId={product.id}
        productName={product.name}
        productSlug={product.slug}
        productPrice={currentPrice}
        productSalePrice={product.sale_price}
        productImage={mainImage}
      />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {categorySlug && (
          <Link href={`/categories/${categorySlug}`} className="text-sm text-gray-500 hover:text-gray-900">
            &larr; {categoryName}
          </Link>
        )}

        <div className="mt-6 grid gap-10 lg:grid-cols-2">
          <ProductGallery images={images || []} />

          <div>
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl font-bold text-gray-900 lg:text-3xl">{product.name}</h1>
              <FavoriteButton productId={product.id} />
            </div>

            {product.short_description && (
              <p className="mt-3 text-gray-600">{product.short_description}</p>
            )}

            <div className="mt-6 flex items-baseline gap-3">
              {product.sale_price && product.promotion_active ? (
                <>
                  <span className="text-3xl font-bold text-gray-900">
                    ${Number(product.sale_price).toLocaleString("es-CO")}
                  </span>
                  <span className="text-xl text-gray-400 line-through">
                    ${Number(product.base_price).toLocaleString("es-CO")}
                  </span>
                  <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                    {Math.round((1 - Number(product.sale_price) / Number(product.base_price)) * 100)}% OFF
                  </span>
                </>
              ) : (
                <span className="text-3xl font-bold text-gray-900">
                  ${Number(currentPrice).toLocaleString("es-CO")}
                </span>
              )}
            </div>

            <div className="mt-6">
              <AddToCartButton productId={product.id} stock={product.stock} hasVariants={product.has_variants} />
            </div>

            <div className="mt-6 flex items-center gap-2 text-sm text-gray-500">
              {product.avg_rating > 0 && (
                <span className="flex items-center gap-1 text-yellow-500">
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  {Number(product.avg_rating).toFixed(1)}
                </span>
              )}
              {product.reviews_count > 0 && (
                <span>({product.reviews_count} {product.reviews_count === 1 ? "reseña" : "reseñas"})</span>
              )}
              <span className="text-gray-300">|</span>
              <span>{product.sales_count} vendidos</span>
              {product.stock > 0 ? (
                <>
                  <span className="text-gray-300">|</span>
                  <span className="text-green-600 font-medium">En stock ({product.stock})</span>
                </>
              ) : (
                <>
                  <span className="text-gray-300">|</span>
                  <span className="text-red-600 font-medium">Agotado</span>
                </>
              )}
            </div>

            <dl className="mt-8 grid grid-cols-2 gap-4 border-t border-gray-200 pt-6">
              <div>
                <dt className="text-xs font-medium text-gray-400 uppercase">SKU</dt>
                <dd className="mt-1 text-sm text-gray-900">{product.sku}</dd>
              </div>
              {product.weight && (
                <div>
                  <dt className="text-xs font-medium text-gray-400 uppercase">Peso</dt>
                  <dd className="mt-1 text-sm text-gray-900">{Number(product.weight).toLocaleString("es-CO")} kg</dd>
                </div>
              )}
              {(product.width || product.height || product.length) && (
                <div>
                  <dt className="text-xs font-medium text-gray-400 uppercase">Dimensiones</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {[product.width, product.height, product.length].filter(Boolean).join(" x ")} cm
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {(product.long_description || product.technical_specs || (attributes && attributes.length > 0)) && (
          <div className="mt-16 border-t border-gray-200 pt-10">
            <div className="mx-auto max-w-3xl space-y-10">
              {attributes && attributes.length > 0 && (
                <section>
                  <h2 className="text-xl font-semibold text-gray-900">Características</h2>
                  <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {attributes.map((attr: any) => (
                      <div key={attr.id} className="flex gap-2 rounded-lg bg-gray-50 px-4 py-3">
                        <dt className="text-sm font-medium text-gray-500">{attr.attributes?.name}</dt>
                        <dd className="text-sm text-gray-900 ml-auto">{attr.value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              )}

              {product.long_description && (
                <section>
                  <h2 className="text-xl font-semibold text-gray-900">Descripción</h2>
                  <div className="mt-4 text-sm leading-relaxed text-gray-600 whitespace-pre-line">{product.long_description}</div>
                </section>
              )}

              {product.technical_specs && (
                <section>
                  <h2 className="text-xl font-semibold text-gray-900">Ficha técnica</h2>
                  <div className="mt-4 text-sm leading-relaxed text-gray-600 whitespace-pre-line">{product.technical_specs}</div>
                </section>
              )}
            </div>
          </div>
        )}

        {reviews && reviews.length > 0 && (
          <div className="mt-16 border-t border-gray-200 pt-10">
            <h2 className="text-xl font-semibold text-gray-900">
              Reseñas ({product.reviews_count})
              {product.avg_rating > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 text-base text-yellow-500">
                  <svg className="h-5 w-5 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  {Number(product.avg_rating).toFixed(1)}
                </span>
              )}
            </h2>
            <div className="mt-6 space-y-6">
              {reviews.map((review: any) => (
                <div key={review.id} className="rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center gap-3">
                    {review.profiles?.avatar_url ? (
                      <Image src={review.profiles.avatar_url} alt="" width={36} height={36} className="rounded-full" />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-500">
                        {(review.profiles?.full_name || "U")[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{review.profiles?.full_name || "Usuario"}</p>
                      <div className="mt-0.5 flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <svg key={i} className={`h-3.5 w-3.5 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}`} viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        ))}
                      </div>
                    </div>
                    <span className="ml-auto text-xs text-gray-400">
                      {new Date(review.created_at).toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "numeric" })}
                    </span>
                  </div>
                  {review.title && <p className="mt-3 text-sm font-medium text-gray-900">{review.title}</p>}
                  {review.content && <p className="mt-1.5 text-sm text-gray-600">{review.content}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </StoreLayout>
  )
}
