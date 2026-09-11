import Image from "next/image"
import AmelatteLogo from "@/assets/Logo-Amelatte.png"

export default function CoffeeLoader() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center">
      <svg viewBox="0 0 96 96" className="h-16 w-16" fill="none">
        <defs>
          <clipPath id="coffee-cup-clip">
            <path d="M26 44h40v20a10 10 0 01-10 10H36a10 10 0 01-10-10V44z" />
          </clipPath>
        </defs>

        <g className="coffee-steam" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round">
          <path d="M40 28c-2-4 2-6 0-10" style={{ animationDelay: "0s" }} />
          <path d="M48 26c-2-4 2-6 0-10" style={{ animationDelay: "0.35s" }} />
          <path d="M56 28c-2-4 2-6 0-10" style={{ animationDelay: "0.7s" }} />
        </g>

        <g clipPath="url(#coffee-cup-clip)">
          <rect
            x="24"
            y="40"
            width="44"
            height="38"
            fill="#C8102E"
            className="coffee-fill"
          />
        </g>

        <path
          d="M26 44h40v20a10 10 0 01-10 10H36a10 10 0 01-10-10V44z"
          stroke="#1F2937"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <path
          d="M66 48h6a8 8 0 010 16h-6"
          stroke="#1F2937"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          d="M20 82h52"
          stroke="#1F2937"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </svg>

      <Image
        src={AmelatteLogo}
        alt="Amelatte"
        className="mt-4 h-8 w-auto brightness-0"
      />
      <p className="mt-1 text-[11px] font-medium tracking-wide text-gray-400">
        Cargando el mejor café...
      </p>

      <div className="mt-3 flex gap-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="coffee-dot h-2.5 w-2.5 rounded-full bg-[#C8102E]"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  )
}
