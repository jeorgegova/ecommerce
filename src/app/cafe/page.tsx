import type { Metadata } from "next"
import CafeImg from "@/assets/cafeAmelatte.jpg"
import SupremoImg from "@/assets/cafe_sumpremo.png"
import OrigenImg from "@/assets/origen.png"
import BusinessLandingPage from "@/components/store/BusinessLandingPage"
import StoreLayout from "@/components/layout/StoreLayout"

export const metadata: Metadata = {
  title: "Café Supremo, Espresso y Geisha | Amelatte",
  description: "Descubre los cafés Amelatte: Supremo, Espresso y Geisha.",
}

export default function CafePage() {
  return (
    <StoreLayout>
      <BusinessLandingPage
        eyebrow="Café Amelatte · Origen y sabor"
        title="Cada café tiene una forma distinta de despertar los sentidos."
        description="Conoce nuestra selección de cafés y encuentra el perfil que acompaña mejor tus mañanas, tus conversaciones y cada momento que merece una buena taza."
        image={CafeImg}
        imageAlt="Café Amelatte servido en una taza"
        introTitle="Tres caminos para disfrutar el café."
        introText="Seleccionamos diferentes perfiles para que puedas elegir según tu gusto y tu forma de preparar café: la versatilidad del Supremo, la intensidad del Espresso y el carácter especial del Geisha."
        features={[
          { eyebrow: "Selección", title: "Café para cada gusto", text: "Explora perfiles diferentes y encuentra el café que mejor se adapta a tu rutina y a tu método de preparación." },
          { eyebrow: "Presentación", title: "Para tu casa o negocio", text: "Lleva café Amelatte para disfrutarlo en casa, compartirlo o convertirlo en parte de tu experiencia de servicio." },
          { eyebrow: "Sabor", title: "Una pausa con intención", text: "Porque el café no es solo una bebida: es el comienzo de una conversación, una idea o un momento para ti." },
        ]}
        highlights={[
          { name: "Supremo", descriptor: "Equilibrado y versátil", text: "Una opción para quienes disfrutan un café amable y fácil de integrar a diferentes momentos del día.", image: SupremoImg, imageAlt: "Café Supremo Amelatte" },
          { name: "Espresso", descriptor: "Intenso y expresivo", text: "El perfil ideal para quienes buscan una taza con presencia, aroma y un final que permanece.", image: CafeImg, imageAlt: "Café Espresso Amelatte" },
          { name: "Geisha", descriptor: "Especial y memorable", text: "Una experiencia para descubrir con calma y disfrutar los matices de un café diferente.", image: OrigenImg, imageAlt: "Café Geisha Amelatte y su origen" },
        ]}
        audience={["En grano", "Molido", "Para regalar o compartir"]}
        ctaTitle="Encuentra tu café y haz que cada taza cuente."
        ctaText="Visita nuestra tienda para conocer las presentaciones disponibles o escríbenos si necesitas una recomendación."
      />
    </StoreLayout>
  )
}
