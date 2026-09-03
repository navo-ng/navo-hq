import { SupabaseClient } from "@supabase/supabase-js";
import { ProjectMember } from "@/types/project";

export type ProjectRole = "viewer" | "editor" | "admin";

export const ROLE_LABELS: Record<ProjectRole, string> = {
  viewer: "Viewer",
  editor: "Editor",
  admin: "Admin",
};

export const ROLE_DESCRIPTIONS: Record<ProjectRole, string> = {
  viewer: "Can view tasks but not edit",
  editor: "Can view and edit tasks",
  admin: "Can view, edit, and manage project members",
};

export async function fetchProjectMembers(
  supabase: SupabaseClient,
  projectId: string
): Promise<ProjectMember[]> {
  const { data, error } = await supabase
    .from("project_members")
    .select(
      `user_id, role, joined_at, user:profiles(id, name, email, avatar_url)`
    )
    .eq("project_id", projectId)
    .order("joined_at");

  if (error) {
    console.error("Error fetching project members:", error);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((m: any) => ({
    user_id: m.user_id as string,
    role: m.role as string,
    joined_at: m.joined_at as string,
    user: m.user
      ? {
          id: m.user.id as string,
          name: m.user.name as string,
          email: m.user.email as string,
          avatar_url: m.user.avatar_url as string | null,
        }
      : undefined,
  }));
}

export async function addProjectMemberWithRole(
  supabase: SupabaseClient,
  projectId: string,
  userId: string,
  role: ProjectRole = "viewer"
): Promise<void> {
  const { error } = await supabase
    .from("project_members")
    .insert({ project_id: projectId, user_id: userId, role });

  if (error) {
    console.error("Error adding project member:", error);
    throw error;
  }
}

export async function updateMemberRole(
  supabase: SupabaseClient,
  projectId: string,
  userId: string,
  role: ProjectRole
): Promise<void> {
  const { error } = await supabase
    .from("project_members")
    .update({ role })
    .eq("project_id", projectId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error updating member role:", error);
    throw error;
  }
}

export async function removeProjectMemberById(
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
    throw error;
  }
}

export async function getUserProjectRole(
  supabase: SupabaseClient,
  projectId: string,
  userId: string
): Promise<ProjectRole | null> {
  const { data, error } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;
  return data.role as ProjectRole;
}

export async function canUserEditProject(
  supabase: SupabaseClient,
  projectId: string,
  userId: string
): Promise<boolean> {
  const role = await getUserProjectRole(supabase, projectId, userId);
  return role === "editor" || role === "admin";
}

export async function canUserManageProject(
  supabase: SupabaseClient,
  projectId: string,
  userId: string
): Promise<boolean> {
  const role = await getUserProjectRole(supabase, projectId, userId);
  return role === "admin";
}

export async function isUserAppOwner(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("profiles")
    .select("role_id")
    .eq("id", userId)
    .single();

  if (error || !data) return false;

  const { data: roleData } = await supabase
    .from("roles")
    .select("name")
    .eq("id", data.role_id)
    .single();

  return roleData?.name === "owner";
}

export async function canUserEditTasks(
  supabase: SupabaseClient,
  projectId: string,
  userId: string
): Promise<boolean> {
  if (await isUserAppOwner(supabase, userId)) return true;
  const role = await getUserProjectRole(supabase, projectId, userId);
  return role === "editor" || role === "admin";
}
