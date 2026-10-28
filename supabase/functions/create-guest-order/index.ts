// supabase/functions/create-guest-order/index.ts
// Edge Function: API para creación de compra/pedido sin registro (Guest Checkout).
// Solicita datos básicos del comprador, dirección y productos, valida stock y cupones,
// crea la orden en la base de datos, devuelve el detalle completo con instrucciones
// de pago bancario y dispara el correo de confirmación.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface OrderItemInput {
  product_id: string;
  variant_id?: string | null;
  quantity: number;
}

interface ShippingAddressInput {
  address_line_1: string;
  address_line_2?: string | null;
  city: string;
  state: string;
  postal_code?: string | null;
  country?: string | null;
}

interface GuestOrderPayload {
  // Datos del cliente (soporta formatos customer o guest_*)
  customer?: {
    name?: string;
    full_name?: string;
    email?: string;
    phone?: string;
  };
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
  fullName?: string;
  email?: string;
  phone?: string;

  // Dirección de envío (soporta shipping_address o campos planos)
  shipping_address?: ShippingAddressInput;
  address_line_1?: string;
  address_line_2?: string | null;
  address?: string;
  addressLine2?: string | null;
  city?: string;
  state?: string;
  postal_code?: string | null;
  postalCode?: string | null;
  country?: string | null;

  // Productos del pedido
  items: OrderItemInput[];

  // Descuento opcional
  coupon_code?: string | null;
  coupon_id?: string | null;

  // Notas opcionales y opciones
  notes?: string | null;
  send_email?: boolean;
}

interface CreatedGuestOrderRpcResult {
  order_id: string;
  order_number: string;
  access_token: string;
  created_at: string;
  status: string;
  subtotal: number;
  shipping_cost: number;
  discount: number;
  total: number;
  guest_name: string;
  guest_email: string;
  guest_phone: string | null;
  shipping_address: Record<string, any>;
  items: Array<{
    product_name: string;
    product_sku: string;
    variant_name?: string | null;
    quantity: number;
    unit_price: number;
    subtotal: number;
  }>;
}

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
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ success: false, error: "Method not allowed. Use POST." }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY")!;

    // Usamos el service_role_key para ejecutar el RPC sin asociar ningún auth.uid de usuario
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let body: GuestOrderPayload;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({
          success: false,
          error: "invalid_json",
          message: "El cuerpo de la petición debe ser un JSON válido.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- 1. EXTRACCIÓN Y NORMALIZACIÓN DE DATOS DEL CLIENTE ---
    const guestName = (
      body.customer?.full_name ||
      body.customer?.name ||
      body.guest_name ||
      body.fullName ||
      ""
    ).trim();

    const guestEmail = (
      body.customer?.email ||
      body.guest_email ||
      body.email ||
      ""
    ).trim().toLowerCase();

    const guestPhone = (
      body.customer?.phone ||
      body.guest_phone ||
      body.phone ||
      ""
    ).trim();

    if (!guestName) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "missing_name",
          message: "El nombre completo del comprador es obligatorio.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!guestEmail || !emailRegex.test(guestEmail)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "invalid_email",
          message: "Debes ingresar un correo electrónico válido para recibir la confirmación.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!guestPhone) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "missing_phone",
          message: "El número de teléfono o celular es obligatorio para coordinar la entrega.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- 2. EXTRACCIÓN Y VALIDACIÓN DE DIRECCIÓN DE ENVÍO ---
    const rawAddress = body.shipping_address || {};
    const addressLine1 = (
      rawAddress.address_line_1 ||
      body.address_line_1 ||
      body.address ||
      ""
    ).trim();

    const addressLine2 = (
      rawAddress.address_line_2 ||
      body.address_line_2 ||
      body.addressLine2 ||
      null
    );

    const city = (rawAddress.city || body.city || "").trim();
    const state = (rawAddress.state || body.state || "").trim();
    const postalCode = (
      rawAddress.postal_code ||
      body.postal_code ||
      body.postalCode ||
      ""
    ).trim();
    const country = (rawAddress.country || body.country || "CO").trim();

    if (!addressLine1 || !city || !state) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "missing_address",
          message: "Debes ingresar la dirección completa (dirección, ciudad y departamento).",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const shippingAddressPayload = {
      address_line_1: addressLine1,
      address_line_2: addressLine2,
      city: city,
      state: state,
      postal_code: postalCode || null,
      country: country,
    };

    // --- 3. VALIDACIÓN DE ITEMS / PRODUCTOS ---
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "empty_cart",
          message: "El carrito de compras no contiene productos.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sanitizedItems: Array<{ product_id: string; variant_id: string | null; quantity: number }> = [];
    for (let i = 0; i < body.items.length; i++) {
      const it = body.items[i];
      if (!it.product_id || typeof it.product_id !== "string") {
        return new Response(
          JSON.stringify({
            success: false,
            error: "invalid_item",
            message: `El item en la posición ${i + 1} no cuenta con un product_id válido.`,
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const qty = parseInt(String(it.quantity), 10);
      if (isNaN(qty) || qty < 1) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "invalid_quantity",
            message: `La cantidad para el producto ${it.product_id} debe ser mayor o igual a 1.`,
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      sanitizedItems.push({
        product_id: it.product_id.trim(),
        variant_id: it.variant_id && it.variant_id.trim() ? it.variant_id.trim() : null,
        quantity: qty,
      });
    }

    // --- 4. RESOLUCIÓN DE CUPÓN (POR CÓDIGO O ID) ---
    let couponId: string | null = body.coupon_id ? body.coupon_id.trim() : null;
    const couponCode = body.coupon_code ? body.coupon_code.trim().toUpperCase() : null;

    if (couponCode && !couponId) {
      const { data: couponFound, error: coupErr } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", couponCode)
        .maybeSingle();

      if (coupErr) {
        throw new Error(`Error al verificar cupón: ${coupErr.message}`);
      }

      if (!couponFound) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "invalid_coupon",
            message: `El cupón '${couponCode}' no existe.`,
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!couponFound.is_active) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "coupon_inactive",
            message: `El cupón '${couponCode}' no está activo.`,
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const now = new Date();
      if (couponFound.starts_at && new Date(couponFound.starts_at) > now) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "coupon_not_started",
            message: `El cupón '${couponCode}' aún no está vigente.`,
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (couponFound.ends_at && new Date(couponFound.ends_at) < now) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "coupon_expired",
            message: `El cupón '${couponCode}' ha caducado.`,
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      couponId = couponFound.id;
    }

    // --- 5. CREACIÓN DEL PEDIDO EN BASE DE DATOS (VIA RPC create_guest_order) ---
    const { data: rpcResult, error: rpcError } = await supabase.rpc("create_guest_order", {
      p_items: sanitizedItems,
      p_guest_name: guestName,
      p_guest_email: guestEmail,
      p_guest_phone: guestPhone,
      p_shipping_address: shippingAddressPayload,
      p_coupon_id: couponId,
    });

    if (rpcError) {
      console.error("create_guest_order RPC error:", rpcError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "order_creation_failed",
          message: rpcError.message || "No se pudo crear la compra. Verifica el stock de los productos.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const orderData = rpcResult as unknown as CreatedGuestOrderRpcResult;

    // --- 6. GUARDAR NOTAS ADICIONALES (SI VIENEN) ---
    if (body.notes && body.notes.trim()) {
      await supabase
        .from("orders")
        .update({ notes: body.notes.trim() })
        .eq("id", orderData.order_id);
    }

    // --- 7. CONSULTAR CONFIGURACIÓN BANCARIA DE LA TIENDA ---
    const { data: settingsData } = await supabase
      .from("settings")
      .select("key, value")
      .in("key", ["banco_consignar", "numero_cuenta_bancaria", "tipo_cuenta_bancaria", "titular_cuenta_bancaria"]);

    const bankName = getSettingValue(settingsData, "banco_consignar");
    const bankAccount = getSettingValue(settingsData, "numero_cuenta_bancaria");

    // --- 8. DISPARO DEL CORREO DE CONFIRMACIÓN (send-order-email) ---
    const shouldSendEmail = body.send_email !== false;
    if (shouldSendEmail && orderData.guest_email) {
      try {
        const emailPayload = {
          to: orderData.guest_email,
          customerName: orderData.guest_name,
          orderNumber: orderData.order_number,
          createdAt: orderData.created_at,
          status: orderData.status,
          subtotal: Number(orderData.subtotal) || 0,
          shipping: Number(orderData.shipping_cost) || 0,
          discount: Number(orderData.discount) || 0,
          total: Number(orderData.total) || 0,
          items: (orderData.items || []).map((it) => ({
            product_name: it.product_name,
            variant_name: it.variant_name || null,
            quantity: Number(it.quantity) || 1,
            unit_price: Number(it.unit_price) || 0,
            subtotal: Number(it.subtotal) || 0,
          })),
          address: shippingAddressPayload.address_line_1,
          city: shippingAddressPayload.city,
          state: shippingAddressPayload.state,
          bankName: bankName || null,
          bankAccount: bankAccount || null,
        };

        // Disparar la Edge Function existente send-order-email de forma asíncrona
        supabase.functions.invoke("send-order-email", { body: emailPayload }).catch((err) => {
          console.warn("Error en send-order-email:", err);
        });
      } catch (mailErr) {
        console.warn("No se pudo iniciar el envío de correo de confirmación:", mailErr);
      }
    }

    // --- 9. RESPUESTA EXITOSA ---
    const subtotal = Number(orderData.subtotal) || 0;
    const shippingCost = Number(orderData.shipping_cost) || 0;
    const discount = Number(orderData.discount) || 0;
    const total = Number(orderData.total) || 0;

    return new Response(
      JSON.stringify({
        success: true,
        message: "¡Pedido creado exitosamente!",
        order: {
          id: orderData.order_id,
          order_number: orderData.order_number,
          access_token: orderData.access_token,
          status: orderData.status,
          status_label: "Pendiente",
          financials: {
            subtotal,
            shipping_cost: shippingCost,
            discount,
            total,
            formatted_subtotal: formatCurrency(subtotal),
            formatted_shipping: shippingCost > 0 ? formatCurrency(shippingCost) : "Por coordinar / Gratis",
            formatted_discount: discount > 0 ? `-${formatCurrency(discount)}` : "$0",
            formatted_total: formatCurrency(total),
          },
          customer: {
            name: orderData.guest_name,
            email: orderData.guest_email,
            phone: orderData.guest_phone,
          },
          shipping_address: orderData.shipping_address,
          items: (orderData.items || []).map((it) => ({
            product_name: it.product_name,
            product_sku: it.product_sku,
            variant_name: it.variant_name || null,
            quantity: Number(it.quantity),
            unit_price: Number(it.unit_price),
            subtotal: Number(it.subtotal),
            formatted_unit_price: formatCurrency(Number(it.unit_price)),
            formatted_subtotal: formatCurrency(Number(it.subtotal)),
          })),
          payment_instructions: {
            payment_method: "Transferencia / Consignación",
            bank_name: bankName || null,
            bank_account: bankAccount || null,
            instructions: bankName && bankAccount
              ? `Realiza la transferencia o consignación del total (${formatCurrency(total)}) a ${bankName} cuenta No. ${bankAccount} e indícanos tu número de pedido (${orderData.order_number}).`
              : "Nuestro equipo se comunicará contigo para coordinar el pago y el despacho.",
          },
          notes: body.notes?.trim() || null,
          created_at: orderData.created_at,
        },
      }),
      {
        status: 201,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err: any) {
    console.error("create-guest-order error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: "internal_error",
        message: err.message || "Ocurrió un error inesperado al procesar la compra.",
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

