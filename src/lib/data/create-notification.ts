import { SupabaseClient } from "@supabase/supabase-js";

interface CreateNotificationInput {
  supabase: SupabaseClient;
  userId: string;
  type: string;
  title: string;
  message?: string;
  entityType?: string;
  entityId?: string;
}

async function isNotificationTypeEnabled(
  supabase: SupabaseClient,
  userId: string,
  type: string
): Promise<boolean> {
  const typeMap: Record<string, string> = {
    task_assigned: "task_assigned",
    task_status_changed: "task_status_changed",
    task_commented: "task_commented",
    project_added: "project_added",
    decision_voted: "decision_voted",
    dependency_added: "dependency_added",
  };

  const field = typeMap[type];
  if (!field) return true;

  const { data } = await supabase
    .from("notification_preferences")
    .select(field)
    .eq("user_id", userId)
    .single();

  if (!data) return true;
  return Boolean(data[field]);
}

export async function createNotification({
  supabase,
  userId,
  type,
  title,
  message,
  entityType,
  entityId,
}: CreateNotificationInput): Promise<void> {
  try {
    const enabled = await isNotificationTypeEnabled(supabase, userId, type);
    if (!enabled) return;

    const { error } = await supabase.from("notifications").insert({
      user_id: userId,
      type,
      title,
      message: message || null,
      entity_type: entityType || null,
      entity_id: entityId || null,
      is_read: false,
    });
    if (error) {
      console.error("Error creating notification:", error);
      return;
    }

    // Trigger server-side push notification (fire-and-forget)
    const urlMap: Record<string, string> = {
      task: `/tasks?id=${entityId}`,
      project: `/projects/${entityId}`,
      decision: `/decisions?id=${entityId}`,
      document: `/documents?id=${entityId}`,
    };
    const pushUrl = entityType && entityId ? urlMap[entityType] || "/dashboard" : "/dashboard";

    fetch(`${typeof window !== "undefined" ? window.location.origin : ""}/api/push`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, title, body: message || "", url: pushUrl }),
    }).catch(() => {});
  } catch (err) {
    console.error("Error creating notification:", err);
  }
}
