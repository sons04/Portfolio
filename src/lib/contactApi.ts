const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "";

export async function submitContactForm(payload: {
  name: string;
  email: string;
  brief: string;
}) {
  const response = await fetch(`${apiBaseUrl}/api/contact`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => null)) as
    | { message?: string }
    | null;

  if (!response.ok) {
    throw new Error(data?.message ?? "Unable to send your message right now.");
  }

  return data?.message ?? "Thanks, your message has been sent.";
}
