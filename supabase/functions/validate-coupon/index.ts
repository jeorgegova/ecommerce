// supabase/functions/validate-coupon/index.ts
// Edge Function: API para verificar y validar códigos de descuento / cupones
// Devuelve el id, tipo ('percentage' | 'fixed'), valor y monto descontado.
// Si no es válido, inactivo o vencido, explica detalladamente el motivo.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

interface CouponRow {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number | string;
  min_order_amount?: number | string | null;
  max_uses?: number | null;
  max_uses_per_user?: number | null;
  is_active: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
  created_at: string;
}

function formatCurrency(amount: number): string {
  return "$" + Math.round(amount).toLocaleString("es-CO");
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("es-CO", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

serve(async (req) => {
  // Manejo de preflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Obtener parámetros (GET query o POST JSON)
    let rawCode: string | undefined;
    let rawSubtotal: number | string | undefined;
    let userId: string | undefined;
    let email: string | undefined;

    if (req.method === "POST") {
      try {
        const body = await req.json();
        rawCode = body.code || body.coupon_code || body.coupon;
        rawSubtotal = body.subtotal;
        userId = body.user_id || body.userId;
        email = body.email || body.guest_email;
      } catch {
        // body vacío o inválido
      }
    } else {
      const url = new URL(req.url);
      rawCode = url.searchParams.get("code") || url.searchParams.get("coupon_code") || undefined;
      rawSubtotal = url.searchParams.get("subtotal") || undefined;
      userId = url.searchParams.get("user_id") || undefined;
      email = url.searchParams.get("email") || undefined;
    }

    // 1. Validación de parámetro código
    if (!rawCode || typeof rawCode !== "string" || !rawCode.trim()) {
      return new Response(
        JSON.stringify({
          success: false,
          valid: false,
          reason: "code_required",
          message: "Debes proporcionar un código de descuento.",
          coupon: null,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const code = rawCode.trim().toUpperCase();
    const subtotal = rawSubtotal !== undefined && rawSubtotal !== null ? Number(rawSubtotal) : null;
    const now = new Date();

    // 2. Consulta en la base de datos
    const { data: coupon, error: qErr } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", code)
      .maybeSingle<CouponRow>();

    if (qErr) {
      throw new Error(qErr.message);
    }

    // 3. Verificación de existencia
    if (!coupon) {
      return new Response(
        JSON.stringify({
          success: true,
          valid: false,
          reason: "not_found",
          message: `El cupón '${code}' no existe. Verifica el código e intenta nuevamente.`,
          coupon: null,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const couponValue = Number(coupon.value) || 0;
    const minOrder = coupon.min_order_amount ? Number(coupon.min_order_amount) : null;

    // Objeto básico de información del cupón
    const basicCouponInfo = {
      id: coupon.id,
      code: coupon.code,
      type: coupon.type,
      value: couponValue,
      formatted_value:
        coupon.type === "percentage" ? `${couponValue}%` : formatCurrency(couponValue),
      min_order_amount: minOrder,
    };

    // 4. Verificación de estado activo
    if (!coupon.is_active) {
      return new Response(
        JSON.stringify({
          success: true,
          valid: false,
          reason: "inactive",
          message: `El cupón '${coupon.code}' se encuentra actualmente inactivo o deshabilitado.`,
          coupon: basicCouponInfo,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Verificación de fecha de inicio (aún no vigente)
    if (coupon.starts_at) {
      const startsAt = new Date(coupon.starts_at);
      if (startsAt > now) {
        return new Response(
          JSON.stringify({
            success: true,
            valid: false,
            reason: "not_started",
            message: `El cupón '${coupon.code}' aún no está vigente. Será válido a partir del ${formatDate(coupon.starts_at)}.`,
            coupon: {
              ...basicCouponInfo,
              starts_at: coupon.starts_at,
            },
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // 6. Verificación de fecha de expiración (ya caducó)
    if (coupon.ends_at) {
      const endsAt = new Date(coupon.ends_at);
      if (endsAt < now) {
        return new Response(
          JSON.stringify({
            success: true,
            valid: false,
            reason: "expired",
            message: `El cupón '${coupon.code}' ya ha caducado (venció el ${formatDate(coupon.ends_at)}).`,
            coupon: {
              ...basicCouponInfo,
              ends_at: coupon.ends_at,
            },
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // 7. Verificación de límite global de usos (max_uses)
    if (coupon.max_uses && coupon.max_uses > 0) {
      const { count: totalUses, error: countErr } = await supabase
        .from("coupon_usage")
        .select("id", { count: "exact", head: true })
        .eq("coupon_id", coupon.id);

      if (!countErr && totalUses !== null && totalUses >= coupon.max_uses) {
        return new Response(
          JSON.stringify({
            success: true,
            valid: false,
            reason: "max_uses_reached",
            message: `El cupón '${coupon.code}' ha alcanzado el límite máximo global de usos permitidos (${coupon.max_uses}).`,
            coupon: basicCouponInfo,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // 8. Verificación de límite de usos por usuario (max_uses_per_user)
    if (coupon.max_uses_per_user && coupon.max_uses_per_user > 0 && userId) {
      const { count: userUses, error: userCountErr } = await supabase
        .from("coupon_usage")
        .select("id", { count: "exact", head: true })
        .eq("coupon_id", coupon.id)
        .eq("user_id", userId);

      if (!userCountErr && userUses !== null && userUses >= coupon.max_uses_per_user) {
        return new Response(
          JSON.stringify({
            success: true,
            valid: false,
            reason: "user_limit_reached",
            message: `Has alcanzado el límite máximo de usos permitido (${coupon.max_uses_per_user}) para este cupón.`,
            coupon: basicCouponInfo,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // 9. Verificación de monto mínimo de compra (min_order_amount)
    if (minOrder !== null && subtotal !== null && !isNaN(subtotal)) {
      if (subtotal < minOrder) {
        return new Response(
          JSON.stringify({
            success: true,
            valid: false,
            reason: "min_order_not_met",
            message: `El monto mínimo de compra para usar este cupón es de ${formatCurrency(minOrder)}. Tu subtotal actual es de ${formatCurrency(subtotal)}.`,
            coupon: basicCouponInfo,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // 10. ¡CUPÓN VÁLIDO! Cálculo de descuento estimado si viene subtotal
    let discountAmount: number | null = null;
    let totalWithDiscount: number | null = null;

    if (subtotal !== null && !isNaN(subtotal)) {
      if (coupon.type === "percentage") {
        discountAmount = Math.min(subtotal * (couponValue / 100), subtotal);
      } else {
        discountAmount = Math.min(couponValue, subtotal);
      }
      discountAmount = Math.round(discountAmount * 100) / 100;
      totalWithDiscount = Math.max(0, subtotal - discountAmount);
    }

    return new Response(
      JSON.stringify({
        success: true,
        valid: true,
        message: "Cupón válido y listo para aplicar.",
        coupon: {
          id: coupon.id,
          code: coupon.code,
          type: coupon.type, // 'percentage' o 'fixed'
          value: couponValue,
          formatted_value:
            coupon.type === "percentage" ? `${couponValue}%` : formatCurrency(couponValue),
          min_order_amount: minOrder,
          max_uses: coupon.max_uses,
          max_uses_per_user: coupon.max_uses_per_user,
          starts_at: coupon.starts_at,
          ends_at: coupon.ends_at,
          // Si el cliente envió el subtotal, incluimos el cálculo financiero exacto
          subtotal: subtotal !== null ? subtotal : null,
          discount_amount: discountAmount,
          formatted_discount: discountAmount !== null ? formatCurrency(discountAmount) : null,
          total_with_discount: totalWithDiscount,
          formatted_total: totalWithDiscount !== null ? formatCurrency(totalWithDiscount) : null,
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
    console.error("validate-coupon error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        valid: false,
        error: "internal_error",
        message: err.message || "Error al validar el cupón",
        coupon: null,
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

