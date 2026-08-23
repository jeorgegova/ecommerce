"use client"
import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { getDisplayImageUrl, isSupabaseStorageUrl } from "@/lib/utils/image"

interface Item {
  product_id: string
  name: string
  unit_price: number
  quantity: number
  subtotal: number
  image: string | null
}
interface Result {
  target:number
  subtotal:number
  discount:number
  total:number
  exact:boolean
  items: Item[]
}

export default function RandomPurchaseClient(){
  const [targetStr, setTargetStr] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState<Result | null>(null)
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)

  const parseTarget = (v:string)=> Number(v.replace(/[^0-9]/g,""))

  const handleGenerate = async ()=>{
    setError(""); setAdded(false)
    const target = parseTarget(targetStr)
    if(!target || target<=0){ setError("Ingresá un valor válido"); return }
    if(target<1000){ setError("Mínimo $1.000"); return}
    if(target>10000000){ setError("Máximo $10.000.000"); return}
    setLoading(true)
    setResult(null)
    try{
      const res = await fetch("/api/random-purchase/generate", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({target})
      })
      const data = await res.json()
      if(!res.ok) throw new Error(data.error || "Error")
      setResult(data)
    }catch(e:any){ setError(e.message)}
    finally{ setLoading(false)}
  }

  const handleAdd = async ()=>{
    if(!result) return
    setAdding(true); setError("")
    try{
      const res = await fetch("/api/random-purchase/add-to-cart", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({target: result.target, items: result.items.map(i=> ({product_id:i.product_id, quantity:i.quantity}))})
      })
      const data = await res.json()
      if(!res.ok) throw new Error(data.error || "Error")
      setAdded(true)
      setTimeout(()=> setAdded(false), 2500)
    }catch(e:any){ setError(e.message)}
    finally{ setAdding(false)}
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 lg:p-6">
        <label className="block text-sm font-medium text-gray-700">Valor objetivo</label>
        <p className="mt-1 text-xs text-gray-400">Ej: 50000, 48000, 100000</p>
        <div className="mt-3 flex gap-3">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">$</span>
            <input
              type="text"
              inputMode="numeric"
              value={targetStr}
              onChange={e=> setTargetStr(e.target.value)}
              placeholder="50000"
              className="w-full rounded-xl border border-gray-300 pl-7 pr-3 py-3 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {loading? "Buscando..." : "Generar mi compra"}
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        {loading && (
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
            <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            Buscando la mejor combinación para ti...
          </div>
        )}
      </div>

      {result && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 lg:p-6">
          <h2 className="text-lg font-semibold text-gray-900">Tu compra aleatoria</h2>
          <p className="mt-1 text-sm text-gray-500">Valor solicitado: <span className="font-semibold text-gray-900">${Number(result.target).toLocaleString("es-CO")}</span></p>

          <div className="mt-4 space-y-3">
            {result.items.map(it=> (
              <div key={it.product_id} className="flex items-center gap-3 rounded-xl border border-gray-100 p-3">
                <div className="relative h-14 w-14 overflow-hidden rounded-lg bg-gray-100 flex-shrink-0">
                  {it.image ? (
                    <Image src={getDisplayImageUrl(it.image)} alt={it.name} fill unoptimized={!isSupabaseStorageUrl(it.image)} className="object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-300">—</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{it.name}</p>
                  <p className="text-xs text-gray-500">{it.quantity} × ${it.unit_price.toLocaleString("es-CO")} = ${it.subtotal.toLocaleString("es-CO")}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-2 rounded-xl bg-gray-50 p-4 text-sm">
            <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span className="font-medium">${result.subtotal.toLocaleString("es-CO")}</span></div>
            {result.discount>0 && (
              <div className="flex justify-between text-green-700"><span>Descuento Compra Aleatoria</span><span>-${result.discount.toLocaleString("es-CO")}</span></div>
            )}
            <div className="flex justify-between border-t border-gray-200 pt-2 font-semibold text-gray-900"><span>Total a pagar</span><span>${result.total.toLocaleString("es-CO")}</span></div>
          </div>

          <div className="mt-5 flex gap-3">
            <button onClick={handleAdd} disabled={adding} className={`flex-1 rounded-xl px-6 py-3 text-sm font-semibold text-white ${added? "bg-green-600" : "bg-gray-900 hover:bg-gray-800"} disabled:opacity-50`}>
              {adding? "Agregando..." : added? "¡Agregado!" : "Agregar compra al carrito"}
            </button>
            <Link href="/cart" className="rounded-xl border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">Ver carrito</Link>
          </div>
          {added && <p className="mt-2 text-sm text-green-600">Compra agregada. Revisá tu carrito.</p>}
        </div>
      )}
    </div>
  )
}
