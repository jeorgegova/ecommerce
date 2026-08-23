import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import RandomPurchaseClient from "@/components/random-purchase/RandomPurchaseClient"

export const metadata = { title: "Compra Aleatoria | Wil Motos" }

export default async function CompraAleatoriaPage(){
  const supabase = await createClient()
  const { data:{user} } = await supabase.auth.getUser()
  if(!user) redirect("/login?next=/account/compra-aleatoria")
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 lg:px-8 lg:py-10">
      <h1 className="text-2xl font-bold text-gray-900">Compra Aleatoria</h1>
      <p className="mt-1 text-sm text-gray-500">Ingresá el valor que querés gastar y te armamos la mejor combinación.</p>
      <div className="mt-6">
        <RandomPurchaseClient />
      </div>
    </div>
  )
}
