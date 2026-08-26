import { SupabaseClient } from "@supabase/supabase-js";

export interface TaskDependency {
  task_id: string;
  blocked_by_id: string;
  created_at: string;
}

export async function fetchDependencies(
  supabase: SupabaseClient,
  taskId: string
): Promise<TaskDependency[]> {
  const { data, error } = await supabase
    .from("task_dependencies")
    .select("*")
    .eq("task_id", taskId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching task dependencies:", error);
    return [];
  }

  return (data || []).map((row) => ({
    task_id: row.task_id as string,
    blocked_by_id: row.blocked_by_id as string,
    created_at: row.created_at as string,
  }));
}

export async function fetchBlockedByTasks(
  supabase: SupabaseClient,
  taskId: string
): Promise<{ id: string; title: string; status: { name: string; color: string } | null }[]> {
  const { data, error } = await supabase
    .from("task_dependencies")
    .select(`
      blocked_by_id,
      task:blocks!task_dependencies_blocked_by_id_fkey(
        id, title,
        status:task_statuses(name, color)
      )
    `)
    .eq("task_id", taskId);

  if (error) {
    console.error("Error fetching blocked-by tasks:", error);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((row: any) => {
      const task = row.task;
      if (!task) return null;
      const status = task.status;
      return {
        id: task.id as string,
        title: task.title as string,
        status: status
          ? { name: status.name as string, color: status.color as string }
          : null,
      };
    })
    .filter(Boolean) as { id: string; title: string; status: { name: string; color: string } | null }[];
}

export async function fetchBlockingTasks(
  supabase: SupabaseClient,
  taskId: string
): Promise<{ id: string; title: string; status: { name: string; color: string } | null }[]> {
  const { data, error } = await supabase
    .from("task_dependencies")
    .select(`
      task_id,
      task:tasks!task_dependencies_task_id_fkey(
        id, title,
        status:task_statuses(name, color)
      )
    `)
    .eq("blocked_by_id", taskId);

  if (error) {
    console.error("Error fetching blocking tasks:", error);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((row: any) => {
      const task = row.task;
      if (!task) return null;
      const status = task.status;
      return {
        id: task.id as string,
        title: task.title as string,
        status: status
          ? { name: status.name as string, color: status.color as string }
          : null,
      };
    })
    .filter(Boolean) as { id: string; title: string; status: { name: string; color: string } | null }[];
}

export async function addDependency(
  supabase: SupabaseClient,
  taskId: string,
  blockedById: string
): Promise<void> {
  if (taskId === blockedById) {
    console.error("A task cannot depend on itself");
    return;
  }

  const { error } = await supabase
    .from("task_dependencies")
    .insert({
      task_id: taskId,
      blocked_by_id: blockedById,
    });

  if (error) {
    console.error("Error adding task dependency:", error);
  }
}

export async function removeDependency(
  supabase: SupabaseClient,
  taskId: string,
  blockedById: string
): Promise<void> {
  const { error } = await supabase
    .from("task_dependencies")
    .delete()
    .eq("task_id", taskId)
    .eq("blocked_by_id", blockedById);

  if (error) {
    console.error("Error removing task dependency:", error);
  }
}
