import { SupabaseClient } from "@supabase/supabase-js";

export interface ProjectTemplate {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  template_data: {
    tasks?: {
      title: string;
      description?: string;
      priority?: string;
      status?: string;
    }[];
    milestones?: { name: string; tasks?: string[] }[];
  };
  created_at: string;
}

export async function fetchTemplates(
  supabase: SupabaseClient
): Promise<ProjectTemplate[]> {
  const { data, error } = await supabase
    .from("project_templates")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data || []).map((r) => ({
    id: r.id,
    user_id: r.user_id,
    name: r.name,
    description: r.description,
    template_data: r.template_data as ProjectTemplate["template_data"],
    created_at: r.created_at,
  }));
}

export async function createTemplate(
  supabase: SupabaseClient,
  input: {
    name: string;
    description?: string;
    template_data: ProjectTemplate["template_data"];
  }
): Promise<ProjectTemplate | null> {
  const { data: userData } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("project_templates")
    .insert({
      user_id: userData.user?.id,
      name: input.name,
      description: input.description || null,
      template_data: input.template_data,
    })
    .select("*")
    .single();
  if (error) return null;
  return {
    ...data,
    template_data: data.template_data as ProjectTemplate["template_data"],
  };
}

export async function deleteTemplate(
  supabase: SupabaseClient,
  id: string
): Promise<boolean> {
  const { error } = await supabase
    .from("project_templates")
    .delete()
    .eq("id", id);
  return !error;
}
