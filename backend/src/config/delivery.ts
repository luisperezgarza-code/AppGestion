import nodemailer from "nodemailer";

function isProduction() {
  return process.env.NODE_ENV === "production";
}

export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string,
) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env;
  if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASSWORD) {
    const port = Number(SMTP_PORT);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error("SMTP_PORT debe ser un puerto válido.");
    }
    const transport = nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: process.env.SMTP_SECURE === "true",
      auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
    });
    await transport.sendMail({
      from: process.env.SMTP_FROM ?? SMTP_USER,
      to: email,
      subject: "Recupera tu contraseña de AppGestion",
      text: `Usa este enlace para cambiar tu contraseña (válido por 1 hora): ${resetUrl}`,
      html: `<p>Usa este enlace para cambiar tu contraseña. Es válido por 1 hora.</p><p><a href="${resetUrl}">Restablecer contraseña</a></p>`,
    });
    return;
  }
  if (isProduction()) {
    throw new Error("Configura SMTP_HOST, SMTP_PORT, SMTP_USER y SMTP_PASSWORD para enviar correos.");
  }
  console.info(`Enlace de recuperación para ${email}: ${resetUrl}`);
}
