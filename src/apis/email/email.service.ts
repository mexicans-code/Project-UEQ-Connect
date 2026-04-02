import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// ─── Transporter Gmail ────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (dateStr: string | Date): string =>
    new Date(dateStr).toLocaleDateString('es-MX', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
    });

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface EventoEmail {
    titulo: string;
    descripcion?: string;
    fecha: string | Date; // 👈 SOLO UNA FECHA
    horaInicio: string;
    horaFin: string;
    destino: { nombre: string } | string;
    espacio?: { nombre: string; planta?: string } | string | null;
}

interface UsuarioEmail {
    nombre: string;
    email: string;
}

const getDestinoNombre = (d: EventoEmail['destino']): string =>
    typeof d === 'object' ? d.nombre : 'Campus UTEQ';

const getEspacioNombre = (e: EventoEmail['espacio']): string | null => {
    if (!e || typeof e === 'string') return null;
    return `${e.nombre}${e.planta ? ` · Planta ${e.planta}` : ''}`;
};

// ─── Correo de confirmación de registro ──────────────────────────────────────
export const sendConfirmationEmail = async (
    usuario: UsuarioEmail,
    evento: EventoEmail,
    token: string,
) => {
    const espacio = getEspacioNombre(evento.espacio);
    const destino = getDestinoNombre(evento.destino);
    const fecha = formatDate(evento.fecha); // 👈 SIMPLIFICADO

    const espacioRow = espacio ? `
              <tr>
                <td style="padding:8px 0;vertical-align:top;"></td>
                <td style="padding:8px 0 8px 12px;">
                  <span style="display:block;font-size:12px;color:#9AA0A6;text-transform:uppercase;">Espacio / Salón</span>
                  <span style="font-size:14px;font-weight:600;color:#202124;">${espacio}</span>
                </td>
              </tr>` : '';

    const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#F0F4F8;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F4F8;padding:32px 0;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:560px;">

      <tr>
        <td style="background:linear-gradient(135deg,#1A73E8 0%,#0D47A1 100%);padding:30px 36px;text-align:center;">
          <h1 style="margin:0;font-size:26px;color:#ffffff;">Mapa UTEQ</h1>
          <p style="margin:10px 0 0;font-size:14px;color:rgba(255,255,255,0.85);">Confirmación de registro</p>
        </td>
      </tr>

      <tr><td style="padding:32px 36px;">
        <h2 style="margin:0 0 6px;font-size:20px;color:#202124;">¡Registro confirmado!</h2>
        <p style="margin:0 0 24px;font-size:14px;color:#5F6368;">
          Hola <strong>${usuario.nombre}</strong>, tu lugar está reservado.
        </p>

        <div style="background:#EAF1FB;border-left:4px solid #1A73E8;padding:14px 18px;margin-bottom:24px;">
          <p style="margin:0;font-size:18px;font-weight:800;color:#1A73E8;">${evento.titulo}</p>
          ${evento.descripcion ? `<p style="margin:6px 0 0;font-size:13px;color:#5F6368;">${evento.descripcion}</p>` : ''}
        </div>

        <table width="100%" style="background:#F8FAFC;border-radius:12px;margin-bottom:24px;">
          <tr><td style="padding:20px;">
            <p style="font-size:11px;color:#9AA0A6;text-transform:uppercase;">Detalles</p>

            <p><strong>Fecha:</strong> ${fecha}</p>
            <p><strong>Horario:</strong> ${evento.horaInicio} – ${evento.horaFin}</p>
            <p><strong>Lugar:</strong> ${destino}</p>
            ${espacio ? `<p><strong>Espacio:</strong> ${espacio}</p>` : ''}

          </td></tr>
        </table>

        <div style="text-align:center;">
          <p style="font-size:12px;color:#9AA0A6;">Token:</p>
          <p style="font-family:monospace;background:#E8EDF2;padding:10px;border-radius:8px;">${token}</p>
        </div>

      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;

    await transporter.sendMail({
        from: `"UTEQ Connect" <${process.env.GMAIL_USER}>`,
        to: usuario.email,
        subject: `🎟️ Tu registro está confirmado: ${evento.titulo}`,
        html,
    });
};

export default transporter;