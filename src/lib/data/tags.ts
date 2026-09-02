import { SupabaseClient } from "@supabase/supabase-js";

export interface AppTag {
  id: string;
  name: string;
  color: string;
  category: string | null;
  created_at: string;
}

export async function fetchAllTags(supabase: SupabaseClient): Promise<AppTag[]> {
  const { data, error } = await supabase
    .from("tags")
    .select("id, name, color, category, created_at")
    .order("name");

  if (error) {
    console.error("Error fetching tags:", error);
    return [];
  }

  return (data || []).map((t) => ({
    id: t.id,
    name: t.name,
    color: t.color,
    category: t.category || null,
    created_at: t.created_at || "",
  }));
}

export async function fetchTags(
  supabase: SupabaseClient
): Promise<AppTag[]> {
  const { data, error } = await supabase
    .from("tags")
    .select("id, name, color, category, created_at")
    .order("name");

  if (error) {
    console.error("Error fetching tags:", error);
    return [];
  }

  return (data || []).map((t) => ({
    id: t.id,
    name: t.name,
    color: t.color,
    category: t.category || null,
    created_at: t.created_at,
  }));
}

export async function createTag(
  supabase: SupabaseClient,
  input: { name: string; color: string; category?: string }
): Promise<AppTag | null> {
  const { data, error } = await supabase
    .from("tags")
    .insert({
      name: input.name,
      color: input.color,
      category: input.category || null,
    })
    .select("id, name, color, category, created_at")
    .single();

  if (error) {
    console.error("Error creating tag:", error);
    return null;
  }

  return data;
}

export async function updateTag(
  supabase: SupabaseClient,
  tagId: string,
  input: { name: string; color: string; category?: string }
): Promise<AppTag | null> {
  const { data, error } = await supabase
    .from("tags")
    .update({
      name: input.name,
      color: input.color,
      category: input.category || null,
    })
    .eq("id", tagId)
    .select("id, name, color, category, created_at")
    .single();

  if (error) {
    console.error("Error updating tag:", error);
    return null;
  }

  return data;
}

export async function deleteTag(
  supabase: SupabaseClient,
  tagId: string
): Promise<void> {
  const { error } = await supabase.from("tags").delete().eq("id", tagId);
  if (error) console.error("Error deleting tag:", error);
}
