import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Extrae el path relativo del storage desde una URL pública de Supabase.
 * Ejemplo: https://xxx.supabase.co/storage/v1/object/public/products/foto.webp
 *          → "foto.webp"
 */
export function extractStoragePath(publicUrl: string): string | null {
  try {
    const url = new URL(publicUrl)
    // El path tiene la forma: /storage/v1/object/public/<bucket>/<path>
    const match = url.pathname.match(/\/object\/public\/[^/]+\/(.+)/)
    return match ? match[1] : null
  } catch {
    return null
  }
}

/**
 * Elimina del storage los archivos correspondientes a un array de URLs públicas.
 * Silencia errores individuales y los reporta por consola.
 */
export async function deleteStorageFiles(
  supabase: SupabaseClient,
  bucket: string,
  urls: string[]
): Promise<void> {
  const paths = urls.map(extractStoragePath).filter(Boolean) as string[]
  if (paths.length === 0) return

  const { error } = await supabase.storage.from(bucket).remove(paths)
  if (error) {
    console.error(`[storage] Failed to delete files from bucket "${bucket}":`, error.message)
  }
}

/**
 * Obtiene las URLs de imágenes de un producto desde la BD y las elimina del storage.
 * Útil al eliminar un producto completo.
 */
export async function deleteProductStorageImages(
  supabase: SupabaseClient,
  productId: string,
  bucket = "products"
): Promise<void> {
  const { data: images } = await supabase
    .from("product_images")
    .select("url")
    .eq("product_id", productId)

  if (!images || images.length === 0) return

  await deleteStorageFiles(supabase, bucket, images.map((img) => img.url))
}
