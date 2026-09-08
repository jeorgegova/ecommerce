import StoreLayout from "@/components/layout/StoreLayout"

const valores = [
  {
    titulo: "Calidad",
    descripcion: "Seleccionamos cada equipo y cada insumo con los más altos estándares del sector.",
    icono: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    titulo: "Servicio",
    descripcion: "Acompañamiento permanente antes, durante y después de la instalación.",
    icono: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
  {
    titulo: "Innovación",
    descripcion: "Tecnología de vending de última generación para oficinas y restaurantes.",
    icono: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
      </svg>
    ),
  },
  {
    titulo: "Cercanía",
    descripcion: "Un equipo humano que entiende las necesidades de cada cliente.",
    icono: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    ),
  },
]

const cifras = [
  { valor: "+500", etiqueta: "Clientes activos" },
  { valor: "+120", etiqueta: "Máquinas instaladas" },
  { valor: "10+", etiqueta: "Años de experiencia" },
  { valor: "24/7", etiqueta: "Soporte técnico" },
]

export default function SomosPage() {
  return (
    <StoreLayout>
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#C8102E]">Sobre nosotros</p>
          <h1 className="mt-3 text-4xl font-extrabold uppercase tracking-tight text-gray-900 sm:text-5xl">
            Quiénes somos
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-gray-600">
            En <span className="font-bold text-gray-900">amelatte</span> llevamos el mejor café y las máquinas
            vending de última generación a oficinas y restaurantes. Creemos que un buen café transforma la
            jornada de las personas, por eso combinamos tecnología, insumos de calidad y un servicio que
            responde cuando lo necesitas.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-2 gap-6 sm:gap-8">
          {cifras.map((c) => (
            <div key={c.etiqueta} className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm sm:p-8">
              <p className="text-3xl font-extrabold text-[#C8102E] sm:text-4xl">{c.valor}</p>
              <p className="mt-2 text-sm font-medium text-gray-500">{c.etiqueta}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-extrabold uppercase tracking-tight text-gray-900 sm:text-3xl">
            Nuestros valores
          </h2>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {valores.map((v) => (
            <div key={v.titulo} className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#C8102E]/10 text-[#C8102E]">
                {v.icono}
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">{v.titulo}</h3>
                <p className="mt-1 text-sm leading-relaxed text-gray-600">{v.descripcion}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-3xl bg-gray-900 px-8 py-12 text-center sm:px-16">
          <h2 className="text-2xl font-extrabold uppercase tracking-tight text-white sm:text-3xl">
            Amelatte ahora en tu oficina y restaurante
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-gray-300 sm:text-base">
            Instalamos sin costo, surtimos periódicamente y damos mantenimiento continuo. Tú solo disfrutas
            del mejor café.
          </p>
          <a
            href="/contacto"
            className="mt-8 inline-flex items-center justify-center rounded-full border-2 border-white bg-white px-10 py-3 text-xs font-bold uppercase tracking-widest text-gray-900 transition-colors duration-200 hover:bg-gray-900 hover:text-white sm:text-sm"
          >
            Contáctanos
          </a>
        </div>
      </div>
    </StoreLayout>
  )
}
