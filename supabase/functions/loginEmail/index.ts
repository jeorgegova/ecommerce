// supabase/functions/loginEmail/index.ts
// Hook "Send Email" de Supabase Auth adaptado a PARTEX (marca única, sin organizaciones).
// Configurar en: Dashboard → Authentication → Hooks → Send Email → Enabled,
// apuntando a esta función (loginEmail). Requiere los secrets: SMTP_HOST, SMTP_PORT,
// SMTP_USER, SMTP_PASS, SMTP_FROM_NAME (opcional), SITE_URL, SEND_EMAIL_HOOK_SECRET.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import nodemailer from "npm:nodemailer@6.9.13";

const BRAND_NAME = "PARTEX";
const BRAND_TAGLINE = "Professional parts & components";
const BRAND_COLOR = "#111827"; // Dark industrial slate/black

// 🎨 TEMPLATE PARTEX
function getTemplate({
  title,
  message,
  buttonText,
  url,
  logoUrl,
}: {
  title: string;
  message: string;
  buttonText: string;
  url: string;
  logoUrl: string;
}) {
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${title} | ${BRAND_NAME}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" style="padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.06);border:1px solid #e5e7eb;">
          <!-- HEADER -->
          <tr>
            <td style="padding:36px 24px 12px 24px;text-align:center;">
              <img src="${logoUrl}" alt="${BRAND_NAME}" style="max-height:48px;max-width:180px;object-contain;margin-bottom:16px;" />
              <div style="width:48px;height:4px;background:${BRAND_COLOR};border-radius:999px;margin:0 auto;"></div>
            </td>
          </tr>

          <!-- CONTENT -->
          <tr>
            <td style="padding:20px 36px 32px 36px;text-align:center;">
              <h1 style="margin:0 0 12px 0;font-size:23px;font-weight:800;color:#111827;letter-spacing:-0.02em;">
                ${title}
              </h1>
              <p style="margin:0 0 28px 0;font-size:15px;color:#4b5563;line-height:1.6;">
                ${message}
              </p>
              <a href="${url}"
                 style="display:inline-block;background:${BRAND_COLOR};color:#ffffff;
                        padding:14px 38px;border-radius:999px;
                        text-decoration:none;font-size:14px;font-weight:700;
                        letter-spacing:0.04em;
                        box-shadow:0 6px 18px rgba(17,24,39,0.25);">
                ${buttonText}
              </a>
            </td>
          </tr>

          <!-- DIVIDER -->
          <tr>
            <td style="padding:0 36px;">
              <div style="height:1px;background:#f3f4f6;"></div>
            </td>
          </tr>

          <!-- LINK FALLBACK -->
          <tr>
            <td style="padding:22px 36px;text-align:center;">
              <p style="font-size:12px;color:#6b7280;margin:0 0 8px 0;">
                Si el botón no funciona, copia y pega este enlace en tu navegador:
              </p>
              <p style="font-size:12px;color:#2563eb;word-break:break-all;margin:0;">
                ${url}
              </p>
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
</html>
`;
}

// ✉️ Contenido por tipo de correo
function getContent(emailType: string) {
  switch (emailType) {
    case "recovery":
      return {
        subject: "Recupera tu contraseña en PARTEX",
        title: "Restablecer contraseña",
        message: "Recibimos una solicitud para restablecer la contraseña de tu cuenta. Haz clic en el botón para crear una nueva de forma segura.",
        buttonText: "Restablecer contraseña",
      };
    case "signup":
      return {
        subject: "Confirma tu cuenta en PARTEX",
        title: "¡Bienvenido a PARTEX!",
        message: "Solo falta un paso: confirma tu correo para activar tu cuenta y acceder a nuestro catálogo de repuestos y componentes.",
        buttonText: "Confirmar cuenta",
      };
    case "magiclink":
      return {
        subject: "Tu acceso rápido a PARTEX",
        title: "Acceso seguro",
        message: "Usa este enlace directo para ingresar a tu cuenta PARTEX sin necesidad de ingresar tu contraseña.",
        buttonText: "Ingresar a mi cuenta",
      };
    case "email_change":
      return {
        subject: "Confirma tu nuevo correo en PARTEX",
        title: "Cambio de correo electrónico",
        message: "Confirma tu nueva dirección de correo electrónico para seguir accediendo a tu cuenta PARTEX con normalidad.",
        buttonText: "Confirmar cambio",
      };
    case "invite":
      return {
        subject: "Te invitaron a PARTEX",
        title: "Tienes una invitación",
        message: "Has sido invitado a formar parte de PARTEX. Haz clic a continuación para aceptar la invitación y comenzar.",
        buttonText: "Aceptar invitación",
      };
    default:
      return {
        subject: "Notificación de PARTEX",
        title: "Notificación de tu cuenta",
        message: "Tienes una notificación importante sobre tu cuenta en PARTEX.",
        buttonText: "Ir a la tienda",
      };
  }
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
    // 🔏 Verifica la firma Standard Webhooks con el secreto del hook
    const hookSecretRaw = Deno.env.get("SEND_EMAIL_HOOK_SECRET") || "";
    const hookSecret = hookSecretRaw.replace("v1,whsec_", "");
    if (!hookSecret) throw new Error("Missing SEND_EMAIL_HOOK_SECRET secret");

    const rawBody = await req.text();
    const headers = Object.fromEntries(req.headers);
    const wh = new Webhook(hookSecret);
    wh.verify(rawBody, headers); // Lanza error si la firma no es válida

    const { email_data, user } = JSON.parse(rawBody) as {
      email_data: {
        email_action_type?: string;
        token_hash?: string;
      };
      user: { email?: string };
    };

    const emailType = email_data?.email_action_type || "";
    const tokenHash = email_data?.token_hash || "";
    const toEmail = user?.email || "";

    if (!toEmail) throw new Error("Missing recipient email");
    if (!tokenHash) throw new Error("Missing token_hash");

    const siteURL = (Deno.env.get("SITE_URL") || "").replace(/\/$/, "");
    if (!siteURL) throw new Error("Missing SITE_URL secret");

    const smtpHost = Deno.env.get("SMTP_HOST") || "smtp.gmail.com";
    const smtpPort = Number(Deno.env.get("SMTP_PORT") || "465");
    const smtpUser = Deno.env.get("SMTP_USER") || "";
    const smtpPass = Deno.env.get("SMTP_PASS") || "";
    const fromName = Deno.env.get("SMTP_FROM_NAME") || BRAND_NAME;
    if (!smtpUser || !smtpPass) throw new Error("Missing SMTP_USER / SMTP_PASS secrets");

    // ✅ URL única de verificación (verify-email redirige recovery → reset-password)
    const url = `${siteURL}/verify-email?token_hash=${tokenHash}&type=${emailType}`;
    const content = getContent(emailType);
    const logoUrl = `${siteURL}/LogoLetraNegra.png`;

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    });

    const html = getTemplate({
      title: content.title,
      message: content.message,
      buttonText: content.buttonText,
      url,
      logoUrl,
    });

    await transporter.sendMail({
      from: `"${fromName}" <${smtpUser}>`,
      to: toEmail,
      subject: content.subject,
      html,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("loginEmail hook error:", err);
    return new Response(JSON.stringify({ success: false, error: (err as Error).message }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
});
