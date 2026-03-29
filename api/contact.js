import {
  sendContactEmail,
  validateContactPayload,
} from "../server/contactService.js";

export const config = {
  runtime: "nodejs",
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method not allowed." });
  }

  let body;

  try {
    body = readBody(req.body);
  } catch {
    return res.status(400).json({
      message: "Please provide valid JSON in the request body.",
    });
  }

  const parsed = validateContactPayload(body);

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
}

function readBody(body) {
  if (!body) return null;
  if (typeof body === "string") return JSON.parse(body);
  if (Buffer.isBuffer(body)) return JSON.parse(body.toString("utf8"));
  return body;
}
