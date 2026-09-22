import Image, { type StaticImageData } from "next/image"
import Link from "next/link"
import { ArrowRight, Check, ChevronRight } from "lucide-react"

interface Feature {
  eyebrow?: string
  title: string
  text: string
}

interface Highlight {
  name: string
  descriptor: string
  text: string
  image: StaticImageData
  imageAlt: string
}

interface BusinessLandingPageProps {
  eyebrow: string
  title: string
  description: string
  image: StaticImageData
  imageAlt: string
  imagePosition?: string
  introTitle: string
  introText: string
  features: Feature[]
  highlights: Highlight[]
  audience: string[]
  ctaTitle: string
  ctaText: string
}

export default function BusinessLandingPage({
  eyebrow,
  title,
  description,
  image,
  imageAlt,
  imagePosition = "object-center",
  introTitle,
  introText,
  features,
  highlights,
  audience,
  ctaTitle,
  ctaText,
}: BusinessLandingPageProps) {
  return (
    <>
      <section className="relative overflow-hidden bg-[#202124] text-white">
        <div className="absolute -right-32 -top-40 h-[32rem] w-[32rem] rounded-full bg-[#C8102E]/20 blur-3xl" />
        <div className="mx-auto grid max-w-7xl lg:min-h-[590px] lg:grid-cols-[1.02fr_0.98fr]">
          <div className="relative z-10 flex flex-col justify-center px-5 py-20 sm:px-8 lg:px-12 lg:py-24">
            <p className="animate-fade-in text-xs font-bold uppercase tracking-[0.3em] text-[#F2B84B]">{eyebrow}</p>
            <h1 className="mt-5 max-w-2xl text-4xl font-black leading-[0.98] tracking-tight sm:text-6xl">{title}</h1>
            <p className="mt-7 max-w-xl text-base leading-8 text-white/70 sm:text-lg">{description}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/contacto" className="group inline-flex items-center gap-3 rounded-full bg-[#C8102E] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#C8102E]/20 transition-all hover:-translate-y-0.5 hover:bg-[#E0183A] hover:shadow-xl hover:shadow-[#C8102E]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#202124]">
                Quiero más información
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href="#conoce-mas" className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3.5 text-sm font-semibold text-white/80 transition-colors hover:border-white/50 hover:text-white">
                Conoce la solución
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          <div className="relative min-h-[320px] lg:min-h-0">
            <Image src={image} alt={imageAlt} fill priority sizes="(max-width: 1024px) 100vw, 50vw" className={`object-cover ${imagePosition}`} />
            <div className="absolute inset-0 bg-gradient-to-t from-[#202124]/70 via-transparent to-transparent lg:bg-gradient-to-r lg:from-[#202124]/30 lg:to-transparent" />
            <div className="absolute bottom-6 right-6 hidden max-w-[220px] border-l-2 border-[#F2B84B] pl-4 text-sm leading-6 text-white/80 lg:block">Una experiencia pensada para que cada pausa tenga mejor sabor.</div>
          </div>
        </div>
      </section>

      <section id="conoce-mas" className="bg-[#F6F6F4] py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#C8102E]">La propuesta Amelatte</p>
              <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight text-gray-900 sm:text-4xl">{introTitle}</h2>
            </div>
            <p className="max-w-2xl text-lg leading-8 text-gray-600">{introText}</p>
          </div>

          <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-gray-200 bg-gray-200 md:grid-cols-3">
            {features.map((feature, index) => (
              <article key={feature.title} className="bg-white p-7 transition-colors hover:bg-[#fffaf5] sm:p-8">
                <span className="font-mono text-sm text-[#C8102E]">0{index + 1}</span>
                {feature.eyebrow && <p className="mt-8 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">{feature.eyebrow}</p>}
                <h3 className="mt-3 text-xl font-bold text-gray-900">{feature.title}</h3>
                <p className="mt-3 text-sm leading-7 text-gray-600">{feature.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#C8102E]">Pensado para ti</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">Una solución que se adapta</h2>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-500">
              {audience.map((item) => <span key={item} className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[#C8102E]" />{item}</span>)}
            </div>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {highlights.map((highlight) => (
              <article key={highlight.name} className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-gray-300 hover:shadow-xl hover:shadow-gray-200/60">
                <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                  <Image src={highlight.image} alt={highlight.imageAlt} fill sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
                <div className="p-6">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#C8102E]">{highlight.descriptor}</p>
                  <h3 className="mt-2 text-2xl font-black text-gray-900">{highlight.name}</h3>
                  <p className="mt-3 text-sm leading-7 text-gray-600">{highlight.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#C8102E] px-5 py-16 text-white sm:px-8 sm:py-20">
        <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/70">Hablemos de tu proyecto</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-black tracking-tight sm:text-4xl">{ctaTitle}</h2>
            <p className="mt-4 max-w-xl leading-7 text-white/80">{ctaText}</p>
          </div>
          <Link href="/contacto" className="group inline-flex shrink-0 items-center gap-3 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-[#C8102E] transition-all hover:-translate-y-0.5 hover:bg-[#fff5eb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#C8102E]">
            Contactar a Amelatte
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>
    </>
  )
}
