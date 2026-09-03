import { SupabaseClient } from "@supabase/supabase-js";

export interface Standup {
  id: string;
  user_id: string;
  today_doing: string;
  today_done: string;
  blockers: string;
  created_at: string;
  user?: { id: string; name: string; email: string; avatar_url: string | null };
}

export async function fetchStandups(supabase: SupabaseClient, limit = 20): Promise<Standup[]> {
  const { data, error } = await supabase
    .from("standups")
    .select("*, user:profiles!standups_user_id_fkey(id, name, email, avatar_url)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching standups:", error);
    return [];
  }

  return (data || []).map((row) => ({
    id: row.id,
    user_id: row.user_id,
    today_doing: row.today_doing,
    today_done: row.today_done,
    blockers: row.blockers || "",
    created_at: row.created_at,
    user: row.user as Standup["user"],
  }));
}

export async function fetchMyStandup(supabase: SupabaseClient, userId: string): Promise<Standup | null> {
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("standups")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", `${today}T00:00:00Z`)
    .lte("created_at", `${today}T23:59:59Z`)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;
  return data;
}

export async function createStandup(
  supabase: SupabaseClient,
  userId: string,
  standup: { today_doing: string; today_done: string; blockers: string }
): Promise<Standup | null> {
  const { data, error } = await supabase
    .from("standups")
    .insert({
      user_id: userId,
      today_doing: standup.today_doing,
      today_done: standup.today_done,
      blockers: standup.blockers,
    })
    .select("*, user:profiles!standups_user_id_fkey(id, name, email, avatar_url)")
    .single();

  if (error) {
    console.error("Error creating standup:", error);
    return null;
  }

  return {
    id: data.id,
    user_id: data.user_id,
    today_doing: data.today_doing,
    today_done: data.today_done,
    blockers: data.blockers || "",
    created_at: data.created_at,
    user: data.user as Standup["user"],
  };
}
