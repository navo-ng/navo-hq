import { SupabaseClient } from "@supabase/supabase-js";

export interface TaskTemplate {
  id: string;
  name: string;
  description: string | null;
  title: string;
  task_description: string | null;
  priority_name: string;
  status_name: string;
  recurrence: string;
  created_by: string | null;
  created_at: string;
}

export async function fetchTaskTemplates(
  supabase: SupabaseClient
): Promise<TaskTemplate[]> {
  const { data, error } = await supabase
    .from("task_templates")
    .select("*")
    .order("name");

  if (error) {
    console.error("Error fetching task templates:", error);
    return [];
  }

  return (data || []) as TaskTemplate[];
}

export async function createTaskTemplate(
  supabase: SupabaseClient,
  input: {
    name: string;
    description?: string;
    title: string;
    task_description?: string;
    priority_name?: string;
    status_name?: string;
    recurrence?: string;
  }
): Promise<TaskTemplate | null> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  if (!userId) {
    console.error("No authenticated user");
    return null;
  }

  const { data, error } = await supabase
    .from("task_templates")
    .insert({
      name: input.name,
      description: input.description || null,
      title: input.title,
      task_description: input.task_description || null,
      priority_name: input.priority_name || "Medium",
      status_name: input.status_name || "To Do",
      recurrence: input.recurrence || "none",
      created_by: userId,
    })
    .select("*")
    .single();

  if (error) {
    console.error("Error creating task template:", error);
    return null;
  }

  return data as TaskTemplate;
}

export async function deleteTaskTemplate(
  supabase: SupabaseClient,
  templateId: string
): Promise<void> {
  const { error } = await supabase
    .from("task_templates")
    .delete()
    .eq("id", templateId);

  if (error) {
    console.error("Error deleting task template:", error);
  }
}
