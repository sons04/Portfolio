import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import {
  getMailConfig,
  sendContactEmail,
  validateContactPayload,
} from "./contactService.js";

const port = Number(process.env.PORT || 3001);
const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "../dist");
const hasBuiltClient = fs.existsSync(path.join(distDir, "index.html"));

try {
  getMailConfig();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/contact", async (req, res) => {
  const parsed = validateContactPayload(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: "Please provide a valid name, email, and project brief.",
    });
  }

  try {
    await sendContactEmail(parsed.data);
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

app.listen(port, () => {
  console.log(`Contact API listening on http://localhost:${port}`);
});
