import { SupabaseClient } from "@supabase/supabase-js";

export interface LogActivityInput {
  supabase: SupabaseClient;
  action: "create" | "update" | "delete" | "archive" | "assign" | "status_change" | "comment" | "vote";
  entityType: "task" | "project" | "decision" | "document" | "event" | "comment" | "tag";
  entityId: string;
  entityName: string;
  details?: Record<string, unknown>;
  userId?: string;
}

export async function logActivity({
  supabase,
  action,
  entityType,
  entityId,
  entityName,
  details,
  userId,
}: LogActivityInput): Promise<void> {
  try {
    let uid = userId;
    if (!uid) {
      const { data: userData } = await supabase.auth.getUser();
      uid = userData.user?.id;
    }

    if (!uid) return;

    const { error } = await supabase.from("activities").insert({
      user_id: uid,
      entity_type: entityType,
      entity_id: entityId,
      action,
      metadata: {
        entity_name: entityName,
        ...details,
      },
    });

    if (error) {
      console.error("Error logging activity:", error);
    }
  } catch (err) {
    console.error("Error logging activity:", err);
  }
}
