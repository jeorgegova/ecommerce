import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PARTEX - Repuestos para Máquinas Vending Colombia",
    short_name: "PARTEX",
    description: "Repuestos, bombas y componentes para máquinas expendedoras y café vending en Colombia.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#111827",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  }
}
