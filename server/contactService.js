import nodemailer from "nodemailer";
import { z } from "zod";

const envSchema = z.object({
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().positive().default(465),
  SMTP_SECURE: z
    .string()
    .optional()
    .transform((value) => value !== "false"),
  SMTP_USER: z.string().min(1),
  SMTP_PASS: z.string().min(1),
  CONTACT_TO_EMAIL: z.string().email(),
  CONTACT_FROM_EMAIL: z.string().email().optional(),
});

const contactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(320),
  brief: z.string().trim().min(1).max(5000),
});

export function getMailConfig(env = process.env) {
  const result = envSchema.safeParse(env);

  if (!result.success) {
    const message = "Missing or invalid mail environment variables.";
    const details = result.error.flatten().fieldErrors;
    throw new Error(`${message} ${JSON.stringify(details)}`);
  }

  return result.data;
}

export function validateContactPayload(payload) {
  return contactSchema.safeParse(payload);
}

export async function sendContactEmail(payload, env = process.env) {
  const config = getMailConfig(env);
  const transporter = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: config.SMTP_SECURE,
    auth: {
      user: config.SMTP_USER,
      pass: config.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: config.CONTACT_FROM_EMAIL ?? config.SMTP_USER,
    to: config.CONTACT_TO_EMAIL,
    replyTo: payload.email,
    subject: `Portfolio contact from ${payload.name}`,
    text: [
      `Name: ${payload.name}`,
      `Email: ${payload.email}`,
      "",
      "Brief:",
      payload.brief,
    ].join("\n"),
    html: `
      <h2>New portfolio contact</h2>
      <p><strong>Name:</strong> ${escapeHtml(payload.name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(payload.email)}</p>
      <p><strong>Brief:</strong></p>
      <p>${escapeHtml(payload.brief).replace(/\n/g, "<br />")}</p>
    `,
  });
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
