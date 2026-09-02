import { SupabaseClient } from "@supabase/supabase-js";

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string | null;
  entity_type: string | null;
  entity_id: string | null;
  is_read: boolean;
  created_at: string;
}

function mapNotification(row: Record<string, unknown>): Notification {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    type: row.type as string,
    title: row.title as string,
    message: row.message as string | null,
    entity_type: row.entity_type as string | null,
    entity_id: row.entity_id as string | null,
    is_read: row.is_read as boolean,
    created_at: row.created_at as string,
  };
}

export async function fetchNotifications(
  supabase: SupabaseClient,
  userId: string,
  options?: {
    unreadOnly?: boolean;
    limit?: number;
    offset?: number;
  }
): Promise<Notification[]> {
  let query = supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(
      options?.offset || 0,
      (options?.offset || 0) + (options?.limit || 50) - 1
    );

  if (options?.unreadOnly) {
    query = query.eq("is_read", false);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }

  return (data || []).map(mapNotification);
}

export async function fetchUnreadCount(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) {
    console.error("Error fetching unread count:", error);
    return 0;
  }

  return count || 0;
}

export async function markAsRead(
  supabase: SupabaseClient,
  notificationId: string
): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId);

  if (error) {
    console.error("Error marking notification as read:", error);
  }
}

export async function markAllRead(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) {
    console.error("Error marking all notifications as read:", error);
  }
}
