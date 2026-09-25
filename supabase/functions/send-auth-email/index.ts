// supabase/functions/send-auth-email/index.ts
// Hook "Send Email" de Supabase Auth adaptado a Amelatte (marca única, sin organizaciones).
// Configurar en: Dashboard → Authentication → Hooks → Send Email → Enabled,
// apuntando a esta función. Requiere los secrets: SMTP_HOST, SMTP_PORT,
// SMTP_USER, SMTP_PASS, SMTP_FROM_NAME (opcional), SITE_URL.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import nodemailer from "npm:nodemailer@6.9.13";

const BRAND_RED = "#C8102E";
const BRAND_NAME = "Amelatte";

// 🎨 TEMPLATE AMELATTE
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
</head>
<body style="margin:0;padding:0;background:#f7f5f1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" style="padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.08);">
          <!-- HEADER -->
          <tr>
            <td style="padding:36px 24px 8px 24px;text-align:center;">
              <img src="${logoUrl}" alt="${BRAND_NAME}" style="max-width:132px;margin-bottom:20px;" />
              <div style="width:56px;height:6px;background:${BRAND_RED};border-radius:999px;margin:0 auto;"></div>
            </td>
          </tr>

          <!-- CONTENT -->
          <tr>
            <td style="padding:20px 36px 32px 36px;text-align:center;">
              <h1 style="margin:0 0 12px 0;font-size:24px;font-weight:800;color:#1d1d1f;">
                ${title}
              </h1>
              <p style="margin:0 0 28px 0;font-size:15px;color:#6e6e73;line-height:1.6;">
                ${message}
              </p>
              <a href="${url}"
                 style="display:inline-block;background:${BRAND_RED};color:#ffffff;
                        padding:14px 40px;border-radius:999px;
                        text-decoration:none;font-size:14px;font-weight:700;
                        letter-spacing:0.08em;text-transform:uppercase;
                        box-shadow:0 8px 20px rgba(200,16,46,0.35);">
                ${buttonText}
              </a>
            </td>
          </tr>

          <!-- DIVIDER -->
          <tr>
            <td style="padding:0 36px;">
              <div style="height:1px;background:#ececea;"></div>
            </td>
          </tr>

          <!-- LINK FALLBACK -->
          <tr>
            <td style="padding:22px 36px;text-align:center;">
              <p style="font-size:12px;color:#8e8e93;margin:0 0 8px 0;">
                Si el botón no funciona, copia este enlace en tu navegador:
              </p>
              <p style="font-size:12px;color:${BRAND_RED};word-break:break-all;margin:0;">
                ${url}
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
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

// ✉️ contenido por tipo de correo
function getContent(emailType: string) {
  switch (emailType) {
    case "recovery":
      return {
        subject: "Recupera tu contraseña en Amelatte",
        title: "Restablecer contraseña",
        message: "Recibimos una solicitud para cambiar tu contraseña. Haz clic en el botón y crea una nueva en segundos.",
        buttonText: "Restablecer contraseña",
      };
    case "signup":
      return {
        subject: "Confirma tu correo en Amelatte",
        title: "¡Bienvenido a Amelatte!",
        message: "Solo falta un paso: confirma tu correo para activar tu cuenta y disfrutar del mejor café.",
        buttonText: "Confirmar cuenta",
      };
    case "magiclink":
      return {
        subject: "Tu acceso a Amelatte",
        title: "Acceso rápido",
        message: "Usa este enlace para ingresar a tu cuenta sin contraseña.",
        buttonText: "Ingresar",
      };
    case "email_change":
      return {
        subject: "Confirma tu nuevo correo en Amelatte",
        title: "Cambio de correo",
        message: "Confirma tu nuevo correo electrónico para seguir usando tu cuenta.",
        buttonText: "Confirmar cambio",
      };
    case "invite":
      return {
        subject: "Te invitaron a Amelatte",
        title: "Tienes una invitación",
        message: "Te invitaron a crear una cuenta en Amelatte. Acéptala para empezar.",
        buttonText: "Aceptar invitación",
      };
    default:
      return {
        subject: "Notificación de Amelatte",
        title: "Notificación",
        message: "Tienes una notificación de tu cuenta Amelatte.",
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
    // 🔏 verifica la firma Standard Webhooks con el secreto del hook
    const hookSecretRaw = Deno.env.get("SEND_EMAIL_HOOK_SECRET") || "";
    const hookSecret = hookSecretRaw.replace("v1,whsec_", "");
    if (!hookSecret) throw new Error("Missing SEND_EMAIL_HOOK_SECRET secret");

    const rawBody = await req.text();
    const headers = Object.fromEntries(req.headers);
    const wh = new Webhook(hookSecret);
    wh.verify(rawBody, headers); // lanza error si la firma no es válida
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
    const logoUrl = `${siteURL}/logoamelattecuadrado.png`;

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
    console.error("send-auth-email hook error:", err);
    return new Response(JSON.stringify({ success: false }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
});
