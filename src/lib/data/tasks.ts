import { SupabaseClient } from "@supabase/supabase-js";
import {
  Task,
  TaskUser,
  TaskProject,
  TaskTag,
  TaskStatusConfig,
  TaskPriorityConfig,
  CreateTaskInput,
} from "@/types/task";
import { logActivity } from "./log-activity";
import { createNotification } from "./create-notification";

const TASK_SELECT = `
  *,
  owner:profiles!tasks_owner_id_fkey(id, name, email, avatar_url),
  creator:profiles!tasks_creator_id_fkey(id, name, email, avatar_url),
  project:projects(id, name),
  status:task_statuses(id, name, color),
  priority:task_priorities(id, name, color),
  tags:task_tags(tag:tags(id, name, color))
`;

function mapTask(row: Record<string, unknown>): Task {
  const owner = row.owner as Record<string, unknown> | null;
  const creator = row.creator as Record<string, unknown> | null;
  const project = row.project as Record<string, unknown> | null;
  const status = row.status as Record<string, unknown> | null;
  const priority = row.priority as Record<string, unknown> | null;
  const tagRows = row.tags as { tag: Record<string, unknown> }[] | null;

  return {
    id: row.id as string,
    title: row.title as string,
    description: row.description as string | null,
    creator_id: row.creator_id as string,
    owner_id: row.owner_id as string | null,
    project_id: row.project_id as string | null,
    status_id: row.status_id as string,
    priority_id: row.priority_id as string,
    start_date: row.start_date as string | null,
    due_date: row.due_date as string | null,
    completed_at: row.completed_at as string | null,
    is_archived: row.is_archived as boolean,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    owner: owner
      ? {
          id: owner.id as string,
          name: owner.name as string,
          email: owner.email as string,
          avatar_url: owner.avatar_url as string | null,
        }
      : null,
    creator: creator
      ? {
          id: creator.id as string,
          name: creator.name as string,
          email: creator.email as string,
          avatar_url: creator.avatar_url as string | null,
        }
      : undefined,
    project: project
      ? { id: project.id as string, name: project.name as string }
      : null,
    status: status
      ? {
          id: status.id as string,
          name: status.name as string,
          color: status.color as string,
        }
      : undefined,
    priority: priority
      ? {
          id: priority.id as string,
          name: priority.name as string,
          color: priority.color as string,
        }
      : undefined,
    tags: tagRows
      ? tagRows
          .filter((tr) => tr.tag)
          .map((tr) => ({
            id: tr.tag.id as string,
            name: tr.tag.name as string,
            color: tr.tag.color as string,
          }))
      : [],
  };
}

export async function fetchTasks(
  supabase: SupabaseClient,
  filters?: {
    status_id?: string;
    priority_id?: string;
    owner_id?: string;
    quick_filter?: "my_tasks" | "overdue" | "due_today" | "completed";
    search?: string;
    include_archived?: boolean;
  }
): Promise<Task[]> {
  let query = supabase
    .from("tasks")
    .select(TASK_SELECT)
    .order("created_at", { ascending: false });

  if (!filters?.include_archived) {
    query = query.eq("is_archived", false);
  }

  if (filters?.status_id) {
    query = query.eq("status_id", filters.status_id);
  }

  if (filters?.priority_id) {
    query = query.eq("priority_id", filters.priority_id);
  }

  if (filters?.owner_id) {
    query = query.eq("owner_id", filters.owner_id);
  }

  if (filters?.quick_filter === "overdue") {
    const today = new Date().toISOString().split("T")[0];
    query = query.lt("due_date", today).neq("status_id", await getDoneStatusId(supabase));
  }

  if (filters?.quick_filter === "due_today") {
    const today = new Date().toISOString().split("T")[0];
    query = query.eq("due_date", today);
  }

  if (filters?.quick_filter === "completed") {
    const doneId = await getDoneStatusId(supabase);
    query = query.eq("status_id", doneId);
  }

  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching tasks:", error);
    return [];
  }

  return (data || []).map(mapTask);
}

let doneStatusIdCache: string | null = null;

async function getDoneStatusId(supabase: SupabaseClient): Promise<string> {
  if (doneStatusIdCache) return doneStatusIdCache;
  const { data } = await supabase
    .from("task_statuses")
    .select("id")
    .eq("name", "Done")
    .single();
  if (data) doneStatusIdCache = data.id;
  return data?.id || "";
}

export async function fetchTaskStatuses(
  supabase: SupabaseClient
): Promise<TaskStatusConfig[]> {
  const { data, error } = await supabase
    .from("task_statuses")
    .select("id, name, color")
    .eq("is_active", true)
    .order("position");

  if (error) {
    console.error("Error fetching task statuses:", error);
    return [];
  }

  return (data || []).map((s) => ({
    id: s.id,
    name: s.name,
    color: s.color,
  }));
}

export async function fetchTaskPriorities(
  supabase: SupabaseClient
): Promise<TaskPriorityConfig[]> {
  const { data, error } = await supabase
    .from("task_priorities")
    .select("id, name, color")
    .order("position");

  if (error) {
    console.error("Error fetching task priorities:", error);
    return [];
  }

  return (data || []).map((p) => ({
    id: p.id,
    name: p.name,
    color: p.color,
  }));
}

export async function createTask(
  supabase: SupabaseClient,
  input: CreateTaskInput
): Promise<Task | null> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  if (!userId) {
    console.error("No authenticated user");
    return null;
  }

  const { tag_ids, ...taskData } = input;

  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .insert({
      ...taskData,
      creator_id: userId,
      description: input.description || null,
      owner_id: input.owner_id || null,
      project_id: input.project_id || null,
      due_date: input.due_date || null,
    })
    .select(TASK_SELECT)
    .single();

  if (taskError) {
    console.error("Error creating task:", taskError);
    return null;
  }

  if (tag_ids && tag_ids.length > 0) {
    const tagInserts = tag_ids.map((tag_id) => ({
      task_id: task.id,
      tag_id,
    }));

    const { error: tagError } = await supabase
      .from("task_tags")
      .insert(tagInserts);

    if (tagError) {
      console.error("Error adding task tags:", tagError);
    }
  }

  logActivity({
    supabase,
    action: "create",
    entityType: "task",
    entityId: task.id,
    entityName: task.title,
    userId,
  });

  if (input.owner_id && input.owner_id !== userId) {
    const { data: actorProfile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", userId)
      .single();
    const actorName = actorProfile?.name || "Someone";
    createNotification({
      supabase,
      userId: input.owner_id,
      type: "task_assigned",
      title: "New task assigned",
      message: `${actorName} assigned you '${task.title}'`,
      entityType: "task",
      entityId: task.id,
    });
  }

  return mapTask(task);
}

export async function updateTaskStatus(
  supabase: SupabaseClient,
  taskId: string,
  statusId: string
): Promise<void> {
  const update: Record<string, unknown> = { status_id: statusId };

  const doneId = await getDoneStatusId(supabase);
  if (statusId === doneId) {
    update.completed_at = new Date().toISOString();
  } else {
    update.completed_at = null;
  }

  const { data: userData } = await supabase.auth.getUser();

  const { data: taskData } = await supabase
    .from("tasks")
    .select("owner_id, title")
    .eq("id", taskId)
    .single();

  const { error } = await supabase.from("tasks").update(update).eq("id", taskId);

  if (error) {
    console.error("Error updating task status:", error);
  }

  logActivity({
    supabase,
    action: "status_change",
    entityType: "task",
    entityId: taskId,
    entityName: "task",
    details: { status_id: statusId },
    userId: userData.user?.id,
  });

  if (taskData?.owner_id && userData.user?.id && taskData.owner_id !== userData.user.id) {
    const { data: statusData } = await supabase
      .from("task_statuses")
      .select("name")
      .eq("id", statusId)
      .single();
    const { data: actorProfile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", userData.user.id)
      .single();
    const actorName = actorProfile?.name || "Someone";
    const statusName = statusData?.name || statusId;
    createNotification({
      supabase,
      userId: taskData.owner_id,
      type: "task_status_changed",
      title: "Task status updated",
      message: `${actorName} moved '${taskData.title}' to ${statusName}`,
      entityType: "task",
      entityId: taskId,
    });
  }
}

export async function updateTaskPriority(
  supabase: SupabaseClient,
  taskId: string,
  priorityId: string
): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("tasks")
    .update({ priority_id: priorityId })
    .eq("id", taskId);

  if (error) {
    console.error("Error updating task priority:", error);
  }

  logActivity({
    supabase,
    action: "update",
    entityType: "task",
    entityId: taskId,
    entityName: "task",
    details: { priority_id: priorityId },
    userId: userData.user?.id,
  });
}

export async function updateTaskOwner(
  supabase: SupabaseClient,
  taskId: string,
  newOwnerId: string | null
): Promise<void> {
  const { error } = await supabase
    .from("tasks")
    .update({ owner_id: newOwnerId, updated_at: new Date().toISOString() })
    .eq("id", taskId);
  if (error) throw error;
}

export async function updateTask(
  supabase: SupabaseClient,
  taskId: string,
  input: {
    title?: string;
    description?: string | null;
    status_id?: string;
    priority_id?: string;
    owner_id?: string | null;
    project_id?: string | null;
    due_date?: string | null;
    tag_ids?: string[];
  }
): Promise<Task | null> {
  const { tag_ids, ...taskData } = input;

  const updatePayload: Record<string, unknown> = { ...taskData, updated_at: new Date().toISOString() };

  if ("description" in taskData && taskData.description === null) {
    updatePayload.description = null;
  }
  if ("owner_id" in taskData && taskData.owner_id === null) {
    updatePayload.owner_id = null;
  }
  if ("project_id" in taskData && taskData.project_id === null) {
    updatePayload.project_id = null;
  }
  if ("due_date" in taskData && taskData.due_date === null) {
    updatePayload.due_date = null;
  }

  if (taskData.status_id) {
    const doneId = await getDoneStatusId(supabase);
    if (taskData.status_id === doneId) {
      updatePayload.completed_at = new Date().toISOString();
    } else {
      updatePayload.completed_at = null;
    }
  }

  const { data, error } = await supabase
    .from("tasks")
    .update(updatePayload)
    .eq("id", taskId)
    .select(TASK_SELECT)
    .single();

  if (error) {
    console.error("Error updating task:", error);
    return null;
  }

  if (tag_ids !== undefined) {
    await supabase.from("task_tags").delete().eq("task_id", taskId);

    if (tag_ids.length > 0) {
      const tagInserts = tag_ids.map((tag_id) => ({
        task_id: taskId,
        tag_id,
      }));
      const { error: tagError } = await supabase.from("task_tags").insert(tagInserts);
      if (tagError) {
        console.error("Error syncing task tags:", tagError);
      }
    }
  }

  logActivity({
    supabase,
    action: "update",
    entityType: "task",
    entityId: taskId,
    entityName: data.title,
  });

  return mapTask(data);
}

export async function deleteTask(
  supabase: SupabaseClient,
  taskId: string
): Promise<void> {
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) throw error;
}

export async function archiveTask(
  supabase: SupabaseClient,
  taskId: string
): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("tasks")
    .update({ is_archived: true })
    .eq("id", taskId);

  if (error) {
    console.error("Error archiving task:", error);
  }

  logActivity({
    supabase,
    action: "archive",
    entityType: "task",
    entityId: taskId,
    entityName: "task",
    userId: userData.user?.id,
  });
}

export async function fetchUsers(
  supabase: SupabaseClient
): Promise<TaskUser[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, email, avatar_url")
    .eq("is_active", true)
    .order("name");

  if (error) {
    console.error("Error fetching users:", error);
    return [];
  }

  return (data || []).map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    avatar_url: u.avatar_url,
  }));
}

/**
 * @deprecated Use fetchProjects from @/lib/data/projects instead.
 * This function only returns {id, name}[] and is kept for backward compatibility.
 */
export async function fetchProjects(
  supabase: SupabaseClient
): Promise<TaskProject[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("id, name")
    .eq("is_archived", false)
    .order("name");

  if (error) {
    console.error("Error fetching projects:", error);
    return [];
  }

  return (data || []).map((p) => ({
    id: p.id,
    name: p.name,
  }));
}

export async function fetchTags(
  supabase: SupabaseClient
): Promise<TaskTag[]> {
  const { data, error } = await supabase
    .from("tags")
    .select("id, name, color")
    .order("name");

  if (error) {
    console.error("Error fetching tags:", error);
    return [];
  }

  return (data || []).map((t) => ({
    id: t.id,
    name: t.name,
    color: t.color,
  }));
}
