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

export async function fetchTags(
  supabase: SupabaseClient
): Promise<{ id: string; name: string; color: string }[]> {
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

export async function createTag(
  supabase: SupabaseClient,
  name: string,
  color: string
): Promise<{ id: string; name: string; color: string } | null> {
  const { data, error } = await supabase
    .from("tags")
    .insert({ name, color })
    .select("id, name, color")
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
  name: string,
  color: string
): Promise<{ id: string; name: string; color: string } | null> {
  const { data, error } = await supabase
    .from("tags")
    .update({ name, color })
    .eq("id", tagId)
    .select("id, name, color")
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
