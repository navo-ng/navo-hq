import { SupabaseClient } from "@supabase/supabase-js";

export interface NotificationPreferences {
  id: string;
  user_id: string;
  task_assigned: boolean;
  task_status_changed: boolean;
  task_commented: boolean;
  project_added: boolean;
  decision_voted: boolean;
  dependency_added: boolean;
  email_digest: boolean;
  created_at: string;
  updated_at: string;
}

const DEFAULT_PREFS: Omit<NotificationPreferences, "id" | "user_id" | "created_at" | "updated_at"> = {
  task_assigned: true,
  task_status_changed: true,
  task_commented: true,
  project_added: true,
  decision_voted: true,
  dependency_added: true,
  email_digest: false,
};

export async function fetchPreferences(
  supabase: SupabaseClient,
  userId: string
): Promise<NotificationPreferences> {
  const { data, error } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    const { data: inserted } = await supabase
      .from("notification_preferences")
      .insert({ user_id: userId, ...DEFAULT_PREFS })
      .select("*")
      .single();
    return inserted as NotificationPreferences;
  }

  return data as NotificationPreferences;
}

export async function updatePreferences(
  supabase: SupabaseClient,
  userId: string,
  prefs: Partial<Pick<NotificationPreferences, "task_assigned" | "task_status_changed" | "task_commented" | "project_added" | "decision_voted" | "dependency_added" | "email_digest">>
): Promise<void> {
  const { error } = await supabase
    .from("notification_preferences")
    .upsert(
      { user_id: userId, ...prefs, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );

  if (error) {
    console.error("Error updating notification preferences:", error);
  }
}

export async function isNotificationEnabled(
  supabase: SupabaseClient,
  userId: string,
  type: string
): Promise<boolean> {
  const typeMap: Record<string, keyof typeof DEFAULT_PREFS> = {
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
  return Boolean((data as Record<string, unknown>)[field]);
}
