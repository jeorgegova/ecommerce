"use client"

import StoreLayout from "@/components/layout/StoreLayout"
import { useState } from "react"

const datos = [
  {
    titulo: "Dirección",
    valor: "Calle 123 #45-67, Bogotá",
    icono: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
      </svg>
    ),
  },
  {
    titulo: "Teléfono",
    valor: "+57 300 123 4567",
    icono: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
      </svg>
    ),
  },
  {
    titulo: "Correo",
    valor: "hola@amelatte.com",
    icono: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
      </svg>
    ),
  },
  {
    titulo: "Horario",
    valor: "Lun - Vie: 8:00 am - 6:00 pm",
    icono: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
]

export default function ContactoPage() {
  const [enviado, setEnviado] = useState(false)
  const [enviando, setEnviando] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setEnviando(true)
    await new Promise((r) => setTimeout(r, 800))
    setEnviando(false)
    setEnviado(true)
  }

  return (
    <StoreLayout>
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#C8102E]">Estamos para ayudarte</p>
          <h1 className="mt-3 text-4xl font-extrabold uppercase tracking-tight text-gray-900 sm:text-5xl">
            Contacto
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
            Queremos llevar amelatte a tu oficina o restaurante. Escríbenos y te respondemos muy pronto.
          </p>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-2">
            {datos.map((d) => (
              <div key={d.titulo} className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#C8102E]/10 text-[#C8102E]">
                  {d.icono}
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{d.titulo}</p>
                  <p className="text-sm font-semibold text-gray-900">{d.valor}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-3">
            {enviado ? (
              <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <h2 className="mt-5 text-xl font-bold text-gray-900">¡Mensaje enviado!</h2>
                <p className="mt-2 max-w-sm text-sm text-gray-600">
                  Gracias por escribirnos. Nuestro equipo te contactará en breve.
                </p>
                <button
                  onClick={() => setEnviado(false)}
                  className="mt-6 rounded-full border-2 border-gray-900 px-8 py-2.5 text-xs font-bold uppercase tracking-widest text-gray-900 transition-colors hover:bg-gray-900 hover:text-white"
                >
                  Enviar otro mensaje
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Nombre *
                    </label>
                    <input
                      name="nombre"
                      type="text"
                      required
                      className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-[#C8102E]"
                      placeholder="Tu nombre"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Correo *
                    </label>
                    <input
                      name="email"
                      type="email"
                      required
                      className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-[#C8102E]"
                      placeholder="tu@correo.com"
                    />
                  </div>
                </div>
                <div className="mt-5">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Empresa
                  </label>
                  <input
                    name="empresa"
                    type="text"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-[#C8102E]"
                    placeholder="Nombre de tu empresa"
                  />
                </div>
                <div className="mt-5">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Mensaje *
                  </label>
                  <textarea
                    name="mensaje"
                    required
                    rows={5}
                    className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-[#C8102E]"
                    placeholder="Cuéntanos qué necesitas para tu oficina o restaurante..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={enviando}
                  className="mt-6 inline-flex items-center justify-center rounded-full border-2 border-gray-900 bg-white px-10 py-3 text-xs font-bold uppercase tracking-widest text-gray-900 transition-colors duration-200 hover:bg-gray-900 hover:text-white disabled:opacity-50 sm:text-sm"
                >
                  {enviando ? "Enviando..." : "Enviar mensaje"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </StoreLayout>
  )
}
