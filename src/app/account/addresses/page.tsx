"use client"

import StoreLayout from "@/components/layout/StoreLayout"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"

interface Address {
  id: string; name: string; full_name: string; phone: string | null; address_line_1: string
  address_line_2: string | null; city: string; state: string; postal_code: string; country: string; is_default: boolean
}

const emptyForm = { name: "", full_name: "", phone: "", address_line_1: "", address_line_2: "", city: "", state: "", postal_code: "", country: "CO" }

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const supabase = createClient()

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from("addresses").select("*").eq("user_id", user.id).order("is_default", { ascending: false }).order("created_at", { ascending: false })
      setAddresses(data || []); setLoading(false)
    }
    fetch()
  }, [supabase])

  const resetForm = () => { setForm(emptyForm); setEditingId(null); setShowForm(false); setError("") }

  const startEdit = (addr: Address) => {
    setForm({ name: addr.name, full_name: addr.full_name, phone: addr.phone || "", address_line_1: addr.address_line_1, address_line_2: addr.address_line_2 || "", city: addr.city, state: addr.state, postal_code: addr.postal_code, country: addr.country })
    setEditingId(addr.id); setShowForm(true); setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError("")
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const payload = { user_id: user.id, name: form.name, full_name: form.full_name, phone: form.phone || null, address_line_1: form.address_line_1, address_line_2: form.address_line_2 || null, city: form.city, state: form.state, postal_code: form.postal_code, country: form.country }

    if (editingId) {
      const { error: err } = await supabase.from("addresses").update(payload).eq("id", editingId)
      if (err) { setError(err.message); setSaving(false); return }
    } else {
      const { error: err } = await supabase.from("addresses").insert({ ...payload, is_default: addresses.length === 0 })
      if (err) { setError(err.message); setSaving(false); return }
    }
    const { data: { user: u } } = await supabase.auth.getUser()
    const { data } = await supabase.from("addresses").select("*").eq("user_id", u!.id).order("is_default", { ascending: false }).order("created_at", { ascending: false })
    setAddresses(data || []); resetForm(); setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar?")) return
    await supabase.from("addresses").delete().eq("id", id)
    setAddresses((prev) => prev.filter((a) => a.id !== id))
  }

  const setDefault = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id)
    await supabase.from("addresses").update({ is_default: true }).eq("id", id)
    setAddresses((prev) => prev.map((a) => ({ ...a, is_default: a.id === id })))
  }

  const inputClass = "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
  const labelClass = "block text-sm font-medium text-gray-700"

  if (loading) return <StoreLayout><p className="text-center py-12 text-gray-600">Cargando...</p></StoreLayout>

  return (
    <StoreLayout>
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold text-gray-900">Direcciones</h1><p className="mt-1 text-sm text-gray-600">Gestiona tus direcciones de envío</p></div>
          {!showForm && <button onClick={() => { resetForm(); setShowForm(true) }} className="rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">Nueva Dirección</button>}
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="mt-8 rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">{editingId ? "Editar Dirección" : "Nueva Dirección"}</h2>
            {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className={labelClass}>Nombre</label><input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Ej: Casa, Oficina" className={inputClass} required /></div>
              <div><label className={labelClass}>Destinatario</label><input type="text" value={form.full_name} onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))} className={inputClass} required /></div>
              <div><label className={labelClass}>Teléfono</label><input type="tel" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} className={inputClass} /></div>
              <div><label className={labelClass}>País</label><select value={form.country} onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))} className={inputClass}><option value="CO">Colombia</option><option value="MX">México</option><option value="AR">Argentina</option></select></div>
            </div>
            <div><label className={labelClass}>Dirección</label><input type="text" value={form.address_line_1} onChange={(e) => setForm((p) => ({ ...p, address_line_1: e.target.value }))} placeholder="Calle, número, barrio" className={inputClass} required /></div>
            <div><label className={labelClass}>Complemento</label><input type="text" value={form.address_line_2} onChange={(e) => setForm((p) => ({ ...p, address_line_2: e.target.value }))} placeholder="Apto, oficina" className={inputClass} /></div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div><label className={labelClass}>Ciudad</label><input type="text" value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} className={inputClass} required /></div>
              <div><label className={labelClass}>Departamento</label><input type="text" value={form.state} onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))} className={inputClass} required /></div>
              <div><label className={labelClass}>Código Postal</label><input type="text" value={form.postal_code} onChange={(e) => setForm((p) => ({ ...p, postal_code: e.target.value }))} className={inputClass} required /></div>
            </div>
            <div className="flex items-center gap-4 pt-2">
              <button type="submit" disabled={saving} className="rounded-full bg-gray-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50">{saving ? "Guardando..." : editingId ? "Guardar Cambios" : "Crear Dirección"}</button>
              <button type="button" onClick={resetForm} className="text-sm font-medium text-gray-600 hover:text-gray-900">Cancelar</button>
            </div>
          </form>
        )}

        <div className="mt-8 space-y-4">
          {addresses.length === 0 && !showForm && <p className="text-center text-gray-500 py-12">No tienes direcciones guardadas</p>}
          {addresses.map((addr) => (
            <div key={addr.id} className={`rounded-xl border p-5 ${addr.is_default ? "border-gray-900 bg-gray-50" : "border-gray-200"}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2"><span className="font-medium text-gray-900">{addr.name}</span>{addr.is_default && <span className="rounded-full bg-gray-900 px-2 py-0.5 text-xs text-white">Por defecto</span>}</div>
                  <p className="mt-1 text-sm text-gray-600">{addr.full_name}</p>
                  <p className="text-sm text-gray-600">{addr.address_line_1}</p>
                  <p className="text-sm text-gray-600">{addr.city}, {addr.state} — {addr.postal_code}</p>
                </div>
                <div className="flex items-center gap-3">
                  {!addr.is_default && <button onClick={() => setDefault(addr.id)} className="text-xs font-medium text-gray-600 hover:text-gray-900">Default</button>}
                  <button onClick={() => startEdit(addr)} className="text-xs font-medium text-gray-600 hover:text-gray-900">Editar</button>
                  <button onClick={() => handleDelete(addr.id)} className="text-xs font-medium text-red-500 hover:text-red-600">Eliminar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </StoreLayout>
  )
}
