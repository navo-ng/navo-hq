import { SupabaseClient } from "@supabase/supabase-js";
import { TeamMember, TeamRole } from "@/types/team";

const TEAM_SELECT = `
  *,
  role:roles(id, name, description)
`;

function mapTeamMember(row: Record<string, unknown>): TeamMember {
  const role = row.role as Record<string, unknown> | null;

  return {
    id: row.id as string,
    email: row.email as string,
    name: row.name as string,
    avatar_url: row.avatar_url as string | null,
    role_id: row.role_id as string | null,
    is_active: row.is_active as boolean,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    role: role
      ? {
          id: role.id as string,
          name: role.name as string,
          description: role.description as string | null,
        }
      : null,
  };
}

export async function fetchTeam(
  supabase: SupabaseClient
): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select(TEAM_SELECT)
    .order("name");

  if (error) {
    console.error("Error fetching team:", error);
    return [];
  }

  return (data || []).map(mapTeamMember);
}

export async function fetchRoles(
  supabase: SupabaseClient
): Promise<TeamRole[]> {
  const { data, error } = await supabase
    .from("roles")
    .select("id, name, description, position")
    .order("position");

  if (error) {
    console.error("Error fetching roles:", error);
    return [];
  }

  return (data || []).map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    position: r.position,
  }));
}

export async function updateMemberRole(
  supabase: SupabaseClient,
  userId: string,
  roleId: string
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ role_id: roleId })
    .eq("id", userId);

  if (error) {
    console.error("Error updating member role:", error);
  }
}

export async function deactivateMember(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ is_active: false })
    .eq("id", userId);

  if (error) {
    console.error("Error deactivating member:", error);
  }
}
