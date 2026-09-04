import { SupabaseClient } from "@supabase/supabase-js";
import crypto from "crypto";

export interface Webhook {
  id: string;
  user_id: string;
  name: string;
  url: string;
  secret: string | null;
  events: string[];
  is_active: boolean;
  created_at: string;
}

export const WEBHOOK_EVENTS = [
  "task.created",
  "task.updated",
  "task.completed",
  "task.deleted",
  "project.created",
  "project.updated",
  "comment.created",
  "decision.created",
  "decision.voted",
  "member.joined",
] as const;

export async function fetchWebhooks(
  supabase: SupabaseClient
): Promise<Webhook[]> {
  const { data, error } = await supabase
    .from("webhooks")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data || []).map((r) => ({ ...r, events: r.events || [] }));
}

export async function createWebhook(
  supabase: SupabaseClient,
  input: { name: string; url: string; events: string[]; secret?: string }
): Promise<Webhook | null> {
  const { data: userData } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("webhooks")
    .insert({
      user_id: userData.user?.id,
      name: input.name,
      url: input.url,
      events: input.events,
      secret: input.secret || null,
    })
    .select("*")
    .single();
  if (error) return null;
  return { ...data, events: data.events || [] };
}

export async function updateWebhook(
  supabase: SupabaseClient,
  id: string,
  input: { name?: string; url?: string; events?: string[]; secret?: string | null }
): Promise<Webhook | null> {
  const { data, error } = await supabase
    .from("webhooks")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) return null;
  return { ...data, events: data.events || [] };
}

export async function deleteWebhook(
  supabase: SupabaseClient,
  id: string
): Promise<boolean> {
  const { error } = await supabase.from("webhooks").delete().eq("id", id);
  return !error;
}

export async function toggleWebhook(
  supabase: SupabaseClient,
  id: string,
  isActive: boolean
): Promise<boolean> {
  const { error } = await supabase
    .from("webhooks")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", id);
  return !error;
}

export async function fireWebhooks(
  supabase: SupabaseClient,
  event: string,
  payload: Record<string, unknown>
): Promise<void> {
  const { data: hooks } = await supabase
    .from("webhooks")
    .select("*")
    .eq("is_active", true)
    .contains("events", [event]);

  for (const hook of hooks || []) {
    try {
      const isSlack = hook.url.includes("hooks.slack.com");
      let body: string;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (isSlack) {
        const slackPayload = {
          text: `${event}: ${JSON.stringify(payload.title || payload.entity_name || "")}`,
          attachments: [{
            color: "#0064F0",
            title: event,
            fields: Object.entries(payload).map(([k, v]) => ({
              title: k,
              value: String(v),
              short: true,
            })),
          }],
        };
        body = JSON.stringify(slackPayload);
      } else {
        body = JSON.stringify({
          event,
          payload,
          timestamp: new Date().toISOString(),
        });
      }

      if (hook.secret) {
        const signature = crypto
          .createHmac("sha256", hook.secret)
          .update(body)
          .digest("hex");
        headers["X-Webhook-Signature"] = signature;
      }
      await fetch(hook.url, { method: "POST", headers, body });
    } catch (err) {
      console.error(`Webhook ${hook.id} failed:`, err);
    }
  }
}

export async function sendTestWebhook(
  supabase: SupabaseClient,
  webhook: Webhook
): Promise<boolean> {
  try {
    const isSlack = webhook.url.includes("hooks.slack.com");
    let body: string;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (isSlack) {
      const slackPayload = {
        text: "test.ping: This is a test webhook from NAVO HQ",
        attachments: [{
          color: "#0064F0",
          title: "test.ping",
          text: "This is a test webhook from NAVO HQ",
        }],
      };
      body = JSON.stringify(slackPayload);
    } else {
      body = JSON.stringify({
        event: "test.ping",
        payload: { message: "This is a test webhook from NAVO HQ" },
        timestamp: new Date().toISOString(),
      });
    }

    if (webhook.secret) {
      const signature = crypto
        .createHmac("sha256", webhook.secret)
        .update(body)
        .digest("hex");
      headers["X-Webhook-Signature"] = signature;
    }
    const res = await fetch(webhook.url, { method: "POST", headers, body });
    return res.ok;
  } catch {
    return false;
  }
}
