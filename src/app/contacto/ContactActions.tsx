"use client"

import { useState } from "react"

type Props =
  | { type: "email"; value: string }
  | { type: "phone"; value: string; displayValue: string }

export default function ContactActions(props: Props) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    const text = props.value
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (props.type === "email") {
    return (
      <div className="mt-5 flex flex-wrap gap-2">
        <a
          href={`mailto:${props.value}`}
          className="inline-flex items-center justify-center rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
        >
          Enviar correo
        </a>
        <button
          onClick={copy}
          className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          {copied ? "¡Copiado!" : "Copiar correo"}
        </button>
      </div>
    )
  }

  return (
    <div className="mt-5 flex flex-wrap gap-2">
      <a
        href={`tel:${props.value}`}
        className="inline-flex items-center justify-center rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
      >
        Llamar ahora
      </a>
      <a
        href={`https://wa.me/${props.value.replace(/[^0-9]/g, "")}?text=Hola%20Willy%20Motos%2C%20necesito%20ayuda%20con%20un%20repuesto`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-1.5 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
      >
        WhatsApp
      </a>
      <button
        onClick={copy}
        className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        {copied ? "¡Copiado!" : "Copiar número"}
      </button>
    </div>
  )
}
