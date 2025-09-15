// npm i firebase-functions firebase-admin @sendgrid/mail
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");
admin.initializeApp();

const { onRequest } = require("firebase-functions/v2/https");

const ALLOWED_ORIGINS = [
  "http://127.0.0.1:5500",
  "http://localhost:5500",
  // Agrega luego tu dominio productivo:
  // "https://comisiones.hondago.mx"
];

function corsOrigin(origin) {
  return ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.sendReport = onRequest(
  { cors: ALLOWED_ORIGINS }, // <-- maneja preflight y CORS
  async (req, res) => {
    // (opcional) reforzar CORS manualmente:
    const origin = corsOrigin(req.headers.origin || "");
    res.set("Access-Control-Allow-Origin", origin);
    res.set("Vary", "Origin");

    if (req.method === "OPTIONS") {
      // preflight
      res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
      res.set("Access-Control-Allow-Headers", "Content-Type");
      res.status(204).send("");
      return;
    }

    try {
      if (req.method !== "POST") {
        res.status(405).json({ error: "Use POST" });
        return;
      }

      const { to, filename, base64 } = req.body || {};
      if (!to || !filename || !base64) {
        res.status(400).json({ error: "payload inválido" });
        return;
      }

      await sgMail.send({
        to,
        from: "no-reply@tu-dominio.com", // cámbialo por tu remitente verificado
        subject: `Comisiones – ${new Date().toLocaleDateString("es-MX")}`,
        text: "Reporte de comisiones adjunto.",
        attachments: [
          {
            content: base64,
            filename,
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            disposition: "attachment",
          },
        ],
      });

      res.json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "sendgrid error" });
    }
  }
);
