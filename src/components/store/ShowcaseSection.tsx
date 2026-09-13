const items = [
  {
    titulo: "TABLE TOP",
    descripcion:
      "Nuestra máquina Bunn ofrece un proceso de preparación de café por goteo, una manera sencilla para darte gusto en tu lugar de trabajo y consentirte con nuestro café Amelatte.",
    href: "/products",
  },
  {
    titulo: "VENDING",
    descripcion:
      "Ofrecemos máquinas expendedoras para ubicar en una empresa o cualquier otro lugar de alto tráfico de personas para el suministro de bebidas calientes a base de café, bebidas frías y snacks.",
    href: "/products",
  },
  {
    titulo: "CAFÉ",
    descripcion:
      "Disfruta nuestro café Amelatte molido o en grano, 100% Arábigo seleccionado con presentaciones de 500 gramos.",
    href: "/products",
  },
]

export default function ShowcaseSection() {
  return (
    <section className="bg-white pb-16 pt-4 sm:pb-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12">
          {items.map((item) => (
            <a
              key={item.titulo}
              href={item.href}
              className="group block [perspective:1200px]"
            >
              <div className="relative aspect-[552/383] w-full transition-transform duration-500 ease-out [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
                <div className="absolute inset-0 [backface-visibility:hidden]">
                  <div className="h-full w-full overflow-hidden rounded-2xl bg-gray-100 transition-colors duration-300 group-hover:bg-gray-200">
                  </div>
                </div>

                <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-[#C8102E] p-6 text-center [backface-visibility:hidden] [transform:rotateY(180deg)]">
                  <h3 className="text-lg font-extrabold uppercase tracking-widest text-white">
                    {item.titulo}
                  </h3>
                  <span className="mt-2 h-1 w-10 rounded-full bg-white/70" />
                  <p className="mt-4 text-sm leading-relaxed text-white/90">
                    {item.descripcion}
                  </p>
                </div>
              </div>

              <span className="mx-auto mt-5 flex w-fit items-center justify-center rounded-lg border border-gray-200 bg-gray-100 px-10 py-2.5 text-sm uppercase tracking-widest text-gray-700 transition-colors duration-300 group-hover:border-gray-900 group-hover:bg-gray-900 group-hover:text-white">
                {item.titulo}
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
