import { SupabaseClient } from "@supabase/supabase-js";

export interface TaskSetTemplate {
  id: string;
  name: string;
  description: string | null;
  creator_id: string;
  tasks: Array<{
    title: string;
    description?: string;
    priority?: string;
    estimated_hours?: number;
  }>;
  created_at: string;
}

export async function fetchTaskSetTemplates(supabase: SupabaseClient): Promise<TaskSetTemplate[]> {
  const { data, error } = await supabase
    .from("task_set_templates")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching task set templates:", error);
    return [];
  }
  return data || [];
}

export async function createTaskSetTemplate(
  supabase: SupabaseClient,
  input: { name: string; description?: string; tasks: TaskSetTemplate["tasks"] }
): Promise<TaskSetTemplate | null> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data, error } = await supabase
    .from("task_set_templates")
    .insert({
      name: input.name,
      description: input.description || null,
      creator_id: userData.user.id,
      tasks: input.tasks,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating task set template:", error);
    return null;
  }
  return data;
}

export async function deleteTaskSetTemplate(
  supabase: SupabaseClient,
  templateId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("task_set_templates")
    .delete()
    .eq("id", templateId);

  if (error) {
    console.error("Error deleting task set template:", error);
    return false;
  }
  return true;
}

export async function createTasksFromSetTemplate(
  supabase: SupabaseClient,
  templateId: string,
  projectId?: string
): Promise<number> {
  const { data: template, error: fetchError } = await supabase
    .from("task_set_templates")
    .select("tasks")
    .eq("id", templateId)
    .single();

  if (fetchError || !template) return 0;

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return 0;

  const tasks = template.tasks as TaskSetTemplate["tasks"];
  let created = 0;

  for (const task of tasks) {
    const { error } = await supabase.from("tasks").insert({
      title: task.title,
      description: task.description || null,
      project_id: projectId || null,
      creator_id: userData.user.id,
    });
    if (!error) created++;
  }

  return created;
}
