import { SupabaseClient } from "@supabase/supabase-js";

export interface TaskLink {
  id: string;
  task_id: string;
  linked_task_id: string;
  link_type: string;
  linked_task?: { id: string; title: string; status: { name: string; color: string } | null };
}

export async function fetchTaskLinks(supabase: SupabaseClient, taskId: string): Promise<TaskLink[]> {
  const { data } = await supabase
    .from("task_links")
    .select("*, linked_task:tasks!task_links_linked_task_id_fkey(id, title, status:task_statuses(name, color))")
    .or(`task_id.eq.${taskId},linked_task_id.eq.${taskId}`);
  return (data || []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    task_id: r.task_id as string,
    linked_task_id: r.linked_task_id as string,
    link_type: r.link_type as string,
    linked_task: r.linked_task as TaskLink["linked_task"],
  }));
}

export async function addTaskLink(supabase: SupabaseClient, taskId: string, linkedTaskId: string, linkType = "related"): Promise<boolean> {
  const { error } = await supabase.from("task_links").insert({ task_id: taskId, linked_task_id: linkedTaskId, link_type: linkType });
  return !error;
}

export async function removeTaskLink(supabase: SupabaseClient, id: string): Promise<void> {
  await supabase.from("task_links").delete().eq("id", id);
}
