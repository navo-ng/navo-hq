import { SupabaseClient } from "@supabase/supabase-js";
import {
  Project,
  ProjectStatusConfig,
  ProjectTaskStats,
  CreateProjectInput,
  UpdateProjectInput,
} from "@/types/project";
import { logActivity } from "./log-activity";
import { createNotification } from "./create-notification";

const PROJECT_SELECT = `
  *,
  owner:profiles!projects_owner_id_fkey(id, name, email, avatar_url),
  status:project_statuses(id, name, color),
  members:project_members(user_id, role, joined_at, user:profiles(id, name, email, avatar_url)),
  tags:project_tags(tag:tags(id, name, color))
`;

function mapProject(row: Record<string, unknown>): Project {
  const owner = row.owner as Record<string, unknown> | null;
  const status = row.status as Record<string, unknown> | null;
  const memberRows = row.members as
    | {
        user_id: string;
        role: string;
        joined_at: string;
        user: Record<string, unknown> | null;
      }[]
    | null;
  const tagRows = row.tags as { tag: Record<string, unknown> }[] | null;

  return {
    id: row.id as string,
    name: row.name as string,
    description: row.description as string | null,
    owner_id: row.owner_id as string,
    status_id: row.status_id as string,
    start_date: row.start_date as string | null,
    target_date: row.target_date as string | null,
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
    status: status
      ? {
          id: status.id as string,
          name: status.name as string,
          color: status.color as string,
        }
      : undefined,
    members: memberRows
      ? memberRows.map((m) => ({
          user_id: m.user_id,
          role: m.role,
          joined_at: m.joined_at,
          user: m.user
            ? {
                id: m.user.id as string,
                name: m.user.name as string,
                email: m.user.email as string,
                avatar_url: m.user.avatar_url as string | null,
              }
            : undefined,
        }))
      : [],
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

function computeTaskStats(
  tasks: { status_id: string; due_date: string | null; completed_at: string | null }[],
  doneStatusId: string
): ProjectTaskStats {
  const now = new Date();
  let total = 0;
  let done = 0;
  const in_progress = 0;
  const blocked = 0;
  let overdue = 0;

  for (const t of tasks) {
    total++;
    if (t.status_id === doneStatusId) {
      done++;
    }
    if (t.due_date && new Date(t.due_date) < now && t.status_id !== doneStatusId) {
      overdue++;
    }
  }

  return { total, done, in_progress, blocked, overdue };
}

export async function fetchProjects(
  supabase: SupabaseClient,
  filters?: {
    status_id?: string;
    owner_id?: string;
    search?: string;
    include_archived?: boolean;
    sort?: "newest" | "oldest" | "name" | "most_tasks" | "deadline";
  }
): Promise<Project[]> {
  let query = supabase
    .from("projects")
    .select(PROJECT_SELECT)
    .order("created_at", { ascending: false });

  if (!filters?.include_archived) {
    query = query.eq("is_archived", false);
  }

  if (filters?.status_id) {
    query = query.eq("status_id", filters.status_id);
  }

  if (filters?.owner_id) {
    query = query.eq("owner_id", filters.owner_id);
  }

  if (filters?.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching projects:", error);
    return [];
  }

  const projects = (data || []).map(mapProject);

  // Batch-fetch task counts
  const projectIds = projects.map((p) => p.id);
  if (projectIds.length === 0) return projects;

  const [taskRows, doneStatus] = await Promise.all([
    supabase
      .from("tasks")
      .select("project_id, status_id, due_date, completed_at")
      .in("project_id", projectIds)
      .eq("is_archived", false),
    supabase
      .from("task_statuses")
      .select("id")
      .eq("name", "Done")
      .single(),
  ]);

  const doneStatusId = doneStatus.data?.id || "";

  if (taskRows.data) {
    const taskMap = new Map<
      string,
      { status_id: string; due_date: string | null; completed_at: string | null }[]
    >();
    for (const row of taskRows.data) {
      const existing = taskMap.get(row.project_id) || [];
      existing.push(row);
      taskMap.set(row.project_id, existing);
    }
    for (const project of projects) {
      project.task_stats = computeTaskStats(
        taskMap.get(project.id) || [],
        doneStatusId
      );
    }
  }

  // Sort after task stats are computed
  if (filters?.sort === "most_tasks") {
    projects.sort(
      (a, b) => (b.task_stats?.total || 0) - (a.task_stats?.total || 0)
    );
  } else if (filters?.sort === "deadline") {
    projects.sort((a, b) => {
      if (!a.target_date) return 1;
      if (!b.target_date) return -1;
      return new Date(a.target_date).getTime() - new Date(b.target_date).getTime();
    });
  } else if (filters?.sort === "name") {
    projects.sort((a, b) => a.name.localeCompare(b.name));
  } else if (filters?.sort === "oldest") {
    projects.reverse();
  }

  return projects;
}

export async function fetchProjectById(
  supabase: SupabaseClient,
  projectId: string
): Promise<Project | null> {
  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_SELECT)
    .eq("id", projectId)
    .single();

  if (error) {
    console.error("Error fetching project:", error);
    return null;
  }

  const project = mapProject(data);

  // Fetch task stats
  const [taskRows, doneStatus] = await Promise.all([
    supabase
      .from("tasks")
      .select("status_id, due_date, completed_at")
      .eq("project_id", projectId)
      .eq("is_archived", false),
    supabase
      .from("task_statuses")
      .select("id")
      .eq("name", "Done")
      .single(),
  ]);

  const doneStatusId = doneStatus.data?.id || "";
  if (taskRows.data) {
    project.task_stats = computeTaskStats(taskRows.data, doneStatusId);
  }

  return project;
}

export async function fetchProjectStatuses(
  supabase: SupabaseClient
): Promise<ProjectStatusConfig[]> {
  const { data, error } = await supabase
    .from("project_statuses")
    .select("id, name, color")
    .order("position");

  if (error) {
    console.error("Error fetching project statuses:", error);
    return [];
  }

  return (data || []).map((s) => ({
    id: s.id,
    name: s.name,
    color: s.color,
  }));
}

export async function createProject(
  supabase: SupabaseClient,
  input: CreateProjectInput
): Promise<Project | null> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  if (!userId) {
    console.error("No authenticated user");
    return null;
  }

  const { tag_ids, member_ids, ...projectData } = input;

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      ...projectData,
      description: input.description || null,
      start_date: input.start_date || null,
      target_date: input.target_date || null,
    })
    .select(PROJECT_SELECT)
    .single();

  if (projectError) {
    console.error("Error creating project:", projectError);
    return null;
  }

  // Add owner as member
  const memberInserts = [{ project_id: project.id, user_id: input.owner_id, role: "owner" }];

  // Add additional members
  if (member_ids && member_ids.length > 0) {
    for (const uid of member_ids) {
      if (uid !== input.owner_id) {
        memberInserts.push({ project_id: project.id, user_id: uid, role: "member" });
      }
    }
  }

  const { error: memberError } = await supabase
    .from("project_members")
    .insert(memberInserts);

  if (memberError) {
    console.error("Error adding project members:", memberError);
  }

  // Add tags
  if (tag_ids && tag_ids.length > 0) {
    const tagInserts = tag_ids.map((tag_id) => ({
      project_id: project.id,
      tag_id,
    }));

    const { error: tagError } = await supabase
      .from("project_tags")
      .insert(tagInserts);

    if (tagError) {
      console.error("Error adding project tags:", tagError);
    }
  }

  logActivity({
    supabase,
    action: "create",
    entityType: "project",
    entityId: project.id,
    entityName: project.name,
    userId,
  });

  return mapProject(project);
}

export async function updateProject(
  supabase: SupabaseClient,
  projectId: string,
  input: UpdateProjectInput
): Promise<Project | null> {
  const update: Record<string, unknown> = {};
  if (input.name !== undefined) update.name = input.name;
  if (input.description !== undefined) update.description = input.description || null;
  if (input.owner_id !== undefined) update.owner_id = input.owner_id;
  if (input.status_id !== undefined) update.status_id = input.status_id;
  if (input.start_date !== undefined) update.start_date = input.start_date || null;
  if (input.target_date !== undefined) update.target_date = input.target_date || null;

  const { data, error } = await supabase
    .from("projects")
    .update(update)
    .eq("id", projectId)
    .select(PROJECT_SELECT)
    .single();

  if (error) {
    console.error("Error updating project:", error);
    return null;
  }

  logActivity({
    supabase,
    action: "update",
    entityType: "project",
    entityId: projectId,
    entityName: data.name,
  });

  return mapProject(data);
}

export async function deleteProject(
  supabase: SupabaseClient,
  projectId: string
): Promise<void> {
  const { error } = await supabase.from("projects").delete().eq("id", projectId);
  if (error) throw error;
}

export async function archiveProject(
  supabase: SupabaseClient,
  projectId: string
): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("projects")
    .update({ is_archived: true })
    .eq("id", projectId);

  if (error) {
    console.error("Error archiving project:", error);
  }

  logActivity({
    supabase,
    action: "archive",
    entityType: "project",
    entityId: projectId,
    entityName: "project",
    userId: userData.user?.id,
  });
}

export async function addProjectMember(
  supabase: SupabaseClient,
  projectId: string,
  userId: string,
  role: string = "member"
): Promise<void> {
  const { error } = await supabase
    .from("project_members")
    .insert({ project_id: projectId, user_id: userId, role });

  if (error) {
    console.error("Error adding project member:", error);
    return;
  }

  const [{ data: memberProfile }, { data: projectData }, { data: authData }] =
    await Promise.all([
      supabase.from("profiles").select("name").eq("id", userId).single(),
      supabase.from("projects").select("name").eq("id", projectId).single(),
      supabase.auth.getUser(),
    ]);

  const memberName = memberProfile?.name || "Unknown";
  const projectName = projectData?.name || "project";

  logActivity({
    supabase,
    action: "assign",
    entityType: "project",
    entityId: projectId,
    entityName: projectName,
    details: { member_name: memberName, member_id: userId },
  });

  if (authData.user?.id && authData.user.id !== userId) {
    const { data: actorProfile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", authData.user.id)
      .single();

    createNotification({
      supabase,
      userId,
      type: "project_add",
      title: "Added to project",
      message: `${actorProfile?.name || "Someone"} added you to ${projectName}`,
      entityType: "project",
      entityId: projectId,
    });
  }
}

export async function removeProjectMember(
  supabase: SupabaseClient,
  projectId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from("project_members")
    .delete()
    .eq("project_id", projectId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error removing project member:", error);
    return;
  }

  const [{ data: memberProfile }, { data: projectData }] = await Promise.all([
    supabase.from("profiles").select("name").eq("id", userId).single(),
    supabase.from("projects").select("name").eq("id", projectId).single(),
  ]);

  logActivity({
    supabase,
    action: "delete",
    entityType: "project",
    entityId: projectId,
    entityName: projectData?.name || "project",
    details: { member_name: memberProfile?.name || "Unknown", member_id: userId },
  });
}

export { fetchAllUsers } from "./users";
export type { AppUser as ProjectUser } from "./users";

export { fetchAllTags } from "./tags";
export type { AppTag } from "./tags";

export async function fetchProjectTasks(
  supabase: SupabaseClient,
  projectId: string
): Promise<
  {
    id: string;
    title: string;
    status_id: string;
    priority_id: string;
    owner_id: string | null;
    due_date: string | null;
    completed_at: string | null;
    status: { id: string; name: string; color: string } | null;
    priority: { id: string; name: string; color: string } | null;
    owner: { id: string; name: string; avatar_url: string | null } | null;
  }[]
> {
  const { data, error } = await supabase
    .from("tasks")
    .select(
      `
      id, title, status_id, priority_id, owner_id, due_date, completed_at,
      status:task_statuses(id, name, color),
      priority:task_priorities(id, name, color),
      owner:profiles!tasks_owner_id_fkey(id, name, avatar_url)
    `
    )
    .eq("project_id", projectId)
    .eq("is_archived", false)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching project tasks:", error);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((row: any) => ({
    id: row.id,
    title: row.title,
    status_id: row.status_id,
    priority_id: row.priority_id,
    owner_id: row.owner_id,
    due_date: row.due_date,
    completed_at: row.completed_at,
    status: row.status
      ? {
          id: row.status.id as string,
          name: row.status.name as string,
          color: row.status.color as string,
        }
      : null,
    priority: row.priority
      ? {
          id: row.priority.id as string,
          name: row.priority.name as string,
          color: row.priority.color as string,
        }
      : null,
    owner: row.owner
      ? {
          id: row.owner.id as string,
          name: row.owner.name as string,
          avatar_url: row.owner.avatar_url as string | null,
        }
      : null,
  }));
}
