import { SupabaseClient } from "@supabase/supabase-js";

export interface TimeEntry {
  id: string;
  task_id: string;
  user_id: string;
  description: string | null;
  minutes: number;
  date: string;
  created_at: string;
}

export async function fetchTimeEntriesByTask(
  supabase: SupabaseClient,
  taskId: string
): Promise<TimeEntry[]> {
  const { data, error } = await supabase
    .from("time_entries")
    .select("*")
    .eq("task_id", taskId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching time entries:", error);
    return [];
  }

  return (data || []) as TimeEntry[];
}

export async function logTime(
  supabase: SupabaseClient,
  taskId: string,
  minutes: number,
  description?: string
): Promise<TimeEntry | null> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  if (!userId) {
    console.error("No authenticated user");
    return null;
  }

  const { data, error } = await supabase
    .from("time_entries")
    .insert({
      task_id: taskId,
      user_id: userId,
      minutes,
      description: description || null,
      date: new Date().toISOString().split("T")[0],
    })
    .select("*")
    .single();

  if (error) {
    console.error("Error logging time:", error);
    return null;
  }

  return data as TimeEntry;
}

export async function deleteTimeEntry(
  supabase: SupabaseClient,
  entryId: string
): Promise<void> {
  const { error } = await supabase
    .from("time_entries")
    .delete()
    .eq("id", entryId);

  if (error) {
    console.error("Error deleting time entry:", error);
  }
}

export async function fetchTotalTimeByTask(
  supabase: SupabaseClient,
  taskId: string
): Promise<number> {
  const { data, error } = await supabase
    .from("time_entries")
    .select("minutes")
    .eq("task_id", taskId);

  if (error) {
    console.error("Error fetching total time:", error);
    return 0;
  }

  return (data || []).reduce((sum, entry) => sum + (entry.minutes || 0), 0);
}
