export async function sendSlackNotification(
  webhookUrl: string,
  message: string,
  details?: { title?: string; url?: string; color?: string }
): Promise<boolean> {
  const payload: Record<string, unknown> = {
    text: message,
    attachments: details ? [{
      color: details.color || "#0064F0",
      title: details.title,
      title_link: details.url,
      text: message,
    }] : undefined,
  };

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}
