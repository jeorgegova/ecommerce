import Link from "next/link"
import StoreLayout from "@/components/layout/StoreLayout"

const recetas = [
  {
    titulo: "Espresso clásico",
    descripcion: "El corazón de todo buen café: extracción corta, crema densa y sabor intenso.",
    tiempo: "2 min",
    dificultad: "Fácil",
    gradiente: "from-amber-200 to-amber-400",
  },
  {
    titulo: "Capuchino",
    descripcion: "Espresso con leche vaporizada y espuma cremosa, espolvoreado con cacao.",
    tiempo: "4 min",
    dificultad: "Fácil",
    gradiente: "from-orange-200 to-amber-300",
  },
  {
    titulo: "Latte",
    descripcion: "Suave y equilibado, con más leche vaporizada y una fina capa de espuma.",
    tiempo: "4 min",
    dificultad: "Fácil",
    gradiente: "from-stone-200 to-amber-200",
  },
  {
    titulo: "Mocaccino",
    descripcion: "Espresso, chocolate y leche: el combo perfecto para los amantes del dulce.",
    tiempo: "5 min",
    dificultad: "Media",
    gradiente: "from-rose-200 to-amber-300",
  },
  {
    titulo: "Macchiato",
    descripcion: "Espresso manchado con una nube de espuma de leche. Intenso y elegante.",
    tiempo: "3 min",
    dificultad: "Fácil",
    gradiente: "from-yellow-100 to-amber-300",
  },
  {
    titulo: "Coffee latte frío",
    descripcion: "Café, hielo y leche fría: refrescante para las tardes calurosas de oficina.",
    tiempo: "5 min",
    dificultad: "Media",
    gradiente: "from-sky-200 to-amber-200",
  },
]

export default function RecetasPage() {
  return (
    <StoreLayout>
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#C8102E]">Para disfrutar en casa u oficina</p>
          <h1 className="mt-3 text-4xl font-extrabold uppercase tracking-tight text-gray-900 sm:text-5xl">
            Recetas
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
            Prepara tus bebidas favoritas con el café de tu máquina amelatte.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {recetas.map((r) => (
            <article key={r.titulo} className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">
              <div className={`flex h-40 items-center justify-center bg-gradient-to-br ${r.gradiente}`}>
                <svg className="h-14 w-14 text-white/90 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.055 4.024.165C17.155 8.51 18 9.473 18 10.608v2.513m-3-4.87v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.38a48.474 48.474 0 00-6-.37c-2.032 0-4.034.126-6 .37m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.17c0 .62-.504 1.124-1.125 1.124H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12M12.265 3.11a.375.375 0 11-.53 0L12 2.845l.265.265zm-3 0a.375.375 0 11-.53 0L9 2.845l.265.265zm6 0a.375.375 0 11-.53 0L15 2.845l.265.265z" />
                </svg>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 text-[11px] font-semibold">
                  <span className="rounded-full bg-[#C8102E]/10 px-2 py-0.5 text-[#C8102E]">{r.tiempo}</span>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">{r.dificultad}</span>
                </div>
                <h2 className="mt-3 text-lg font-bold text-gray-900">{r.titulo}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{r.descripcion}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-14 text-center">
          <Link
            href="/products"
            className="inline-flex items-center justify-center rounded-full border-2 border-gray-900 bg-white px-10 py-3 text-xs font-bold uppercase tracking-widest text-gray-900 transition-colors duration-200 hover:bg-gray-900 hover:text-white sm:text-sm"
          >
            Ver insumos en la tienda
          </Link>
        </div>
      </div>
    </StoreLayout>
  )
}
