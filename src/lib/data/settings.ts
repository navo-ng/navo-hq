import { SupabaseClient } from "@supabase/supabase-js";
import { TeamSetting, UserSetting } from "@/types/settings";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = string | number | boolean | null | { [key: string]: any } | any[];

function mapTeamSetting(row: Record<string, unknown>): TeamSetting {
  return {
    id: row.id as string,
    key: row.key as string,
    value: row.value as Json,
    description: row.description as string | null,
    updated_by: row.updated_by as string | null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function mapUserSetting(row: Record<string, unknown>): UserSetting {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    key: row.key as string,
    value: row.value as Json,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function fetchTeamSettings(
  supabase: SupabaseClient
): Promise<TeamSetting[]> {
  const { data, error } = await supabase
    .from("team_settings")
    .select("*")
    .order("key");

  if (error) {
    console.error("Error fetching team settings:", error);
    return [];
  }

  return (data || []).map(mapTeamSetting);
}

export async function updateTeamSetting(
  supabase: SupabaseClient,
  key: string,
  value: Json,
  description?: string
): Promise<TeamSetting | null> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  const update: Record<string, unknown> = { value };
  if (description !== undefined) update.description = description;
  if (userId) update.updated_by = userId;

  const { data, error } = await supabase
    .from("team_settings")
    .update(update)
    .eq("key", key)
    .select("*")
    .single();

  if (error) {
    const { data: inserted, error: insertError } = await supabase
      .from("team_settings")
      .insert({
        key,
        value,
        description: description || null,
        updated_by: userId || null,
      })
      .select("*")
      .single();

    if (insertError) {
      console.error("Error upserting team setting:", insertError);
      return null;
    }

    return mapTeamSetting(inserted);
  }

  return mapTeamSetting(data);
}

export async function fetchUserSettings(
  supabase: SupabaseClient,
  userId: string
): Promise<UserSetting[]> {
  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .order("key");

  if (error) {
    console.error("Error fetching user settings:", error);
    return [];
  }

  return (data || []).map(mapUserSetting);
}

export async function updateUserSetting(
  supabase: SupabaseClient,
  userId: string,
  key: string,
  value: Json
): Promise<UserSetting | null> {
  const { data, error } = await supabase
    .from("user_settings")
    .update({ value })
    .eq("user_id", userId)
    .eq("key", key)
    .select("*")
    .single();

  if (error) {
    const { data: inserted, error: insertError } = await supabase
      .from("user_settings")
      .insert({
        user_id: userId,
        key,
        value,
      })
      .select("*")
      .single();

    if (insertError) {
      console.error("Error upserting user setting:", insertError);
      return null;
    }

    return mapUserSetting(inserted);
  }

  return mapUserSetting(data);
}
