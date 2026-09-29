// supabase/functions/send-order-email/index.ts
// Envía el correo de confirmación / proforma al crear un pedido (invitado o registrado).
// Invocada desde el checkout con supabase.functions.invoke("send-order-email").
// Secrets: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM_NAME (opcional), SITE_URL.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.13";

const BRAND_RED = "#C8102E";
const BRAND_NAME = "Amelatte";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  paid: "Pagado",
  processing: "En preparación",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
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
}

const money = (v: number) =>
  "$" + Math.round(Number(v || 0)).toLocaleString("es-CO");

function getTemplate(
  p: OrderEmailPayload,
  logoUrl: string,
  opts?: { heading?: string; intro?: string; subject?: string }
) {
  const heading = opts?.heading || `¡Gracias por tu compra${p.customerName ? `, ${p.customerName}` : ""}!`;
  const intro = opts?.intro || "quedó registrado. Te contactaremos para coordinar el pago y el envío.";
  const itemsRows = p.items
    .map(
      (it) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #ececea;font-size:13px;color:#1d1d1f;">
          ${it.product_name}${it.variant_name ? ` <span style="color:#8e8e93;">(${it.variant_name})</span>` : ""}
          <div style="font-size:12px;color:#8e8e93;">Cantidad: ${it.quantity}</div>
        </td>
        <td align="right" style="padding:10px 0;border-bottom:1px solid #ececea;font-size:13px;font-weight:700;color:#1d1d1f;white-space:nowrap;">
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
</head>
<body style="margin:0;padding:0;background:#f7f5f1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" style="padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.08);">
          <tr>
            <td style="padding:36px 24px 8px 24px;text-align:center;">
              <img src="${logoUrl}" alt="${BRAND_NAME}" style="max-width:132px;margin-bottom:20px;" />
              <div style="width:56px;height:6px;background:${BRAND_RED};border-radius:999px;margin:0 auto;"></div>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 36px 8px 36px;text-align:center;">
              <h1 style="margin:0 0 8px 0;font-size:24px;font-weight:800;color:#1d1d1f;">
                ${heading}
              </h1>
              <p style="margin:0;font-size:14px;color:#6e6e73;line-height:1.6;">
                Tu pedido <strong style="color:#1d1d1f;">${p.orderNumber}</strong> ${intro}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 36px 8px 36px;">
              <table width="100%" style="border-collapse:collapse;">
                ${itemsRows}
              </table>
              <table width="100%" style="margin-top:12px;">
                <tr><td style="font-size:13px;color:#6e6e73;">Subtotal</td><td align="right" style="font-size:13px;font-weight:700;">${money(p.subtotal)}</td></tr>
                ${(p.discount || 0) > 0 ? `<tr><td style="font-size:13px;color:#047857;">Descuento</td><td align="right" style="font-size:13px;font-weight:700;color:#047857;">-${money(p.discount || 0)}</td></tr>` : ""}
                <tr><td style="font-size:13px;color:#6e6e73;">Envío</td><td align="right" style="font-size:13px;">${(p.shipping || 0) > 0 ? money(p.shipping || 0) : "Por calcular"}</td></tr>
                <tr><td style="font-size:15px;font-weight:800;padding-top:8px;">Total</td><td align="right" style="font-size:15px;font-weight:800;padding-top:8px;color:${BRAND_RED};">${money(p.total)}</td></tr>
              </table>
            </td>
          </tr>
          ${
            addressLine
              ? `<tr><td style="padding:12px 36px 0 36px;font-size:13px;color:#6e6e73;">Envío a: <strong style="color:#1d1d1f;">${addressLine}</strong></td></tr>`
              : ""
          }
          ${
            p.bankName || p.bankAccount
              ? `<tr><td style="padding:12px 36px 0 36px;font-size:13px;color:#6e6e73;">Consignar a: <strong style="color:#1d1d1f;">${p.bankName || ""} ${p.bankAccount || ""}</strong></td></tr>`
              : ""
          }
          <tr>
            <td style="padding:24px 36px 32px 36px;text-align:center;">
              <a href="${p.orderUrl || ""}"
                 style="display:${p.orderUrl ? "inline-block" : "none"};background:${BRAND_RED};color:#ffffff;
                        padding:14px 40px;border-radius:999px;text-decoration:none;
                        font-size:14px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;
                        box-shadow:0 8px 20px rgba(200,16,46,0.35);">
                Ver mi pedido
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:20px;text-align:center;font-size:11px;color:#8e8e93;">
              © ${new Date().getFullYear()} ${BRAND_NAME} — Un gusto que late. Todos los derechos reservados.
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

async function getCustomerEmail(userId: string | null): Promise<string | null> {
  if (!userId) return null;
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const { data } = await supabase.auth.admin.getUserById(userId);
  return data?.user?.email || null;
}

async function sendStatusEmail({
  to,
  customerName,
  orderNumber,
  status,
}: {
  to: string;
  customerName?: string;
  orderNumber: string;
  status: string;
}) {
  const { siteURL, smtpUser, fromName, transporter } = getSmtp();
  const label = STATUS_LABELS[status] || status;

  await transporter.sendMail({
    from: `"${fromName}" <${smtpUser}>`,
    to,
    subject: `Tu pedido ${orderNumber} cambió a: ${label}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f7f5f1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.08);">
        <tr><td style="padding:36px 24px 8px 24px;text-align:center;">
          <img src="${siteURL}/logoamelattecuadrado.png" alt="${BRAND_NAME}" style="max-width:132px;margin-bottom:20px;" />
          <div style="width:56px;height:6px;background:${BRAND_RED};border-radius:999px;margin:0 auto;"></div>
        </td></tr>
        <tr><td style="padding:20px 36px 32px 36px;text-align:center;">
          <h1 style="margin:0 0 12px 0;font-size:22px;font-weight:800;color:#1d1d1f;">Tu pedido cambió de estado</h1>
          <p style="margin:0 0 20px 0;font-size:15px;color:#6e6e73;line-height:1.6;">
            Hola${customerName ? ` ${customerName}` : ""}, tu pedido <strong style="color:#1d1d1f;">${orderNumber}</strong> ahora está:
          </p>
          <span style="display:inline-block;background:${BRAND_RED};color:#ffffff;padding:12px 36px;border-radius:999px;font-size:14px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">
            ${label}
          </span>
          <p style="margin:20px 0 0 0;font-size:13px;color:#8e8e93;">Te avisaremos de cada novedad de tu pedido.</p>
        </td></tr>
        <tr><td style="padding:20px;text-align:center;font-size:11px;color:#8e8e93;">
          © ${new Date().getFullYear()} ${BRAND_NAME} — Un gusto que late. Todos los derechos reservados.
        </td></tr>
      </table>
    </td></tr>
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

    // --- MODO 2: webhook de BD (UPDATE en orders) → avisa cambio de estado ---
    // Solo se notifica al confirmar o entregar el pedido.
    if (body?.table === "orders" && body?.type === "UPDATE") {
      const record = body.record || {};
      const oldRecord = body.old_record || {};
      if (record.status === oldRecord.status) {
        return new Response(JSON.stringify({ success: true, skipped: "status unchanged" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (record.status !== "confirmed" && record.status !== "delivered") {
        return new Response(JSON.stringify({ success: true, skipped: "status not notifiable" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      const to = record.guest_email || (await getCustomerEmail(record.user_id));
      if (!to) throw new Error("Customer email not found");
      await sendStatusEmail({
        to,
        customerName: record.guest_name || undefined,
        orderNumber: record.order_number,
        status: record.status,
      });
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // --- MODO 3: pedido editado por el admin → avisa actualización ---
    if (body?.mode === "order-updated" && body?.orderId) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      const { data: order } = await supabase
        .from("orders")
        .select("*")
        .eq("id", body.orderId)
        .single();
      if (!order) throw new Error("Order not found");

      const { data: orderItems } = await supabase
        .from("order_items")
        .select("product_name, variant_name, quantity, unit_price, subtotal")
        .eq("order_id", body.orderId)
        .order("created_at");

      const to = order.guest_email || (await getCustomerEmail(order.user_id));
      if (!to) throw new Error("Customer email not found");

      const { siteURL, smtpUser, fromName, transporter } = getSmtp();
      await transporter.sendMail({
        from: `"${fromName}" <${smtpUser}>`,
        to,
        subject: `Tu pedido ${order.order_number} fue actualizado`,
        html: getTemplate(
          {
            to,
            customerName: order.guest_name || undefined,
            orderNumber: order.order_number,
            subtotal: Number(order.subtotal) || 0,
            shipping: Number(order.shipping_cost) || 0,
            discount: Number(order.discount) || 0,
            total: Number(order.total) || 0,
            items: (orderItems || []).map((it: Record<string, unknown>) => ({
              product_name: String(it.product_name || ""),
              variant_name: (it.variant_name as string) || null,
              quantity: Number(it.quantity) || 0,
              unit_price: Number(it.unit_price) || 0,
              subtotal: Number(it.subtotal) || 0,
            })),
          },
          `${siteURL}/logoamelattecuadrado.png`,
          {
            heading: "Tu pedido fue actualizado",
            intro: "fue modificado por nuestro equipo. Este es el nuevo detalle de tu pedido.",
          }
        ),
      });
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // --- MODO 4: admin cambió el estado → avisa solo confirmado/entregado ---
    if (body?.mode === "status-changed" && body?.orderId) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      const { data: order } = await supabase
        .from("orders")
        .select("order_number, status, user_id, guest_name, guest_email")
        .eq("id", body.orderId)
        .single();
      if (!order) throw new Error("Order not found");
      if (order.status !== "confirmed" && order.status !== "delivered") {
        return new Response(JSON.stringify({ success: true, skipped: "status not notifiable" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      const to = order.guest_email || (await getCustomerEmail(order.user_id));
      if (!to) throw new Error("Customer email not found");
      await sendStatusEmail({
        to,
        customerName: order.guest_name || undefined,
        orderNumber: order.order_number,
        status: order.status,
      });
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // --- MODO 1: confirmación de pedido nuevo (invocado desde el checkout) ---
    const p = body as OrderEmailPayload & { orderUrl?: string };
    if (!p.to || !p.orderNumber || !Array.isArray(p.items)) {
      throw new Error("Missing to / orderNumber / items");
    }

    const { siteURL: siteUrl, smtpUser: user, fromName: from, transporter: mailer } = getSmtp();

    await mailer.sendMail({
      from: `"${from}" <${user}>`,
      to: p.to,
      subject: `Tu pedido ${p.orderNumber} en Amelatte está confirmado`,
      html: getTemplate(p, `${siteUrl}/logoamelattecuadrado.png`),
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-order-email error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : "Error" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
});
