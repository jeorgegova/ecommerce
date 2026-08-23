import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(){
  const supabase = await createClient()
  const { data:{user} } = await supabase.auth.getUser()
  if(!user) return NextResponse.json({discount:0, target:0})
  const { data, error } = await supabase.from("random_purchase_discounts").select("target, discount").eq("user_id", user.id).maybeSingle()
  if(error) return NextResponse.json({discount:0, target:0, error:error.message})
  if(!data) return NextResponse.json({discount:0, target:0})
  // validate cart still matches otherwise clear
  const { data: cart } = await supabase.from("cart_items").select("quantity, products(base_price, sale_price, promotion_active)").eq("user_id", user.id)
  if(!cart || cart.length===0){
    await supabase.from("random_purchase_discounts").delete().eq("user_id", user.id)
    return NextResponse.json({discount:0, target:0})
  }
  let subtotal=0
  for(const c of cart as any[]){
    const prod = Array.isArray(c.products) ? c.products[0] : c.products
    const price = prod?.sale_price && prod?.promotion_active ? prod.sale_price : prod?.base_price
    subtotal += Math.round(Number(price||0)) * c.quantity
  }
  if(subtotal < data.target){
    await supabase.from("random_purchase_discounts").delete().eq("user_id", user.id)
    return NextResponse.json({discount:0, target:0})
  }
  const realDiscount = subtotal - data.target
  if(realDiscount !== data.discount){
    // update to correct
    await supabase.from("random_purchase_discounts").update({discount: realDiscount}).eq("user_id", user.id)
    return NextResponse.json({discount: realDiscount, target: data.target})
  }
  return NextResponse.json({discount:data.discount, target:data.target, subtotal})
}

export async function DELETE(){
  const supabase = await createClient()
  const { data:{user} } = await supabase.auth.getUser()
  if(!user) return NextResponse.json({ok:true})
  await supabase.from("random_purchase_discounts").delete().eq("user_id", user.id)
  return NextResponse.json({ok:true})
}
