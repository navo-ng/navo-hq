import { SupabaseClient } from "@supabase/supabase-js";

export interface CustomStatus {
  id: string;
  name: string;
  color: string;
  position: number;
  is_active: boolean;
}

export async function fetchStatuses(supabase: SupabaseClient): Promise<CustomStatus[]> {
  const { data } = await supabase.from("task_statuses").select("*").order("position");
  return (data || []) as CustomStatus[];
}

export async function createStatus(supabase: SupabaseClient, input: { name: string; color: string }): Promise<CustomStatus | null> {
  const { data: maxPos } = await supabase.from("task_statuses").select("position").order("position", { ascending: false }).limit(1);
  const nextPos = maxPos && maxPos.length > 0 ? (maxPos[0].position as number) + 1 : 0;
  const { data, error } = await supabase.from("task_statuses").insert({ name: input.name, color: input.color, position: nextPos, is_active: true }).select("*").single();
  if (error) return null;
  return data as CustomStatus;
}

export async function updateStatus(supabase: SupabaseClient, id: string, updates: Partial<Pick<CustomStatus, "name" | "color" | "position" | "is_active">>): Promise<boolean> {
  const { error } = await supabase.from("task_statuses").update(updates).eq("id", id);
  return !error;
}

export async function deleteStatus(supabase: SupabaseClient, id: string): Promise<boolean> {
  const { error } = await supabase.from("task_statuses").delete().eq("id", id);
  return !error;
}
