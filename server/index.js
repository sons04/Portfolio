import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import nodemailer from "nodemailer";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3001),
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

const envResult = envSchema.safeParse(process.env);

if (!envResult.success) {
  console.error("Missing or invalid server environment variables.");
  console.error(envResult.error.flatten().fieldErrors);
  process.exit(1);
}

const config = envResult.data;
const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "../dist");
const hasBuiltClient = fs.existsSync(path.join(distDir, "index.html"));

const transporter = nodemailer.createTransport({
  host: config.SMTP_HOST,
  port: config.SMTP_PORT,
  secure: config.SMTP_SECURE,
  auth: {
    user: config.SMTP_USER,
    pass: config.SMTP_PASS,
  },
});

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/contact", async (req, res) => {
  const parsed = contactSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: "Please provide a valid name, email, and project brief.",
    });
  }

  const { name, email, brief } = parsed.data;

  try {
    await transporter.sendMail({
      from: config.CONTACT_FROM_EMAIL ?? config.SMTP_USER,
      to: config.CONTACT_TO_EMAIL,
      replyTo: email,
      subject: `Portfolio contact from ${name}`,
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        "",
        "Brief:",
        brief,
      ].join("\n"),
      html: `
        <h2>New portfolio contact</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Brief:</strong></p>
        <p>${escapeHtml(brief).replace(/\n/g, "<br />")}</p>
      `,
    });

    return res.status(200).json({
      message: "Thanks, your message has been sent.",
    });
  } catch (error) {
    console.error("Failed to send contact email.", error);
    return res.status(500).json({
      message: "Unable to send your message right now. Please try again later.",
    });
  }
});

if (hasBuiltClient) {
  app.use(express.static(distDir));

  app.get(/^\/(?!api).*/, (_req, res) => {
    res.sendFile(path.join(distDir, "index.html"));
  });
}

app.listen(config.PORT, () => {
  console.log(`Contact API listening on http://localhost:${config.PORT}`);
});

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
