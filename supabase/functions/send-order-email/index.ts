// supabase/functions/send-order-email/index.ts
// Envía el correo de confirmación de pedido y notificaciones de cambio de estado para PARTEX.
// Puede ser invocada desde el frontend con supabase.functions.invoke("send-order-email")
// o a través de un Database Webhook en la tabla "orders".
// Secrets requeridos: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM_NAME (opcional), SITE_URL,
// SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.13";

const BRAND_NAME = "PARTEX";
const BRAND_TAGLINE = "Professional parts & components";
const BRAND_COLOR = "#111827";

const STATUS_META: Record<string, { label: string; color: string; message: string }> = {
  pending: {
    label: "Pendiente",
    color: "#F59E0B",
    message: "Tu pedido quedó registrado. Nuestro equipo se contactará para coordinar el pago y el despacho.",
  },
  confirmed: {
    label: "Confirmado",
    color: "#3B82F6",
    message: "Tu pedido ha sido confirmado. Estamos alistando los repuestos y componentes para su despacho.",
  },
  processing: {
    label: "En preparación",
    color: "#8B5CF6",
    message: "Tu pedido está siendo preparado y verificado en nuestro centro logístico.",
  },
  shipped: {
    label: "Enviado",
    color: "#06B6D4",
    message: "Tu pedido ha sido despachado y ya va en camino a tu dirección.",
  },
  delivered: {
    label: "Entregado",
    color: "#10B981",
    message: "Tu pedido ha sido entregado exitosamente. ¡Gracias por confiar en PARTEX!",
  },
  cancelled: {
    label: "Cancelado",
    color: "#EF4444",
    message: "Tu pedido ha sido cancelado. Si tienes alguna pregunta, por favor contáctanos.",
  },
};

interface OrderItem {
  product_name: string;
  variant_name?: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface OrderEmailPayload {
  to: string;
  customerName?: string | null;
  orderNumber: string;
  createdAt?: string | null;
  status?: string | null;
  subtotal: number;
  shipping?: number;
  discount?: number;
  total: number;
  items: OrderItem[];
  address?: string | null;
  city?: string | null;
  state?: string | null;
  bankName?: string | null;
  bankAccount?: string | null;
  orderUrl?: string | null;
}

const money = (v: number) =>
  "$" + Math.round(Number(v || 0)).toLocaleString("es-CO");

function getTemplate(
  p: OrderEmailPayload,
  logoUrl: string,
  opts?: { heading?: string; intro?: string }
) {
  const heading = opts?.heading || `¡Gracias por tu compra${p.customerName ? `, ${p.customerName}` : ""}!`;
  const intro = opts?.intro || "quedó registrado exitosamente. Te contactaremos para coordinar el pago y el despacho.";

  const itemsRows = (p.items || [])
    .map(
      (it) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#111827;">
          <strong style="display:block;margin-bottom:2px;">${it.product_name}</strong>
          ${it.variant_name ? `<span style="display:inline-block;color:#6b7280;font-size:12px;margin-bottom:2px;">Variante: ${it.variant_name}</span><br/>` : ""}
          <span style="font-size:12px;color:#6b7280;">Cantidad: ${it.quantity} × ${money(it.unit_price)}</span>
        </td>
        <td align="right" style="padding:12px 0;border-bottom:1px solid #f3f4f6;font-size:13px;font-weight:700;color:#111827;white-space:nowrap;vertical-align:top;">
          ${money(it.subtotal)}
        </td>
      </tr>`
    )
    .join("");

  const addressLine = [p.address, p.city, p.state].filter(Boolean).join(", ");

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${heading}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" style="padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.06);border:1px solid #e5e7eb;">
          <!-- HEADER -->
          <tr>
            <td style="padding:36px 24px 12px 24px;text-align:center;">
              <img src="${logoUrl}" alt="${BRAND_NAME}" style="max-height:48px;max-width:180px;object-contain;margin-bottom:16px;" />
              <div style="width:48px;height:4px;background:${BRAND_COLOR};border-radius:999px;margin:0 auto;"></div>
            </td>
          </tr>

          <!-- INTRO -->
          <tr>
            <td style="padding:20px 36px 8px 36px;text-align:center;">
              <h1 style="margin:0 0 10px 0;font-size:23px;font-weight:800;color:#111827;letter-spacing:-0.02em;">
                ${heading}
              </h1>
              <p style="margin:0;font-size:14px;color:#4b5563;line-height:1.6;">
                Tu pedido <strong style="color:#111827;font-family:monospace;background:#f3f4f6;padding:2px 6px;border-radius:6px;">${p.orderNumber}</strong> ${intro}
              </p>
            </td>
          </tr>

          <!-- RESUMEN DE ARTÍCULOS -->
          <tr>
            <td style="padding:16px 36px 8px 36px;">
              <table width="100%" style="border-collapse:collapse;">
                ${itemsRows}
              </table>
              <table width="100%" style="margin-top:14px;border-collapse:collapse;">
                <tr>
                  <td style="font-size:13px;color:#6b7280;padding:4px 0;">Subtotal</td>
                  <td align="right" style="font-size:13px;font-weight:700;color:#111827;padding:4px 0;">${money(p.subtotal)}</td>
                </tr>
                ${(p.discount || 0) > 0 ? `
                <tr>
                  <td style="font-size:13px;color:#059669;padding:4px 0;">Descuento aplicado</td>
                  <td align="right" style="font-size:13px;font-weight:700;color:#059669;padding:4px 0;">-${money(p.discount || 0)}</td>
                </tr>` : ""}
                <tr>
                  <td style="font-size:13px;color:#6b7280;padding:4px 0;">Envío</td>
                  <td align="right" style="font-size:13px;color:#111827;padding:4px 0;">${(p.shipping || 0) > 0 ? money(p.shipping || 0) : "Por coordinar"}</td>
                </tr>
                <tr style="border-top:1px solid #e5e7eb;">
                  <td style="font-size:16px;font-weight:800;color:#111827;padding:12px 0 4px 0;">Total</td>
                  <td align="right" style="font-size:16px;font-weight:800;color:#111827;padding:12px 0 4px 0;">${money(p.total)}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- INFORMACIÓN ADICIONAL -->
          ${
            addressLine
              ? `<tr><td style="padding:14px 36px 0 36px;font-size:13px;color:#6b7280;line-height:1.5;">📍 <strong>Dirección de entrega:</strong> ${addressLine}</td></tr>`
              : ""
          }
          ${
            p.bankName || p.bankAccount
              ? `<tr><td style="padding:10px 36px 0 36px;font-size:13px;color:#6b7280;line-height:1.5;">🏦 <strong>Datos para consignación:</strong> ${p.bankName || ""} — ${p.bankAccount || ""}</td></tr>`
              : ""
          }

          <!-- BOTÓN DE ACCIÓN -->
          ${
            p.orderUrl
              ? `<tr>
                  <td style="padding:28px 36px 24px 36px;text-align:center;">
                    <a href="${p.orderUrl}"
                       style="display:inline-block;background:${BRAND_COLOR};color:#ffffff;
                              padding:14px 38px;border-radius:999px;text-decoration:none;
                              font-size:14px;font-weight:700;letter-spacing:0.04em;
                              box-shadow:0 6px 18px rgba(17,24,39,0.25);">
                      Ver detalle de mi pedido
                    </a>
                  </td>
                </tr>`
              : `<tr><td style="padding-bottom:20px;"></td></tr>`
          }

          <!-- FOOTER -->
          <tr>
            <td style="padding:24px 20px;text-align:center;font-size:11px;color:#9ca3af;background:#fafafa;border-top:1px solid #f3f4f6;">
              <p style="margin:0 0 4px 0;font-weight:600;color:#6b7280;">${BRAND_NAME} — ${BRAND_TAGLINE}</p>
              <p style="margin:0;">© ${new Date().getFullYear()} ${BRAND_NAME}. Todos los derechos reservados.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

function getSmtp() {
  const siteURL = (Deno.env.get("SITE_URL") || "").replace(/\/$/, "");
  if (!siteURL) throw new Error("Missing SITE_URL secret");

  const smtpHost = Deno.env.get("SMTP_HOST") || "smtp.gmail.com";
  const smtpPort = Number(Deno.env.get("SMTP_PORT") || "465");
  const smtpUser = Deno.env.get("SMTP_USER") || "";
  const smtpPass = Deno.env.get("SMTP_PASS") || "";
  const fromName = Deno.env.get("SMTP_FROM_NAME") || BRAND_NAME;
  if (!smtpUser || !smtpPass) throw new Error("Missing SMTP_USER / SMTP_PASS secrets");

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass },
  });

  return { siteURL, smtpUser, fromName, transporter };
}

async function getCustomerEmailAndName(supabase: any, order: any): Promise<{ email: string; name: string }> {
  let email = order.guest_email || order.shipping_address?.email || null;
  let name = order.guest_name || order.shipping_address?.full_name || "";

  if (!email && order.user_id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", order.user_id)
      .single();
    if (profile) {
      email = profile.email || null;
      if (!name) name = profile.full_name || "";
    }
  }

  if (!email && order.user_id) {
    const { data } = await supabase.auth.admin.getUserById(order.user_id);
    if (data?.user?.email) {
      email = data.user.email;
      if (!name) name = data.user.user_metadata?.full_name || "";
    }
  }

  return { email: email || "", name };
}

async function sendStatusEmail({
  to,
  customerName,
  orderNumber,
  status,
  orderUrl,
}: {
  to: string;
  customerName?: string;
  orderNumber: string;
  status: string;
  orderUrl?: string;
}) {
  const { siteURL, smtpUser, fromName, transporter } = getSmtp();
  const meta = STATUS_META[status] || {
    label: status,
    color: BRAND_COLOR,
    message: "El estado de tu pedido ha sido actualizado.",
  };

  await transporter.sendMail({
    from: `"${fromName}" <${smtpUser}>`,
    to,
    subject: `Tu pedido ${orderNumber} cambió a: ${meta.label} | ${BRAND_NAME}`,
    html: `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Tu pedido cambió de estado | ${BRAND_NAME}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" style="padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.06);border:1px solid #e5e7eb;">
          <!-- HEADER -->
          <tr>
            <td style="padding:36px 24px 12px 24px;text-align:center;">
              <img src="${siteURL}/LogoLetraNegra.png" alt="${BRAND_NAME}" style="max-height:48px;max-width:180px;object-contain;margin-bottom:16px;" />
              <div style="width:48px;height:4px;background:${BRAND_COLOR};border-radius:999px;margin:0 auto;"></div>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:20px 36px 32px 36px;text-align:center;">
              <h1 style="margin:0 0 12px 0;font-size:22px;font-weight:800;color:#111827;letter-spacing:-0.02em;">
                Actualización de tu pedido
              </h1>
              <p style="margin:0 0 20px 0;font-size:15px;color:#4b5563;line-height:1.6;">
                Hola${customerName ? ` <strong>${customerName}</strong>` : ""}, tu pedido <strong style="color:#111827;font-family:monospace;background:#f3f4f6;padding:2px 6px;border-radius:6px;">${orderNumber}</strong> ahora se encuentra en estado:
              </p>

              <!-- BADGE ESTADO -->
              <div style="margin:16px 0 24px 0;">
                <span style="display:inline-block;background:${meta.color};color:#ffffff;padding:12px 32px;border-radius:999px;font-size:14px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;box-shadow:0 4px 12px ${meta.color}40;">
                  ${meta.label}
                </span>
              </div>

              <p style="margin:0 0 24px 0;font-size:14px;color:#4b5563;line-height:1.6;">
                ${meta.message}
              </p>

              ${
                orderUrl
                  ? `<a href="${orderUrl}"
                        style="display:inline-block;background:#ffffff;color:#111827;
                               padding:12px 30px;border-radius:999px;text-decoration:none;
                               font-size:13px;font-weight:700;border:1px solid #d1d5db;">
                       Ver estado del pedido
                     </a>`
                  : ""
              }
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding:24px 20px;text-align:center;font-size:11px;color:#9ca3af;background:#fafafa;border-top:1px solid #f3f4f6;">
              <p style="margin:0 0 4px 0;font-weight:600;color:#6b7280;">${BRAND_NAME} — ${BRAND_TAGLINE}</p>
              <p style="margin:0;">© ${new Date().getFullYear()} ${BRAND_NAME}. Todos los derechos reservados.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  });
}

// 🚀 EDGE FUNCTION
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    if (req.method !== "POST") throw new Error("Method not allowed");

    const body = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    // --- MODO A: Webhook de base de datos (UPDATE en orders) ---
    if (body?.table === "orders" && body?.type === "UPDATE") {
      const record = body.record || {};
      const oldRecord = body.old_record || {};

      if (record.status === oldRecord.status) {
        return new Response(JSON.stringify({ success: true, skipped: "status unchanged" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (!supabaseUrl || !supabaseKey) {
        throw new Error("Missing Supabase credentials for webhook processing");
      }
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { email, name } = await getCustomerEmailAndName(supabase, record);
      if (!email) throw new Error("Customer email not found");

      const siteURL = (Deno.env.get("SITE_URL") || "").replace(/\/$/, "");
      const orderUrl = `${siteURL}/account/orders/${record.id}`;

      await sendStatusEmail({
        to: email,
        customerName: name || undefined,
        orderNumber: record.order_number,
        status: record.status,
        orderUrl,
      });

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // --- MODO B: Admin cambió el estado (invocado desde admin/orders/[id]) ---
    if (body?.mode === "status-changed" && body?.orderId) {
      if (!supabaseUrl || !supabaseKey) {
        throw new Error("Missing Supabase credentials");
      }
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: order } = await supabase
        .from("orders")
        .select("id, order_number, status, user_id, shipping_address")
        .eq("id", body.orderId)
        .single();

      if (!order) throw new Error("Order not found");

      const currentStatus = body.status || order.status;
      const { email, name } = await getCustomerEmailAndName(supabase, order);
      if (!email) throw new Error("Customer email not found");

      const siteURL = (Deno.env.get("SITE_URL") || "").replace(/\/$/, "");
      const orderUrl = `${siteURL}/account/orders/${order.id}`;

      await sendStatusEmail({
        to: email,
        customerName: name || undefined,
        orderNumber: order.order_number,
        status: currentStatus,
        orderUrl,
      });

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // --- MODO C: Pedido editado por el admin (invocado desde admin/orders/[id]/edit) ---
    if (body?.mode === "order-updated" && body?.orderId) {
      if (!supabaseUrl || !supabaseKey) {
        throw new Error("Missing Supabase credentials");
      }
      const supabase = createClient(supabaseUrl, supabaseKey);

      const [{ data: order }, { data: orderItems }, { data: settings }] = await Promise.all([
        supabase.from("orders").select("*").eq("id", body.orderId).single(),
        supabase.from("order_items").select("*").eq("order_id", body.orderId).order("created_at"),
        supabase.from("settings").select("key, value").in("key", ["banco_consignar", "numero_cuenta_bancaria"]),
      ]);

      if (!order) throw new Error("Order not found");

      const { email, name } = await getCustomerEmailAndName(supabase, order);
      if (!email) throw new Error("Customer email not found");

      const { siteURL, smtpUser, fromName, transporter } = getSmtp();
      const logoUrl = `${siteURL}/LogoLetraNegra.png`;
      const orderUrl = `${siteURL}/account/orders/${order.id}`;

      const getSettingVal = (items: any[], key: string) =>
        items?.find((s) => s.key === key)?.value || null;

      const addr = order.shipping_address || {};

      await transporter.sendMail({
        from: `"${fromName}" <${smtpUser}>`,
        to: email,
        subject: `Tu pedido ${order.order_number} fue actualizado | ${BRAND_NAME}`,
        html: getTemplate(
          {
            to: email,
            customerName: name || undefined,
            orderNumber: order.order_number,
            subtotal: Number(order.subtotal) || 0,
            shipping: Number(order.shipping_cost) || 0,
            discount: Number(order.discount) || 0,
            total: Number(order.total) || 0,
            items: (orderItems || []).map((it: any) => ({
              product_name: String(it.product_name || ""),
              variant_name: it.variant_name || null,
              quantity: Number(it.quantity) || 0,
              unit_price: Number(it.unit_price) || 0,
              subtotal: Number(it.subtotal) || 0,
            })),
            address: addr.address_line_1 || null,
            city: addr.city || null,
            state: addr.state || null,
            bankName: getSettingVal(settings || [], "banco_consignar"),
            bankAccount: getSettingVal(settings || [], "numero_cuenta_bancaria"),
            orderUrl,
          },
          logoUrl,
          {
            heading: "Tu pedido fue actualizado",
            intro: "ha sido modificado por nuestro equipo. Aquí tienes el nuevo resumen con los detalles actualizados:",
          }
        ),
      });

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // --- MODO D: Confirmación de nuevo pedido (invocado desde checkout) ---
    const p = body as OrderEmailPayload;
    if (!p.to || !p.orderNumber || !Array.isArray(p.items)) {
      throw new Error("Missing required payload fields: to, orderNumber, items");
    }

    const { siteURL, smtpUser, fromName, transporter } = getSmtp();
    const logoUrl = `${siteURL}/LogoLetraNegra.png`;

    await transporter.sendMail({
      from: `"${fromName}" <${smtpUser}>`,
      to: p.to,
      subject: `Confirmación de pedido ${p.orderNumber} | ${BRAND_NAME}`,
      html: getTemplate(p, logoUrl),
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-order-email error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
});
