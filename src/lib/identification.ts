/**
 * Tipos de documento de identidad (Colombia) usados en la proforma de compra.
 *
 * Es la unica fuente de verdad: la consumen el modal de datos, la pagina de
 * perfil, el checkout y el generador de PDF. Si se agrega un tipo aqui, la
 * migracion SQL debe aceptar el mismo valor en su CHECK constraint.
 *
 * NOTA sobre el digito de verificacion del NIT: se valida el FORMATO
 * (9 digitos, o 10 con digito de verificacion) pero NO se calcula ni se exige
 * el digito de verificacion. Es deliberado: bloquear el checkout por un calculo
 * mal implementado seria peor que aceptar una errata, y no hay una fuente
 * oficial contra la que validar sin conexion. Si lo quieres, se agrega como
 * advertencia, no como error.
 */

export const IDENTIFICATION_TYPE_VALUES = ["cc", "nit", "ce", "passport"] as const

export type IdentificationType = (typeof IDENTIFICATION_TYPE_VALUES)[number]

interface IdentificationTypeSpec {
  value: IdentificationType
  /** Nombre completo para el formulario. */
  label: string
  /** Abreviatura para el PDF: "CC", "NIT", "CE", "PP". */
  short: string
  placeholder: string
  charset: "digits" | "alphanumeric"
  minLength: number
  maxLength: number
  /** Texto de ayuda bajo el campo. */
  hint: string
}

export const IDENTIFICATION_TYPES: Record<IdentificationType, IdentificationTypeSpec> = {
  cc: {
    value: "cc",
    label: "Cédula de ciudadanía",
    short: "CC",
    placeholder: "1234567890",
    charset: "digits",
    minLength: 6,
    maxLength: 10,
    hint: "Entre 6 y 10 dígitos.",
  },
  nit: {
    value: "nit",
    label: "NIT",
    short: "NIT",
    placeholder: "9001234567",
    charset: "digits",
    minLength: 9,
    maxLength: 10,
    hint: "9 dígitos, o 10 si incluye el dígito de verificación.",
  },
  ce: {
    value: "ce",
    label: "Cédula de extranjería",
    short: "CE",
    placeholder: "A12345678",
    charset: "alphanumeric",
    minLength: 5,
    maxLength: 12,
    hint: "Entre 5 y 12 caracteres alfanuméricos.",
  },
  passport: {
    value: "passport",
    label: "Pasaporte",
    short: "PP",
    placeholder: "AB123456",
    charset: "alphanumeric",
    minLength: 6,
    maxLength: 20,
    hint: "Entre 6 y 20 caracteres alfanuméricos.",
  },
}

export const IDENTIFICATION_TYPE_LIST: IdentificationTypeSpec[] =
  IDENTIFICATION_TYPE_VALUES.map((value) => IDENTIFICATION_TYPES[value])

export function isIdentificationType(value: unknown): value is IdentificationType {
  return typeof value === "string" && (IDENTIFICATION_TYPE_VALUES as readonly string[]).includes(value)
}

/** Convierte un valor vindo de la base de datos a un tipo conocido, o null. */
export function parseIdentificationType(value: unknown): IdentificationType | null {
  return isIdentificationType(value) ? value : null
}

/**
 * Quita prefijos, separadores y espacios. Deja solo lo que el tipo admite.
 * No valida longitud: eso lo hace `getIdentificationError`.
 */
export function normalizeIdentificationNumber(type: IdentificationType, raw: string): string {
  const value = String(raw ?? "").trim()
  if (IDENTIFICATION_TYPES[type].charset === "digits") {
    return value.replace(/\D/g, "")
  }
  return value.replace(/[^0-9a-zA-Z]/g, "").toUpperCase()
}

/**
 * Valida el numero contra las reglas de su tipo.
 * Devuelve `null` si es valido, o el mensaje de error.
 */
export function getIdentificationError(type: IdentificationType, raw: string): string | null {
  const spec = IDENTIFICATION_TYPES[type]
  const value = String(raw ?? "").trim()

  if (!value) return `Ingresa tu ${spec.label}`

  // El prefijo va en el select, no en el campo de texto.
  if (spec.charset === "digits" && /[a-zA-Z]/.test(value)) {
    return `El ${spec.short} solo admite dígitos. Escribe únicamente el número, sin "${spec.short}".`
  }

  const normalized = normalizeIdentificationNumber(type, value)
  if (!normalized) return `Ingresa tu ${spec.label}`

  if (spec.charset === "digits" && !/^\d+$/.test(normalized)) {
    return `El ${spec.short} solo admite dígitos.`
  }
  if (spec.charset === "alphanumeric" && !/^[0-9A-Z]+$/.test(normalized)) {
    return `${spec.label} solo admite letras y números.`
  }
  if (normalized.length < spec.minLength || normalized.length > spec.maxLength) {
    return `${spec.label} inválida: ${spec.hint.toLowerCase()}`
  }
  return null
}

/** Normaliza y valida en un solo paso. Lanza si es inválido (uso interno). */
export function requireIdentificationNumber(type: IdentificationType, raw: string): string {
  const error = getIdentificationError(type, raw)
  if (error) throw new Error(error)
  return normalizeIdentificationNumber(type, raw)
}

/** Como se imprime en el PDF: "NIT 900.123.456-7", "CC 1234567890". */
export function formatIdentification(type: IdentificationType | null, raw: string | null | undefined): string {
  const value = String(raw ?? "").trim()
  if (!value) return ""

  const parsed = parseIdentificationType(type)
  if (!parsed) return value

  const spec = IDENTIFICATION_TYPES[parsed]
  const normalized = normalizeIdentificationNumber(parsed, value)

  if (parsed === "nit" && (normalized.length === 9 || normalized.length === 10)) {
    // El NIT se lee con puntos y el digito de verificacion aparte.
    const base = normalized.slice(0, 9).replace(/(\d{3})(?=\d)/g, "$1.")
    return normalized.length === 10
      ? `${spec.short} ${base}-${normalized.slice(9)}`
      : `${spec.short} ${base}`
  }
  return `${spec.short} ${normalized}`
}

/** El perfil tiene lo necesario para emitir la proforma. */
export function isIdentificationComplete(data: {
  identification?: string | null
  identification_type?: string | null
}): boolean {
  return Boolean(
    String(data.identification ?? "").trim() &&
      isIdentificationType(data.identification_type)
  )
}

export interface CustomerIdentification {
  value: string | null
  type: IdentificationType | null
}

/**
 * Que identificacion se imprime en la proforma.
 *
 * Manda el snapshot guardado en la orden. Si la orden se creo antes de que
 * existiera esa columna, el snapshot es NULL y se cae al dato actual del
 * perfil: es una aproximacion, pero preferible a una proforma sin
 * identificacion. El numero nunca se inventa, solo se toma de otro lado.
 */
export function resolveCustomerIdentification(
  snapshot: { identification?: string | null; identification_type?: string | null } | null | undefined,
  currentProfile: { identification?: string | null; identification_type?: string | null } | null | undefined
): CustomerIdentification {
  const snapshotValue = snapshot?.identification?.trim() || null
  if (snapshotValue) {
    // El snapshot puede traer numero sin tipo si se cargo a mano: se conserva
    // el numero en vez de descartarlo por falta del tipo.
    return { value: snapshotValue, type: parseIdentificationType(snapshot?.identification_type) }
  }

  const profileValue = currentProfile?.identification?.trim() || null
  if (profileValue) {
    return { value: profileValue, type: parseIdentificationType(currentProfile?.identification_type) }
  }

  return { value: null, type: null }
}
