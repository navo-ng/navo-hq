import { SupabaseClient } from "@supabase/supabase-js";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
}

export async function fetchAllUsers(supabase: SupabaseClient): Promise<AppUser[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, email, avatar_url")
    .eq("is_active", true)
    .order("name");

  if (error) {
    console.error("Error fetching users:", error);
    return [];
  }

  return (data || []).map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    avatar_url: u.avatar_url,
  }));
}
