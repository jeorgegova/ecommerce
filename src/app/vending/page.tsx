import type { Metadata } from "next"
import VendingImg from "@/assets/vending.jpg"
import LogoVendingImg from "@/assets/logoVendingShop.png"
import BusinessLandingPage from "@/components/store/BusinessLandingPage"
import StoreLayout from "@/components/layout/StoreLayout"

export const metadata: Metadata = {
  title: "Servicio de máquinas vending | Amelatte",
  description: "Soluciones de máquinas vending para hospitales, empresas y establecimientos de alto tráfico.",
}

export default function VendingPage() {
  return (
    <StoreLayout>
      <BusinessLandingPage
        eyebrow="Vending · Soluciones para espacios"
        title="Una pausa que siempre está disponible."
        description="Llevamos máquinas vending de bebidas, café y snacks a hospitales, empresas y establecimientos que quieren ofrecer una solución práctica a sus visitantes y equipos."
        image={VendingImg}
        imageAlt="Máquina vending en un espacio de atención al público"
        imagePosition="object-center"
        introTitle="Más que una máquina: un servicio que se mantiene en movimiento."
        introText="Analizamos tu espacio, el flujo de personas y sus hábitos de consumo para proponerte una solución vending que tenga sentido. Nos encargamos del acompañamiento para que la experiencia sea confiable, ordenada y disponible."
        features={[
          { eyebrow: "Diagnóstico", title: "El lugar correcto", text: "Evaluamos el tráfico, los horarios y el tipo de público para definir la mejor ubicación y configuración." },
          { eyebrow: "Oferta", title: "Lo que la gente busca", text: "Combinamos café, bebidas frías y snacks según las necesidades de tu establecimiento." },
          { eyebrow: "Servicio", title: "Operación acompañada", text: "Te acompañamos con reposición, soporte y seguimiento para que la máquina siga funcionando." },
        ]}
        highlights={[
          { name: "Hospitales", descriptor: "Disponibilidad 24/7", text: "Una alternativa práctica para acompañantes, personal médico y visitantes durante jornadas exigentes.", image: VendingImg, imageAlt: "Solución vending para establecimientos hospitalarios" },
          { name: "Empresas", descriptor: "Cultura de bienestar", text: "Lleva bebidas y snacks a los espacios donde tus equipos pasan buena parte de su día.", image: LogoVendingImg, imageAlt: "Servicio de máquinas vending para empresas" },
          { name: "Establecimientos", descriptor: "Más valor para tu espacio", text: "Integra una solución de autoservicio donde las personas puedan encontrar lo que necesitan.", image: VendingImg, imageAlt: "Máquina vending para establecimientos" },
        ]}
        audience={["Hospitales", "Empresas", "Universidades y clínicas"]}
        ctaTitle="¿Tienes un espacio con flujo de personas? Hagamos que funcione mejor."
        ctaText="Cuéntanos sobre tu establecimiento y evaluaremos contigo una alternativa vending a la medida."
      />
    </StoreLayout>
  )
}
