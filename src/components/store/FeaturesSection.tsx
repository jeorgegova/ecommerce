import type { ReactNode } from "react"

interface Feature {
  titulo: string
  descripcion: string
  icono: ReactNode
  acento: string
  acentoSuave: string
}

const features: Feature[] = [
  {
    titulo: "Envío gratis",
    descripcion:
      "Todos nuestros envíos son gratis a cualquier ciudad del Eje Cafetero. Para otras ciudades se indicará al momento de hacer la compra.",
    icono: (
      <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.4}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m2.25 0a1.5 1.5 0 00-3 0m2.25 0a1.5 1.5 0 013 0m-3 0v-7.5c0-.621.504-1.125 1.125-1.125H10.5c.621 0 1.125.504 1.125 1.125v7.5m0-4.5h3.75c.621 0 1.125.504 1.125 1.125v3.375M14.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h3.75c.621 0 1.125-.504 1.125-1.125V11.25c0-2.484-1.327-4.656-3.311-5.855m3.311 8.11V8.25" />
        <circle cx="16.5" cy="8.25" r="3" strokeDasharray="2.5 1.5" />
      </svg>
    ),
    acento: "#E3C221",
    acentoSuave: "#E3C22120",
  },
  {
    titulo: "Todas las tarjetas",
    descripcion:
      "Ofrecemos varias formas de pago para que puedas realizar tu compra desde nuestra tienda sin ningún inconveniente y puedas degustar el mejor café.",
    icono: (
      <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.4}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
      </svg>
    ),
    acento: "#4FC3E8",
    acentoSuave: "#4FC3E820",
  },
  {
    titulo: "Compra segura",
    descripcion:
      "Puedes estar tranquilo, ya que todas las compras que realices en nuestra tienda en línea están aseguradas hasta que las recibas.",
    icono: (
      <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.623 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    acento: "#A3E635",
    acentoSuave: "#A3E63520",
  },
]

export default function FeaturesSection() {
  return (
    <section className="relative overflow-hidden bg-white py-20 text-gray-900 sm:py-24">
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-56 -right-24 h-[30rem] w-[30rem] rounded-full border-[44px] border-[#C8102E]/[0.08]" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <div className="flex flex-col justify-between gap-8 border-b border-gray-900/10 pb-10 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#F2B84B]">Una compra pensada para ti</p>
            <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight sm:text-5xl">Todo lo bueno empieza con tranquilidad.</h2>
          </div>
          <p className="max-w-sm text-sm leading-7 text-gray-600">Desde el envío hasta la entrega, cuidamos cada parte de tu experiencia para que solo tengas que elegir tu próximo café.</p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {features.map((f, i) => (
            <div
              key={f.titulo}
              className="animate-card-in group relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-7 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-[#C8102E]/30 hover:shadow-2xl hover:shadow-[#C8102E]/10 sm:p-9"
              style={{ animationDelay: `${i * 120}ms` }}
            >
              <span aria-hidden="true" className="pointer-events-none absolute -right-1 -top-3 select-none text-[90px] font-extrabold leading-none tracking-tighter text-gray-900/[0.05]">0{i + 1}</span>

              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm ring-1 ring-black/5 transition-transform duration-300 ease-out group-hover:scale-110 group-hover:-rotate-3" style={{ backgroundColor: f.acento }}>
                {f.icono}
              </div>

              <h3 className="relative mt-8 text-xl font-extrabold tracking-tight text-gray-900">{f.titulo}</h3>
              <div className="relative mt-4 h-1 w-8 rounded-full transition-all duration-300 ease-out group-hover:w-16" style={{ backgroundColor: f.acento }} />
              <p className="relative mt-5 text-sm leading-7 text-gray-600">{f.descripcion}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
