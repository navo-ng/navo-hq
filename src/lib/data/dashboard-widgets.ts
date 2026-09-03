import { SupabaseClient } from "@supabase/supabase-js";

export interface DashboardWidget {
  id: string;
  user_id: string;
  widget_type: string;
  position: number;
  is_visible: boolean;
  config: Record<string, unknown>;
}

export const WIDGET_TYPES = [
  { type: "stats", label: "Stat Cards", description: "Overview numbers" },
  { type: "my_tasks", label: "My Tasks", description: "Your assigned tasks" },
  { type: "project_progress", label: "Project Progress", description: "Project completion bars" },
  { type: "status_chart", label: "Status Chart", description: "Task status distribution" },
  { type: "priority_chart", label: "Priority Chart", description: "Task priority distribution" },
  { type: "workload", label: "Team Workload", description: "Who has what tasks" },
  { type: "recent_activity", label: "Recent Activity", description: "Latest team activity" },
  { type: "overdue", label: "Overdue Tasks", description: "Tasks past due date" },
  { type: "due_today", label: "Due Today", description: "Tasks due today" },
] as const;

export async function fetchWidgets(
  supabase: SupabaseClient
): Promise<DashboardWidget[]> {
  const { data, error } = await supabase
    .from("dashboard_widgets")
    .select("*")
    .order("position");
  if (error) return [];
  return (data || []).map((r) => ({
    ...r,
    config: (r.config as Record<string, unknown>) || {},
  }));
}

export async function saveWidgets(
  supabase: SupabaseClient,
  widgets: { widget_type: string; is_visible: boolean; position: number }[]
): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  await supabase
    .from("dashboard_widgets")
    .delete()
    .eq("user_id", user.id);

  const inserts = widgets.map((w, i) => ({
    user_id: user.id,
    widget_type: w.widget_type,
    position: i,
    is_visible: w.is_visible,
  }));

  const { error } = await supabase.from("dashboard_widgets").insert(inserts);
  return !error;
}
