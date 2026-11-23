export interface SettingItem {
  id?: string
  key: string
  value: any
  description: string | null
  created_at?: string
  updated_at?: string
}

export type SettingsMap = Record<string, string>

export interface DefaultSettingDefinition {
  key: string
  value: any
  description: string
  category: "general" | "payments" | "shipping" | "inventory" | "social" | "advanced"
}

export const DEFAULT_STORE_SETTINGS: DefaultSettingDefinition[] = [
  // General / Tienda
  { key: "store_name", value: "Amelatte", description: "Nombre comercial de la tienda", category: "general" },
  { key: "store_description", value: "Café Amelatte es una compañía cuyo proceso nace del maravilloso mundo del café, ese café que latte en el corazón de cada una de las personas que hacen parte de la tradición y cultura de la región del viejo Caldas.", description: "Descripción corta o lema de la tienda", category: "general" },
  { key: "store_email", value: "hola@amelatte.co", description: "Correo principal de contacto y atención", category: "general" },
  { key: "store_phone", value: "+57 318 459 6076", description: "Teléfono o línea de atención al cliente", category: "general" },
  { key: "store_address", value: "Calle 67 N° 23a - 46", description: "Dirección física principal de la tienda u oficina", category: "general" },
  { key: "store_city", value: "Manizales / Colombia", description: "Ciudad y país de ubicación", category: "general" },
  { key: "store_currency", value: "COP", description: "Moneda de facturación por defecto", category: "general" },
  { key: "store_locale", value: "es-CO", description: "Formato regional e idioma", category: "general" },
  { key: "store_timezone", value: "America/Bogota", description: "Zona horaria del sistema", category: "general" },

  // Pagos y Cuentas Bancarias (usado en checkout y proforma PDF)
  { key: "banco_consignar", value: "Bancolombia", description: "Nombre de la entidad bancaria para transferencias", category: "payments" },
  { key: "numero_cuenta_bancaria", value: "000-000000-00", description: "Número de cuenta bancaria para pagos", category: "payments" },
  { key: "tipo_cuenta_bancaria", value: "Ahorros", description: "Tipo de cuenta bancaria (Ahorros / Corriente)", category: "payments" },
  { key: "titular_cuenta", value: "Amelatte S.A.S. - NIT 900.000.000-1", description: "Nombre del titular y NIT o documento", category: "payments" },
  { key: "instrucciones_pago", value: "Una vez realizada la transferencia, envía el comprobante a nuestro WhatsApp adjuntando el número de tu pedido.", description: "Instrucciones de pago para el cliente en el checkout y PDF", category: "payments" },

  // Envíos e Impuestos
  { key: "shipping_cost", value: 12000, description: "Costo fijo de envío estándar ($ COP)", category: "shipping" },
  { key: "shipping_free_min", value: 150000, description: "Monto mínimo de compra para envío gratis ($ COP)", category: "shipping" },
  { key: "tax_rate", value: 19, description: "Porcentaje de impuesto / IVA (%)", category: "shipping" },
  { key: "order_auto_confirm", value: true, description: "Confirmar pedidos automáticamente tras recibirlos", category: "shipping" },

  // Inventario y Catálogo
  { key: "low_stock_threshold", value: 5, description: "Umbral global para alerta de stock bajo", category: "inventory" },
  { key: "stock_bar_max", value: 20, description: "Tope visual de la barra de nivel de stock", category: "inventory" },
  { key: "pagination_size", value: 20, description: "Cantidad de productos por página en la tienda", category: "inventory" },
  { key: "quick_adjust_amounts", value: [1, 5, 10], description: "Cantidades para botones de ajuste rápido de stock", category: "inventory" },

  // Redes Sociales y Marketing
  { key: "social_whatsapp", value: "+573184596076", description: "Número de WhatsApp para contacto directo y soporte", category: "social" },
  { key: "social_instagram", value: "https://www.instagram.com/amelatte.colombia/", description: "Usuario o enlace del perfil de Instagram", category: "social" },
  { key: "social_facebook", value: "https://www.facebook.com/Amelatte-217262512562392?_rdc=1&_rdr", description: "Página o enlace de Facebook", category: "social" },
  { key: "google_analytics_id", value: "", description: "ID de medición de Google Analytics (ej: G-XXXXXXX)", category: "social" },
  { key: "gtm_id", value: "", description: "ID de Google Tag Manager (ej: GTM-XXXXXX)", category: "social" },

  // Mantenimiento y Sistema
  { key: "maintenance_mode", value: false, description: "Activar modo de mantenimiento en la tienda", category: "advanced" },
]
