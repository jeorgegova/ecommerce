const testimonios = [
  {
    texto:
      "Todos mis clientes se llevan un grato recuerdo cuando después de sus comidas se deleitan con Amelatte, alguna vez te imaginaste un café que te llevará unas sensaciones maravillosas a tu cuerpo? Aquí lo tienes.",
    autor: "Alessandro Tenti",
  },
  {
    texto:
      "Un paladar exquisito se debe deleitar con este fabuloso café, Amelatte ha encontrado una calidad excepcional desarrollando una armonía en todas las propiedades del café, dulce y achocolatado, que sabor inigualable.",
    autor: "Mauricio Sanchez",
  },
  {
    texto:
      "Les puedo asegurar que si buscan sentirse lo grandes que son, acompañar sus días con café Amelatte los va a llevar a una sensación inigualable con energía, calidez y lo mejor, su delicioso sabor.",
    autor: "Antonio Nuñez",
  },
]

export default function TestimonialsSection() {
  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold uppercase tracking-tight text-gray-900 sm:text-4xl">
            Hablan nuestros clientes
          </h2>
          <div className="mx-auto mt-4 h-1.5 w-28 rounded-full bg-[#C8102E]" />
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-0 lg:divide-x lg:divide-gray-100">
          {testimonios.map((t, i) => (
            <figure
              key={t.autor}
              className="group animate-card-in relative cursor-default rounded-2xl px-4 py-6 transition-all duration-300 ease-out hover:-translate-y-1 hover:bg-[#F7F5F1] hover:shadow-lg hover:shadow-gray-900/5 sm:px-6 lg:rounded-none lg:bg-transparent lg:px-10 lg:py-4 lg:hover:rounded-2xl lg:hover:bg-[#F7F5F1]"
              style={{ animationDelay: `${i * 120}ms`, animationFillMode: "backwards" }}
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-2 top-0 select-none font-serif text-6xl leading-none text-[#C8102E] opacity-0 transition-all duration-300 lg:left-4 group-hover:opacity-100 lg:group-hover:text-[#C8102E]"
              >
                &ldquo;
              </span>

              <blockquote className="text-sm leading-relaxed text-gray-500 transition-colors duration-300 group-hover:text-gray-700">
                {t.texto}
              </blockquote>

              <figcaption className="mt-6 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-gray-400 transition-colors duration-300 group-hover:text-[#C8102E]">
                <span className="h-px w-4 bg-gray-300 transition-all duration-300 group-hover:w-6 group-hover:bg-[#C8102E]" />
                {t.autor}
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <span className="block h-3.5 w-3.5 rounded-full border-2 border-gray-300 transition-transform duration-300 hover:scale-125 hover:border-[#C8102E]" />
        </div>
      </div>
    </section>
  )
}
