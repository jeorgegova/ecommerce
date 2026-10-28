// supabase/functions/order-status/index.ts
// Edge Function: API para comprobar y consultar el estado de un pedido (Order Tracking).
// Permite consultar por número de orden (order_number), ID o token de invitado.
// Devuelve el estado actual con colores, descripción, línea de tiempo (stepper),
// información de la guía de envío (carrier / tracking) y resumen de productos.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const DEFAULT_STATUS_CONFIG: Record<string, { label: string; description: string; color: string; step: number }> = {
  pending: {
    label: "Pendiente",
    description: "Pedido recibido. Esperando confirmación de pago.",
    color: "#F59E0B",
    step: 1,
  },
  confirmed: {
    label: "Confirmado",
    description: "Pago verificado exitosamente.",
    color: "#3B82F6",
    step: 2,
  },
  paid: {
    label: "Pagado",
    description: "Pago recibido. Tu orden pasará a preparación.",
    color: "#3B82F6",
    step: 2,
  },
  processing: {
    label: "En preparación",
    description: "Estamos empacando tus productos con el mayor cuidado.",
    color: "#8B5CF6",
    step: 3,
  },
  shipped: {
    label: "Enviado",
    description: "Tu pedido ya está en camino hacia la dirección de entrega.",
    color: "#06B6D4",
    step: 4,
  },
  delivered: {
    label: "Entregado",
    description: "¡Tu pedido fue entregado con éxito! Esperamos que lo disfrutes.",
    color: "#10B981",
    step: 5,
  },
  cancelled: {
    label: "Cancelado",
    description: "El pedido fue cancelado.",
    color: "#EF4444",
    step: 0,
  },
};

const ORDER_STEPS = [
  { key: "pending", label: "Pedido Recibido", step: 1 },
  { key: "confirmed", label: "Pago Confirmado", step: 2 },
  { key: "processing", label: "En Preparación", step: 3 },
  { key: "shipped", label: "En Camino", step: 4 },
  { key: "delivered", label: "Entregado", step: 5 },
];

function formatCurrency(amount: number): string {
  return "$" + Math.round(Number(amount || 0)).toLocaleString("es-CO");
}

function getSettingValue(settings: Array<{ key: string; value: any }> | null, key: string): string {
  const row = settings?.find((item) => item.key === key);
  if (row?.value === undefined || row.value === null) return "";
  if (typeof row.value !== "string") return String(row.value);
  try {
    const parsed = JSON.parse(row.value);
    return typeof parsed === "string" ? parsed : row.value;
  } catch {
    return row.value;
  }
}

serve(async (req) => {
  // Manejo de preflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extraer parámetros (soporta GET query params o POST JSON)
    let orderNumber: string | undefined;
    let orderId: string | undefined;
    let accessToken: string | undefined;
    let emailFilter: string | undefined;

    if (req.method === "POST") {
      try {
        const body = await req.json();
        orderNumber = body.order_number || body.orderNumber || body.order;
        orderId = body.order_id || body.orderId || body.id;
        accessToken = body.access_token || body.guest_access_token;
        emailFilter = body.email || body.guest_email;
      } catch {
        // body vacío
      }
    } else {
      const url = new URL(req.url);
      orderNumber = url.searchParams.get("order_number") || url.searchParams.get("order") || undefined;
      orderId = url.searchParams.get("order_id") || url.searchParams.get("id") || undefined;
      accessToken = url.searchParams.get("access_token") || undefined;
      emailFilter = url.searchParams.get("email") || undefined;
    }

    // Normalizar
    if (orderNumber) orderNumber = orderNumber.trim();
    if (orderId) orderId = orderId.trim();
    if (accessToken) accessToken = accessToken.trim();
    if (emailFilter) emailFilter = emailFilter.trim().toLowerCase();

    // 1. Validar que al menos se envíe un identificador
    if (!orderNumber && !orderId && !accessToken) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "missing_parameter",
          message: "Debes proporcionar el número de pedido (ej: 'order_number': 'ORD-2026-000001'), el ID o el token de acceso.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Construir la consulta del pedido
    let query = supabase
      .from("orders")
      .select(`
        id,
        user_id,
        order_number,
        status,
        subtotal,
        shipping_cost,
        discount,
        total,
        notes,
        shipping_address,
        shipping_address_id,
        coupon_id,
        paid_at,
        cancelled_at,
        cancellation_reason,
        guest_name,
        guest_email,
        guest_phone,
        guest_access_token,
        created_at,
        updated_at,
        order_statuses ( code, name, description, color, sort_order ),
        shipments ( id, carrier, carrier_code, tracking_number, status, estimated_delivery, shipped_at, delivered_at, notes ),
        order_items ( id, product_id, variant_id, product_name, product_sku, variant_name, quantity, unit_price, subtotal )
      `);

    if (orderNumber) {
      query = query.ilike("order_number", orderNumber);
    } else if (orderId) {
      query = query.eq("id", orderId);
    } else if (accessToken) {
      query = query.eq("guest_access_token", accessToken);
    }

    const { data: order, error } = await query.maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    // 3. Si no se encontró el pedido
    if (!order) {
      return new Response(
        JSON.stringify({
          success: false,
          found: false,
          error: "order_not_found",
          message: `No se encontró ningún pedido con la información proporcionada (${orderNumber || orderId || accessToken}).`,
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Validación de seguridad opcional si el cliente envió su email
    if (emailFilter) {
      let orderCustomerEmail = (order.guest_email || "").toLowerCase();

      // Si el pedido es de un usuario registrado, buscar el correo del perfil
      if (!orderCustomerEmail && order.user_id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("email")
          .eq("id", order.user_id)
          .maybeSingle();
        orderCustomerEmail = (profile?.email || "").toLowerCase();
      }

      if (orderCustomerEmail && orderCustomerEmail !== emailFilter) {
        return new Response(
          JSON.stringify({
            success: false,
            found: true,
            error: "email_mismatch",
            message: "El correo electrónico ingresado no coincide con el registrado en este pedido.",
          }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // 5. Enriquecer items con imágenes principales
    const items = Array.isArray(order.order_items) ? order.order_items : [];
    const productIds = items.map((it: any) => it.product_id).filter(Boolean);

    let imagesMap = new Map<string, string>();
    if (productIds.length > 0) {
      const { data: images } = await supabase
        .from("product_images")
        .select("product_id, url, is_main, sort_order")
        .in("product_id", productIds)
        .order("is_main", { ascending: false });

      (images || []).forEach((img: any) => {
        if (!imagesMap.has(img.product_id)) {
          imagesMap.set(img.product_id, img.url);
        }
      });
    }

    // 6. Resolver dirección de entrega
    let shippingAddress = order.shipping_address;
    if (!shippingAddress && order.shipping_address_id) {
      const { data: addr } = await supabase
        .from("addresses")
        .select("*")
        .eq("id", order.shipping_address_id)
        .maybeSingle();
      shippingAddress = addr;
    }

    // 7. Configuración del estado y línea de tiempo (stepper)
    const statusCode = order.status || "pending";
    const statusMetaFromDb = order.order_statuses;
    const defaultMeta = DEFAULT_STATUS_CONFIG[statusCode] || {
      label: statusCode,
      description: "Estado en actualización",
      color: "#6B7280",
      step: 1,
    };

    const statusLabel = statusMetaFromDb?.name || defaultMeta.label;
    const statusDescription = statusMetaFromDb?.description || defaultMeta.description;
    const statusColor = statusMetaFromDb?.color || defaultMeta.color;
    const currentStepNumber = defaultMeta.step;
    const isCancelled = statusCode === "cancelled";

    const timeline = isCancelled
      ? [
          { key: "pending", label: "Pedido Recibido", is_completed: true, is_current: false },
          { key: "cancelled", label: "Cancelado", is_completed: true, is_current: true },
        ]
      : ORDER_STEPS.map((s) => ({
          key: s.key,
          label: s.label,
          is_completed: currentStepNumber >= s.step,
          is_current: currentStepNumber === s.step,
        }));

    // 8. Información de despacho y transportadora
    const shipments = Array.isArray(order.shipments) ? order.shipments : [];
    const latestShipment = shipments[0] || null;

    // 9. Instrucciones bancarias si sigue pendiente
    let paymentInstructions: any = null;
    if (statusCode === "pending") {
      const { data: settingsData } = await supabase
        .from("settings")
        .select("key, value")
        .in("key", ["banco_consignar", "numero_cuenta_bancaria"]);

      const bankName = getSettingValue(settingsData, "banco_consignar");
      const bankAccount = getSettingValue(settingsData, "numero_cuenta_bancaria");

      if (bankName && bankAccount) {
        paymentInstructions = {
          bank_name: bankName,
          account_number: bankAccount,
          instructions: `Consigna el total (${formatCurrency(order.total)}) a ${bankName} cuenta No. ${bankAccount} con la referencia '${order.order_number}'.`,
        };
      }
    }

    // 10. Respuesta final estructurada
    const subtotal = Number(order.subtotal) || 0;
    const shippingCost = Number(order.shipping_cost) || 0;
    const discount = Number(order.discount) || 0;
    const total = Number(order.total) || 0;

    return new Response(
      JSON.stringify({
        success: true,
        found: true,
        order: {
          id: order.id,
          order_number: order.order_number,
          created_at: order.created_at,
          updated_at: order.updated_at,
          paid_at: order.paid_at || null,
          cancelled_at: order.cancelled_at || null,
          cancellation_reason: order.cancellation_reason || null,

          // Estado del pedido
          status: {
            code: statusCode,
            label: statusLabel,
            description: statusDescription,
            color: statusColor,
            is_cancelled: isCancelled,
            is_delivered: statusCode === "delivered",
          },

          // Stepper / Línea de tiempo para UI
          timeline: timeline,

          // Envío y transportadora
          shipment: latestShipment
            ? {
                carrier: latestShipment.carrier || "Por coordinar",
                tracking_number: latestShipment.tracking_number || null,
                status: latestShipment.status || "pending",
                estimated_delivery: latestShipment.estimated_delivery || null,
                shipped_at: latestShipment.shipped_at || null,
                delivered_at: latestShipment.delivered_at || null,
                notes: latestShipment.notes || null,
              }
            : null,

          // Datos del cliente
          customer: {
            name: order.guest_name || "Cliente",
            email: order.guest_email || null,
            phone: order.guest_phone || null,
          },

          // Dirección de entrega
          shipping_address: shippingAddress,

          // Resumen financiero
          financials: {
            subtotal,
            shipping_cost: shippingCost,
            discount,
            total,
            formatted_subtotal: formatCurrency(subtotal),
            formatted_shipping: shippingCost > 0 ? formatCurrency(shippingCost) : "Gratis / Por coordinar",
            formatted_discount: discount > 0 ? `-${formatCurrency(discount)}` : "$0",
            formatted_total: formatCurrency(total),
          },

          // Productos del pedido
          items: items.map((it: any) => ({
            id: it.id,
            product_id: it.product_id,
            product_name: it.product_name,
            product_sku: it.product_sku,
            variant_name: it.variant_name || null,
            quantity: Number(it.quantity) || 1,
            unit_price: Number(it.unit_price) || 0,
            subtotal: Number(it.subtotal) || 0,
            formatted_unit_price: formatCurrency(Number(it.unit_price)),
            formatted_subtotal: formatCurrency(Number(it.subtotal)),
            image_url: imagesMap.get(it.product_id) || null,
          })),

          // Instrucciones de pago (si aplica)
          payment_instructions: paymentInstructions,

          // Notas del pedido
          notes: order.notes || null,
        },
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err: any) {
    console.error("order-status error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: "internal_error",
        message: err.message || "Error al consultar el estado del pedido.",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});

