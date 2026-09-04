import { SupabaseClient } from "@supabase/supabase-js";

export interface ChecklistItem {
  id: string;
  task_id: string;
  title: string;
  is_completed: boolean;
  position: number;
}

export async function fetchChecklists(supabase: SupabaseClient, taskId: string): Promise<ChecklistItem[]> {
  const { data } = await supabase
    .from("task_checklists")
    .select("*")
    .eq("task_id", taskId)
    .order("position");
  return (data || []) as ChecklistItem[];
}

export async function addChecklistItem(supabase: SupabaseClient, taskId: string, title: string): Promise<ChecklistItem | null> {
  const { data: existing } = await supabase.from("task_checklists").select("position").eq("task_id", taskId).order("position", { ascending: false }).limit(1);
  const nextPos = existing && existing.length > 0 ? (existing[0].position as number) + 1 : 0;

  const { data, error } = await supabase.from("task_checklists").insert({ task_id: taskId, title, position: nextPos }).select("*").single();
  if (error) return null;
  return data as ChecklistItem;
}

export async function toggleChecklistItem(supabase: SupabaseClient, id: string, isCompleted: boolean): Promise<void> {
  await supabase.from("task_checklists").update({ is_completed: isCompleted }).eq("id", id);
}

export async function deleteChecklistItem(supabase: SupabaseClient, id: string): Promise<void> {
  await supabase.from("task_checklists").delete().eq("id", id);
}
