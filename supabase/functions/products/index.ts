// supabase/functions/products/index.ts
// Edge Function: API pública de catálogo de productos
// Permite listar productos o consultar uno específico por slug o ID.
// Incluye inventario, precios con descuento, variantes, categoría e imágenes.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

interface ProductVariantRow {
  id: string;
  sku: string;
  name: string;
  price_adjustment: number | string;
  stock: number;
  is_active: boolean;
  sort_order?: number;
}

interface ProductImageRow {
  id: string;
  url: string;
  alt: string | null;
  width?: number | null;
  height?: number | null;
  is_main: boolean;
  sort_order: number;
}

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
}

interface ProductRow {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  sku: string;
  internal_code?: string | null;
  short_description?: string | null;
  long_description?: string | null;
  technical_specs?: string | null;
  base_price: number | string;
  sale_price?: number | string | null;
  stock: number;
  low_stock_threshold: number;
  stock_bar_max: number;
  has_variants: boolean;
  status: string;
  is_featured: boolean;
  published_at?: string | null;
  sales_count: number;
  views_count: number;
  avg_rating: number | string;
  reviews_count: number;
  weight?: number | string | null;
  width?: number | string | null;
  height?: number | string | null;
  length?: number | string | null;
  created_at: string;
  updated_at: string;
  promotion_active: boolean;
  categories?: CategoryRow | null;
  product_images?: ProductImageRow[];
  product_variants?: ProductVariantRow[];
}

function formatCurrency(amount: number): string {
  return "$" + Math.round(amount).toLocaleString("es-CO");
}

function transformProduct(p: ProductRow) {
  const basePrice = Number(p.base_price) || 0;
  const rawSalePrice = p.sale_price !== null && p.sale_price !== undefined ? Number(p.sale_price) : null;
  const hasPromotion = Boolean(p.promotion_active && rawSalePrice !== null && rawSalePrice < basePrice);
  const effectivePrice = hasPromotion && rawSalePrice !== null ? rawSalePrice : basePrice;
  const discountPercentage = hasPromotion && rawSalePrice !== null
    ? Math.round(((basePrice - rawSalePrice) / basePrice) * 100)
    : 0;

  // Variantes activas ordenadas
  const rawVariants = Array.isArray(p.product_variants) ? p.product_variants : [];
  const variants = rawVariants
    .filter((v) => v.is_active !== false)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((v) => {
      const priceAdj = Number(v.price_adjustment) || 0;
      return {
        id: v.id,
        sku: v.sku,
        name: v.name,
        price_adjustment: priceAdj,
        effective_price: effectivePrice + priceAdj,
        stock: Number(v.stock) || 0,
        is_in_stock: (Number(v.stock) || 0) > 0,
        is_active: v.is_active,
      };
    });

  // Cálculo de stock total (si tiene variantes, suma de variantes activas; si no, stock del producto)
  const variantsStock = variants.reduce((acc, v) => acc + v.stock, 0);
  const totalStock = p.has_variants ? variantsStock : Number(p.stock) || 0;
  const lowThreshold = Number(p.low_stock_threshold) || 5;

  // Imágenes ordenadas (la principal primero, luego por sort_order)
  const rawImages = Array.isArray(p.product_images) ? p.product_images : [];
  const sortedImages = [...rawImages].sort((a, b) => {
    if (a.is_main && !b.is_main) return -1;
    if (!a.is_main && b.is_main) return 1;
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });

  const mainImage = sortedImages.find((img) => img.is_main)?.url || sortedImages[0]?.url || null;

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    internal_code: p.internal_code || null,
    category: p.categories
      ? {
          id: p.categories.id,
          name: p.categories.name,
          slug: p.categories.slug,
        }
      : null,
    pricing: {
      base_price: basePrice,
      sale_price: rawSalePrice,
      effective_price: effectivePrice,
      has_promotion: hasPromotion,
      discount_percentage: discountPercentage,
      currency: "COP",
      formatted_price: formatCurrency(effectivePrice),
    },
    inventory: {
      stock: Number(p.stock) || 0,
      total_stock: totalStock,
      has_variants: Boolean(p.has_variants),
      is_in_stock: totalStock > 0,
      low_stock_threshold: lowThreshold,
      is_low_stock: totalStock <= lowThreshold && totalStock > 0,
      stock_bar_max: Number(p.stock_bar_max) || 20,
    },
    images: {
      main: mainImage,
      gallery: sortedImages.map((img) => ({
        id: img.id,
        url: img.url,
        alt: img.alt || p.name,
        is_main: Boolean(img.is_main),
        sort_order: img.sort_order,
      })),
    },
    variants: variants,
    descriptions: {
      short: p.short_description || null,
      long: p.long_description || null,
      technical_specs: p.technical_specs || null,
    },
    dimensions: {
      weight: p.weight ? Number(p.weight) : null,
      width: p.width ? Number(p.width) : null,
      height: p.height ? Number(p.height) : null,
      length: p.length ? Number(p.length) : null,
    },
    metrics: {
      avg_rating: Number(p.avg_rating) || 0,
      reviews_count: Number(p.reviews_count) || 0,
      sales_count: Number(p.sales_count) || 0,
      views_count: Number(p.views_count) || 0,
    },
    status: p.status,
    is_featured: Boolean(p.is_featured),
    published_at: p.published_at || null,
    created_at: p.created_at,
    updated_at: p.updated_at,
  };
}

serve(async (req) => {
  // Manejo de preflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey =
      Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);

    // Parámetros pueden venir por GET query o por POST body
    let params: Record<string, any> = {};
    if (req.method === "POST") {
      try {
        params = await req.json();
      } catch {
        params = {};
      }
    } else {
      url.searchParams.forEach((value, key) => {
        params[key] = value;
      });
    }

    const id = params.id as string | undefined;
    const slug = params.slug as string | undefined;

    // --- CASO 1: Consulta de producto individual por ID o Slug ---
    if (id || slug) {
      let query = supabase
        .from("products")
        .select(`
          *,
          categories ( id, name, slug, description ),
          product_images ( id, url, alt, width, height, is_main, sort_order ),
          product_variants ( id, sku, name, price_adjustment, stock, is_active, sort_order )
        `);

      if (id) {
        query = query.eq("id", id);
      } else if (slug) {
        query = query.eq("slug", slug);
      }

      const { data: product, error } = await query.maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      if (!product) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "not_found",
            message: "Producto no encontrado",
          }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          product: transformProduct(product as unknown as ProductRow),
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- CASO 2: Listado de productos con filtros y paginación ---
    const page = Math.max(1, parseInt(params.page || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(params.limit || "50", 10)));
    const offset = (page - 1) * limit;

    const status = params.status || "active"; // por defecto solo activos
    const category = params.category as string | undefined;
    const search = params.search as string | undefined;
    const featured = params.featured === true || params.featured === "true";
    const inStockOnly = params.in_stock === true || params.in_stock === "true";
    const sort = (params.sort as string) || "newest";

    let query = supabase
      .from("products")
      .select(`
        *,
        categories ( id, name, slug ),
        product_images ( id, url, alt, is_main, sort_order ),
        product_variants ( id, sku, name, price_adjustment, stock, is_active, sort_order )
      `, { count: "exact" });

    // Filtro por estado
    if (status !== "all") {
      query = query.eq("status", status);
    }

    // Filtro por categoría (soporta UUID o slug de categoría)
    if (category) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(category);
      if (isUuid) {
        query = query.eq("category_id", category);
      } else {
        const { data: catData } = await supabase
          .from("categories")
          .select("id")
          .eq("slug", category)
          .maybeSingle();

        if (catData?.id) {
          query = query.eq("category_id", catData.id);
        } else {
          // Si no existe la categoría retornamos lista vacía inmediatamente
          return new Response(
            JSON.stringify({
              success: true,
              count: 0,
              total: 0,
              page,
              limit,
              products: [],
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // Filtro de búsqueda (nombre, sku, descripción corta)
    if (search && search.trim()) {
      const term = search.trim();
      query = query.or(`name.ilike.%${term}%,sku.ilike.%${term}%,short_description.ilike.%${term}%`);
    }

    // Filtro destacados
    if (featured) {
      query = query.eq("is_featured", true);
    }

    // Filtro solo con stock
    if (inStockOnly) {
      query = query.gt("stock", 0);
    }

    // Ordenamiento
    switch (sort) {
      case "price_asc":
        query = query.order("base_price", { ascending: true });
        break;
      case "price_desc":
        query = query.order("base_price", { ascending: false });
        break;
      case "name_asc":
        query = query.order("name", { ascending: true });
        break;
      case "rating":
        query = query.order("avg_rating", { ascending: false });
        break;
      case "popular":
        query = query.order("sales_count", { ascending: false });
        break;
      case "newest":
      default:
        query = query.order("created_at", { ascending: false });
        break;
    }

    // Paginación
    query = query.range(offset, offset + limit - 1);

    const { data: products, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    const transformed = (products || []).map((p) =>
      transformProduct(p as unknown as ProductRow)
    );

    return new Response(
      JSON.stringify({
        success: true,
        count: transformed.length,
        total: count ?? transformed.length,
        page,
        limit,
        products: transformed,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err: any) {
    console.error("products function error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: "internal_error",
        message: err.message || "Error al consultar los productos",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});

