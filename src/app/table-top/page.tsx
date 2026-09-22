import type { Metadata } from "next"
import TableTopImg from "@/assets/tableTop.jpg"
import CaracteristicasImg from "@/assets/caracteristicas.png"
import BusinessLandingPage from "@/components/store/BusinessLandingPage"
import StoreLayout from "@/components/layout/StoreLayout"

export const metadata: Metadata = {
  title: "Table Top para oficinas | Amelatte",
  description: "Lleva una experiencia de café espresso a tu oficina con nuestras soluciones Table Top.",
}

export default function TableTopPage() {
  return (
    <StoreLayout>
      <BusinessLandingPage
        eyebrow="Table Top · Café para oficinas"
        title="El café de tu oficina, a otro nivel."
        description="Instala una solución de café tipo espresso que convierte cualquier pausa en un momento especial. Pensada para equipos, clientes y espacios de trabajo que valoran el buen café."
        image={TableTopImg}
        imageAlt="Máquina Table Top para preparar café en una oficina"
        introTitle="Una estación de café que trabaja al ritmo de tu equipo."
        introText="Te acompañamos a encontrar la máquina, el café y la operación que mejor se adaptan a tu oficina. Creamos una experiencia práctica, elegante y consistente para que no tengas que salir a buscar tu próximo espresso."
        features={[
          { eyebrow: "Experiencia", title: "Café tipo espresso", text: "Una preparación con carácter y calidad para que cada taza se sienta como una pausa bien merecida." },
          { eyebrow: "Operación", title: "Fácil de integrar", text: "Una alternativa pensada para ubicarse en oficinas, salas de reuniones y zonas comunes sin complicar tu día a día." },
          { eyebrow: "Acompañamiento", title: "Estamos contigo", text: "Te asesoramos en la elección de la solución, los insumos y la forma de mantenerla siempre lista." },
        ]}
        highlights={[
          { name: "Para tu equipo", descriptor: "Bienestar laboral", text: "Crea un punto de encuentro que mejora la experiencia de las personas durante la jornada.", image: CaracteristicasImg, imageAlt: "Características de una solución de café Amelatte" },
          { name: "Para tus clientes", descriptor: "Hospitalidad", text: "Recibe a tus visitantes con una taza que comunica cuidado, atención y calidad.", image: TableTopImg, imageAlt: "Máquina de café Table Top en un espacio de trabajo" },
        ]}
        audience={["Oficinas", "Salas de reuniones", "Hoteles y coworkings"]}
        ctaTitle="Cuéntanos cómo es tu oficina y diseñemos la experiencia ideal."
        ctaText="Nuestro equipo puede orientarte con la solución Table Top más adecuada para tu espacio y el número de personas que lo utilizan."
      />
    </StoreLayout>
  )
}
