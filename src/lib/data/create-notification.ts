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
    const { error } = await supabase.from("notifications").insert({
      user_id: userId,
      type,
      title,
      message: message || null,
      entity_type: entityType || null,
      entity_id: entityId || null,
      is_read: false,
    });
    if (error) console.error("Error creating notification:", error);
  } catch (err) {
    console.error("Error creating notification:", err);
  }
}
