import Link from "next/link"
import StoreLayout from "@/components/layout/StoreLayout"

export default function SomosPage() {
  return (
    <StoreLayout>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-2 text-xs text-gray-500" aria-label="Breadcrumb">
          <Link href="/" className="transition-colors hover:text-gray-900">Home</Link>
          <svg className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
          <span className="font-medium text-gray-700">Somos</span>
        </nav>

        <hr className="mt-4 border-gray-200" />

        <h1 className="mt-8 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          Somos <span className="text-[#C8102E]">Amelatte</span>
        </h1>

        <div className="mt-6 overflow-hidden rounded-lg bg-gray-100">
          <div className="flex aspect-[2/1] w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-sky-100 via-gray-100 to-gray-200">
            <svg className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            <p className="text-xs font-medium text-gray-400">
              Espacio reservado para la imagen panorámica
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-10 text-sm leading-relaxed text-gray-500 lg:grid-cols-2">
          <div className="space-y-5">
            <p className="font-bold">
              Cafe Amelatte es una compañía cuyo proceso nace del maravilloso mundo del café, ese café que
              late en el corazón de cada una de las personas que hacen parte de la tradición y cultura de la
              región del viejo Caldas.
            </p>
            <p>
              Todo lo anterior se da como resultado del trabajo arduo del caficultor que selecciona grano a
              grano el mejor fruto, junto con la experiencia de los abuelos de antaño.
            </p>
            <p>
              Fue a partir de esa tradición familiar que en el 2008 nace la marca Amelatte, que resume toda
              esa cultura y experiencia, con un café tipo exportación de calidad Premium originario del
              municipio de Anserma-Caldas, donde año tras año ha mejorado cada uno de sus procesos para
              ofrecer un café de calidad, que además, contribuye socialmente de la mano de la cooperativa
              de caficultores de Anserma, en planes de mejoramiento para las familias que viven del café en
              la región.
            </p>
          </div>
          <div className="space-y-5">
            <p>
              En Amelatte estamos convencidos que a partir del café podemos generar lazos para la vida, por
              eso la importancia de estar siempre en lugares de alto tráfico con nuestro café Vending,
              Estaciones de café en las oficinas y el café molido para el hogar.
            </p>
            <p>
              Toda una variada línea de productos, para que nuestros clientes en cualquier lugar puedan tener
              el placer de compartir y sentir el mejor aroma y sabor.
            </p>
            <p>
              Hoy en día, Café Amelatte sigue creciendo en otros mercados, ganando mayor posicionamiento y
              corazón entre consumidores de paladares exigentes que encuentran en una taza de café Amelatte,
              un gusto que late.
            </p>
          </div>
        </div>

        <hr className="my-12 border-gray-200" />

        <div className="grid gap-10 text-sm leading-relaxed text-gray-500 lg:grid-cols-2">
          <div className="space-y-5">
            <p className="font-bold">
              Amelatte caffee is a company whose process is born from the wonderful world of coffee, that
              coffee that beats in the heart of each of the people who are part of the tradition and culture
              of the old Caldas region.
            </p>
            <p>
              All the above is given as a result of the hard work of the coffee grower who selects grain by
              grain the best fruit, together with the experience of the grandparents of yesteryear.
            </p>
            <p>
              It was from this family tradition that in 2008 the Amelatte brand was born, which sums up all
              that culture and experience, with a Premium quality export-type coffee from the municipality
              of Anserma-Caldas, where year after year it has improved each one of its processes to offer
              quality coffee, which also contributes socially in the hands of the cooperative of coffee
              farmers of Anserma, in improvement plans for families that live off of coffee in the region.
            </p>
          </div>
          <div className="space-y-5">
            <p>
              In Amelatte we are convinced that from coffee we can generate ties for life, that&apos;s why
              the importance of always being in places of high traffic with our coffee Vending, coffee
              stations in the offices and coffee grounds for the home.
            </p>
            <p>
              All a varied line of products, so that our customers anywhere can have the pleasure of sharing
              and feeling the best aroma and flavor.
            </p>
            <p>
              Today, Amelatte coffee continues to grow in other markets, gaining greater positioning and
              heart among consumers of demanding palates who find in a cup of coffee Amelatte, a taste that
              latte.
            </p>
          </div>
        </div>

        <hr className="my-12 border-gray-200" />

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              titulo: "Quienes Somos?",
              descripcion:
                "Somos una empresa que nace del corazón del viejo Caldas para ofrecer un café de la mejor calidad y sabor.",
            },
            {
              titulo: "Por qué elegirnos?",
              descripcion:
                "Porque somos una empresa de tradición y de calidad Premium que garantiza los más altos estándares.",
            },
            {
              titulo: "Variadas presentaciones",
              descripcion:
                "Ofrecemos muchas opciones para poder degustar en cualquier lugar un café de verdad.",
            },
          ].map((item) => (
            <div key={item.titulo}>
              <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 overflow-hidden bg-gray-100">
                <svg className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                <p className="px-4 text-center text-xs font-medium text-gray-400">
                  Espacio reservado para la imagen
                </p>
              </div>
              <h3 className="mt-6 text-center text-lg font-extrabold text-gray-900">{item.titulo}</h3>
              <p className="mt-3 text-center text-sm leading-relaxed text-gray-500">{item.descripcion}</p>
            </div>
          ))}
        </div>

        <hr className="mb-4 mt-12 border-gray-200" />
      </div>
    </StoreLayout>
  )
}
