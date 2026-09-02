import { SupabaseClient } from "@supabase/supabase-js";

export interface AppTag {
  id: string;
  name: string;
  color: string;
}

export async function fetchAllTags(supabase: SupabaseClient): Promise<AppTag[]> {
  const { data, error } = await supabase
    .from("tags")
    .select("id, name, color")
    .order("name");

  if (error) {
    console.error("Error fetching tags:", error);
    return [];
  }

  return (data || []).map((t) => ({
    id: t.id,
    name: t.name,
    color: t.color,
  }));
}
