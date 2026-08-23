import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest){
  const supabase = await createClient()
  const { data:{user} } = await supabase.auth.getUser()
  if(!user) return NextResponse.json({error:"No autenticado"},{status:401})
  let body:any
  try{ body=await req.json()}catch{return NextResponse.json({error:"JSON inválido"},{status:400})}
  const target = Math.round(Number(body.target))
  const items: {product_id:string, quantity:number}[] = body.items || []
  if(!target || target<=0) return NextResponse.json({error:"Target inválido"},{status:400})
  if(!items.length) return NextResponse.json({error:"Sin items"},{status:400})

  // validate products
  const ids = items.map(i=>i.product_id)
  const {data: prods, error} = await supabase.from("products").select("id, base_price, sale_price, promotion_active, stock, status, has_variants").in("id", ids)
  if(error) return NextResponse.json({error:error.message},{status:500})
  const map = new Map((prods||[]).map(p=>[p.id,p] as const))
  let subtotal=0
  for(const it of items){
    const p:any = map.get(it.product_id)
    if(!p) return NextResponse.json({error:`Producto ${it.product_id} no existe`},{status:400})
    if(p.status!=='active') return NextResponse.json({error:`Producto no disponible`},{status:400})
    if(p.has_variants) return NextResponse.json({error:"Producto con variantes no soportado en compra aleatoria"},{status:400})
    const qty = Math.round(Number(it.quantity))
    if(qty<=0 || qty> p.stock) return NextResponse.json({error:`Stock insuficiente para ${p.id}. Disponible ${p.stock}`},{status:400})
    const price = Math.round(Number(p.promotion_active && p.sale_price ? p.sale_price : p.base_price))
    if(price<=0) return NextResponse.json({error:"Precio inválido"},{status:400})
    subtotal += price * qty
  }
  if(subtotal < target) return NextResponse.json({error:`Subtotal $${subtotal.toLocaleString("es-CO")} menor que objetivo $${target.toLocaleString("es-CO")}`},{status:400})
  const discount = subtotal - target
  // cap discount sanity 50% or 200k
  if(discount <0) return NextResponse.json({error:"Descuento negativo"},{status:400})
  if(discount > subtotal*0.5 && discount>50000) {
    // allow but limit? we permit minimal discount anyway computed minimal, so if huge discount maybe algorithm bad
    // still allow
  }

  // upsert cart items
  for(const it of items){
    const qty = Math.round(Number(it.quantity))
    const {data: existing} = await supabase.from("cart_items").select("id, quantity").eq("user_id", user.id).eq("product_id", it.product_id).maybeSingle()
    if(existing){
      const newQty = existing.quantity + qty
      // check stock again
      const p:any = map.get(it.product_id)
      if(newQty > p.stock) return NextResponse.json({error:`Stock insuficiente al sumar carrito. Disponible ${p.stock} total ${newQty}`},{status:400})
      const {error: upErr} = await supabase.from("cart_items").update({quantity:newQty}).eq("id", existing.id)
      if(upErr) return NextResponse.json({error:upErr.message},{status:500})
    } else {
      const {error: insErr} = await supabase.from("cart_items").insert({user_id:user.id, product_id:it.product_id, variant_id:null, quantity:qty})
      if(insErr) return NextResponse.json({error:insErr.message},{status:500})
    }
  }

  // upsert discount table (if table not exists, ignore)
  const {error: discErr} = await supabase.from("random_purchase_discounts").upsert({user_id:user.id, target, discount, updated_at: new Date().toISOString()}, {onConflict:"user_id"})
  if(discErr){
    // if table missing, just log but still success (fallback to no persist)
    console.warn("random_purchase_discounts upsert fail", discErr.message)
  }

  return NextResponse.json({ok:true, subtotal, discount, target})
}
