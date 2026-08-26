import { createClient } from "@/lib/supabase/server"
import { findBestCombination } from "@/lib/random-purchase/algorithm"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  let body: { target?: number; targetString?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 })}
  let target = body.target
  if (typeof target === "string") target = Number(String(target).replace(/[^0-9]/g,""))
  // also support targetString
  if (!target && body.targetString) target = Number(String(body.targetString).replace(/[^0-9]/g,""))
  target = Math.round(Number(target))

  if (!target || isNaN(target) || target <= 0) return NextResponse.json({ error: "Valor objetivo inválido" }, { status:400 })
  if (target < 1000) return NextResponse.json({ error: "Valor mínimo $1.000" }, { status:400 })
  if (target > 10000000) return NextResponse.json({ error: "Valor máximo $10.000.000" }, { status:400 })

  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, base_price, sale_price, promotion_active, stock, has_variants, status")
    .eq("status", "active")
    .eq("has_variants", false)
    .gt("stock", 0)

  if (error) return NextResponse.json({ error: error.message }, { status:500 })
  const candidates = (products||[]).map(p=> ({
    id: p.id,
    name: p.name,
    price: Math.round(Number(p.promotion_active && p.sale_price ? p.sale_price : p.base_price)),
    stock: p.stock,
  })).filter(c=> c.price>0 && c.price <= 10000000)

  if (!candidates.length) return NextResponse.json({ error: "No hay productos disponibles" }, { status:404 })

  const cheapest = Math.min(...candidates.map(c=>c.price))
  if (target < cheapest) return NextResponse.json({ error: `No encontramos productos por ese valor. Producto más barato: $₡{cheapest.toLocaleString("es-CR")}` }, { status:404 })

  const result = findBestCombination(candidates, target)
  if (!result) return NextResponse.json({ error: "No encontramos combinación para ese valor. Probá otro monto." }, { status:404 })

  // enrich with images
  const ids = result.items.map(i=> i.product.id)
  const { data: imgs } = await supabase.from("product_images").select("product_id, url, is_main").in("product_id", ids)
  const imgMap = new Map<string,string>()
  ;(imgs||[]).forEach((im:any)=>{
    if (!imgMap.has(im.product_id) || im.is_main) imgMap.set(im.product_id, im.url)
  })

  const payload = {
    target,
    subtotal: result.subtotal,
    discount: result.discount,
    total: result.total,
    exact: result.exact,
    items: result.items.map(it=> ({
      product_id: it.product.id,
      name: it.product.name,
      unit_price: it.unitPrice,
      quantity: it.quantity,
      subtotal: it.subtotal,
      image: imgMap.get(it.product.id) || null,
    }))
  }
  return NextResponse.json(payload)
}
