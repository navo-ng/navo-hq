import { SupabaseClient } from "@supabase/supabase-js";
import { Activity, ActivityWithUser } from "@/types/activity";

const ACTIVITY_SELECT = `
  *,
  user:profiles!activities_user_id_fkey(id, name, email, avatar_url)
`;

function mapActivity(row: Record<string, unknown>): ActivityWithUser {
  const user = row.user as Record<string, unknown> | null;

  return {
    id: row.id as string,
    user_id: row.user_id as string,
    entity_type: row.entity_type as string,
    entity_id: row.entity_id as string,
    action: row.action as string,
    old_value: row.old_value as Record<string, unknown> | null,
    new_value: row.new_value as Record<string, unknown> | null,
    metadata: row.metadata as Record<string, unknown> | null,
    created_at: row.created_at as string,
    user: user
      ? {
          id: user.id as string,
          name: user.name as string,
          email: user.email as string,
          avatar_url: user.avatar_url as string | null,
        }
      : undefined,
  };
}

export async function fetchActivities(
  supabase: SupabaseClient,
  filters?: {
    entityType?: string;
    entityId?: string;
    limit?: number;
    offset?: number;
  }
): Promise<ActivityWithUser[]> {
  let query = supabase
    .from("activities")
    .select(ACTIVITY_SELECT)
    .order("created_at", { ascending: false })
    .range(
      filters?.offset || 0,
      (filters?.offset || 0) + (filters?.limit || 100) - 1
    );

  if (filters?.entityType) {
    query = query.eq("entity_type", filters.entityType);
  }

  if (filters?.entityId) {
    query = query.eq("entity_id", filters.entityId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching activities:", error);
    return [];
  }

  return (data || []).map(mapActivity);
}
