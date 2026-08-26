import { SupabaseClient } from "@supabase/supabase-js";
import { Tag } from "@/types/index";
import { logActivity } from "./log-activity";

function mapTag(row: Record<string, unknown>): Tag {
  return {
    id: row.id as string,
    name: row.name as string,
    color: row.color as string,
    category: row.category as string | null,
    created_at: row.created_at as string,
  };
}

export async function fetchTags(
  supabase: SupabaseClient,
  filters?: {
    category?: string;
    search?: string;
  }
): Promise<Tag[]> {
  let query = supabase
    .from("tags")
    .select("*")
    .order("name");

  if (filters?.category) {
    query = query.eq("category", filters.category);
  }

  if (filters?.search) {
    query = query.ilike("name", `%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching tags:", error);
    return [];
  }

  return (data || []).map(mapTag);
}

export async function fetchTagById(
  supabase: SupabaseClient,
  tagId: string
): Promise<Tag | null> {
  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .eq("id", tagId)
    .single();

  if (error) {
    console.error("Error fetching tag:", error);
    return null;
  }

  return mapTag(data);
}

export async function createTag(
  supabase: SupabaseClient,
  input: { name: string; color?: string; category?: string }
): Promise<Tag | null> {
  const { data, error } = await supabase
    .from("tags")
    .insert({
      name: input.name,
      color: input.color || "#6B7280",
      category: input.category || null,
    })
    .select("*")
    .single();

  if (error) {
    console.error("Error creating tag:", error);
    return null;
  }

  logActivity({
    supabase,
    action: "create",
    entityType: "tag",
    entityId: data.id,
    entityName: data.name,
  });

  return mapTag(data);
}

export async function updateTag(
  supabase: SupabaseClient,
  tagId: string,
  input: { name?: string; color?: string; category?: string }
): Promise<Tag | null> {
  const update: Record<string, unknown> = {};
  if (input.name !== undefined) update.name = input.name;
  if (input.color !== undefined) update.color = input.color;
  if (input.category !== undefined) update.category = input.category || null;

  const { data, error } = await supabase
    .from("tags")
    .update(update)
    .eq("id", tagId)
    .select("*")
    .single();

  if (error) {
    console.error("Error updating tag:", error);
    return null;
  }

  logActivity({
    supabase,
    action: "update",
    entityType: "tag",
    entityId: tagId,
    entityName: data.name,
  });

  return mapTag(data);
}

export async function deleteTag(
  supabase: SupabaseClient,
  tagId: string
): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();

  await supabase.from("task_tags").delete().eq("tag_id", tagId);
  await supabase.from("project_tags").delete().eq("tag_id", tagId);
  await supabase.from("decision_tags").delete().eq("tag_id", tagId);
  await supabase.from("document_tags").delete().eq("tag_id", tagId);

  const { error } = await supabase
    .from("tags")
    .delete()
    .eq("id", tagId);

  if (error) {
    console.error("Error deleting tag:", error);
  }

  logActivity({
    supabase,
    action: "delete",
    entityType: "tag",
    entityId: tagId,
    entityName: "tag",
    userId: userData.user?.id,
  });
}

export async function fetchTagCategories(
  supabase: SupabaseClient
): Promise<string[]> {
  const { data, error } = await supabase
    .from("tags")
    .select("category")
    .not("category", "is", null)
    .order("category");

  if (error) {
    console.error("Error fetching tag categories:", error);
    return [];
  }

  const categories = [...new Set((data || []).map((r) => r.category as string))];
  return categories;
}
