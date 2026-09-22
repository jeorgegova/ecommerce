"use client"

import StoreLayout from "@/components/layout/StoreLayout"
import ContactoImg from "@/assets/contacto4.jpg"
import Image from "next/image"
import { useState } from "react"

const datos = [
  {
    titulo: "Dirección",
    valor: "Calle 67 N° 23a - 46",
    icono: (
      <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.5 9.5l-1.8 4.7-4.7 1.8 1.8-4.7z" />
      </svg>
    ),
  },
  {
    titulo: "Ciudad",
    valor: "Manizales/Colombia",
    icono: (
      <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 19c1.5 1.5 5 2 9 2s7.5-.5 9-2" />
      </svg>
    ),
  },
  {
    titulo: "Teléfonos",
    valor: "+57 3184596076",
    icono: (
      <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
        <rect x="7" y="2.5" width="10" height="19" rx="2" />
      </svg>
    ),
  },
]

const inputClass =
  "w-full border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-gray-900"

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
      <section className="bg-[#F6F6F4]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                Contacto
              </h1>
              <p className="mt-4 text-xs font-semibold uppercase leading-relaxed tracking-wide text-gray-900">
                Te gustaría degustar café Amelatte? Te invitamos a conocer toda la información de
                contacto nuestra o puedes diligenciar el siguiente formulario y con gusto haremos que tu
                corazón late.
              </p>

              <div className="mt-10 grid grid-cols-3 gap-4 text-center">
                {datos.map((d) => (
                  <div key={d.titulo}>
                    <div className="flex justify-center text-gray-500">{d.icono}</div>
                    <p className="mt-4 text-sm font-medium text-gray-900">{d.titulo}</p>
                    <p className="mt-6 text-sm text-gray-500">{d.valor}</p>
                  </div>
                ))}
              </div>

              <hr className="my-10 border-gray-300" />

              <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">
                Comunícate con nosotros
              </h2>

              {enviado ? (
                <div className="mt-6 border border-gray-200 bg-white p-10 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-gray-900">¡Mensaje enviado!</h3>
                  <p className="mt-2 text-sm text-gray-600">
                    Gracias por escribirnos. Nuestro equipo te contactará en breve.
                  </p>
                  <button
                    onClick={() => setEnviado(false)}
                    className="mt-6 rounded-full bg-gray-900 px-8 py-3 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-black"
                  >
                    Enviar otro mensaje
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input
                      name="nombre"
                      type="text"
                      required
                      placeholder="Nombre Completo*"
                      className={inputClass}
                    />
                    <input
                      name="celular"
                      type="tel"
                      required
                      placeholder="Celular*"
                      className={inputClass}
                    />
                  </div>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="Mail*"
                    className={`${inputClass} mt-4`}
                  />
                  <textarea
                    name="mensaje"
                    required
                    rows={8}
                    placeholder="Mensaje...*"
                    className={`${inputClass} mt-4 resize-none`}
                  />
                  <button
                    type="submit"
                    disabled={enviando}
                    className="mt-6 rounded-full bg-gray-900 px-8 py-3.5 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-black disabled:opacity-60"
                  >
                    {enviando ? "Enviando..." : "Enviar mensaje"}
                  </button>
                </form>
              )}
            </div>

            <div className="hidden lg:block">
              <div className="sticky top-24 rounded-sm border-[6px] border-white bg-white shadow-sm">
                <div className="flex aspect-[3/4] w-full items-center justify-center overflow-hidden bg-gray-100">
                  <Image
                    src={ContactoImg}
                    alt="Café Amelatte"
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </StoreLayout>
  )
}
