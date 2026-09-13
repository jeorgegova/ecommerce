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
      <svg className="h-8 w-8 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.4}>
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
      <svg className="h-8 w-8 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.4}>
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
      <svg className="h-8 w-8 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.623 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    acento: "#A3E635",
    acentoSuave: "#A3E63520",
  },
]

export default function FeaturesSection() {
  return (
    <section className="bg-white pb-20 pt-8 sm:pb-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8 lg:p-10">
          <div className="grid items-start gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {features.map((f, i) => (
            <div
              key={f.titulo}
              className={`animate-card-in group relative overflow-hidden rounded-2xl border border-gray-200 bg-[#F7F5F1] p-8 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-[#C8102E]/50 hover:shadow-xl hover:shadow-gray-900/5 sm:p-9 ${
                i === 1 ? "lg:pb-20" : "lg:pb-10"
              }`}
              style={{ animationDelay: `${i * 120}ms` }}
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -right-1 -top-3 select-none text-[90px] font-extrabold leading-none tracking-tighter text-gray-900/[0.05]"
              >
                0{i + 1}
              </span>

              <div
                className="relative flex h-16 w-16 items-center justify-center rounded-full ring-2 ring-offset-4 ring-offset-[#F7F5F1] transition-transform duration-300 ease-out group-hover:scale-110 group-hover:-rotate-6"
                style={{
                  backgroundColor: f.acentoSuave,
                  ["--tw-ring-color" as string]: f.acento,
                }}
              >
                {f.icono}
              </div>

              <h3 className="relative mt-7 text-lg font-extrabold uppercase tracking-wide text-gray-900">
                {f.titulo}
              </h3>
              <div
                className="relative mt-3 h-[3px] w-8 rounded-full transition-all duration-300 ease-out group-hover:w-16"
                style={{ backgroundColor: f.acento }}
              />
              <p className="relative mt-4 text-sm leading-relaxed text-gray-500">
                {f.descripcion}
              </p>
            </div>
          ))}
          </div>
        </div>
      </div>
    </section>
  )
}
