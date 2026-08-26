import { SupabaseClient } from "@supabase/supabase-js";
import {
  Decision,
  DecisionStatusConfig,
  DecisionUser,
  CreateDecisionInput,
} from "@/types/decision";
import { logActivity } from "./log-activity";

const DECISION_SELECT = `
  *,
  creator:profiles!decisions_creator_id_fkey(id, name, email, avatar_url),
  owner:profiles!decisions_owner_id_fkey(id, name, email, avatar_url),
  project:projects(id, name),
  status:decision_statuses(id, name, color),
  contributors:decision_contributors(user_id, contribution, added_at, user:profiles(id, name, email, avatar_url)),
  tags:decision_tags(tag:tags(id, name, color))
`;

function mapDecision(row: Record<string, unknown>): Decision {
  const creator = row.creator as Record<string, unknown> | null;
  const owner = row.owner as Record<string, unknown> | null;
  const project = row.project as Record<string, unknown> | null;
  const status = row.status as Record<string, unknown> | null;
  const contributorRows = row.contributors as
    | {
        user_id: string;
        contribution: string | null;
        added_at: string;
        user: Record<string, unknown> | null;
      }[]
    | null;
  const tagRows = row.tags as { tag: Record<string, unknown> }[] | null;

  return {
    id: row.id as string,
    title: row.title as string,
    topic: row.topic as string | null,
    context: row.context as string | null,
    proposed_decision: row.proposed_decision as string | null,
    decision_text: row.decision_text as string | null,
    reason: row.reason as string | null,
    alternatives: row.alternatives as string | null,
    creator_id: row.creator_id as string,
    owner_id: row.owner_id as string | null,
    project_id: row.project_id as string | null,
    status_id: row.status_id as string,
    decided_at: row.decided_at as string | null,
    superseded_by: row.superseded_by as string | null,
    is_archived: row.is_archived as boolean,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    creator: creator
      ? {
          id: creator.id as string,
          name: creator.name as string,
          email: creator.email as string,
          avatar_url: creator.avatar_url as string | null,
        }
      : undefined,
    owner: owner
      ? {
          id: owner.id as string,
          name: owner.name as string,
          email: owner.email as string,
          avatar_url: owner.avatar_url as string | null,
        }
      : null,
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
    contributors: contributorRows
      ? contributorRows
          .filter((c) => c.user)
          .map((c) => ({
            user: {
              id: c.user!.id as string,
              name: c.user!.name as string,
              email: c.user!.email as string,
              avatar_url: c.user!.avatar_url as string | null,
            },
            contribution: c.contribution as string | null,
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

export async function fetchDecisions(
  supabase: SupabaseClient,
  filters?: {
    status_id?: string;
    owner_id?: string;
    search?: string;
    include_archived?: boolean;
    sort?: "newest" | "oldest" | "title" | "decided";
  }
): Promise<Decision[]> {
  let query = supabase
    .from("decisions")
    .select(DECISION_SELECT)
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
      `title.ilike.%${filters.search}%,topic.ilike.%${filters.search}%,context.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching decisions:", error);
    return [];
  }

  const decisions = (data || []).map(mapDecision);

  if (filters?.sort === "title") {
    decisions.sort((a, b) => a.title.localeCompare(b.title));
  } else if (filters?.sort === "oldest") {
    decisions.sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  } else if (filters?.sort === "decided") {
    decisions.sort((a, b) => {
      if (!a.decided_at) return 1;
      if (!b.decided_at) return -1;
      return (
        new Date(b.decided_at).getTime() - new Date(a.decided_at).getTime()
      );
    });
  }

  return decisions;
}

export async function fetchDecisionById(
  supabase: SupabaseClient,
  decisionId: string
): Promise<Decision | null> {
  const { data, error } = await supabase
    .from("decisions")
    .select(DECISION_SELECT)
    .eq("id", decisionId)
    .single();

  if (error) {
    console.error("Error fetching decision:", error);
    return null;
  }

  return mapDecision(data);
}

export async function fetchDecisionStatuses(
  supabase: SupabaseClient
): Promise<DecisionStatusConfig[]> {
  const { data, error } = await supabase
    .from("decision_statuses")
    .select("id, name, color")
    .order("position");

  if (error) {
    console.error("Error fetching decision statuses:", error);
    return [];
  }

  return (data || []).map((s) => ({
    id: s.id,
    name: s.name,
    color: s.color,
  }));
}

export async function createDecision(
  supabase: SupabaseClient,
  input: CreateDecisionInput
): Promise<Decision | null> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  if (!userId) {
    console.error("No authenticated user");
    return null;
  }

  const { contributor_ids, tag_ids, ...decisionData } = input;

  const { data: decision, error: decisionError } = await supabase
    .from("decisions")
    .insert({
      ...decisionData,
      creator_id: userId,
      topic: input.topic || null,
      context: input.context || null,
      proposed_decision: input.proposed_decision || null,
      decision_text: input.decision_text || null,
      reason: input.reason || null,
      alternatives: input.alternatives || null,
      owner_id: input.owner_id || null,
      project_id: input.project_id || null,
    })
    .select(DECISION_SELECT)
    .single();

  if (decisionError) {
    console.error("Error creating decision:", decisionError);
    return null;
  }

  if (contributor_ids && contributor_ids.length > 0) {
    const contributorInserts = contributor_ids.map((user_id) => ({
      decision_id: decision.id,
      user_id,
    }));

    const { error: contributorError } = await supabase
      .from("decision_contributors")
      .insert(contributorInserts);

    if (contributorError) {
      console.error("Error adding decision contributors:", contributorError);
    }
  }

  if (tag_ids && tag_ids.length > 0) {
    const tagInserts = tag_ids.map((tag_id) => ({
      decision_id: decision.id,
      tag_id,
    }));

    const { error: tagError } = await supabase
      .from("decision_tags")
      .insert(tagInserts);

    if (tagError) {
      console.error("Error adding decision tags:", tagError);
    }
  }

  logActivity({
    supabase,
    action: "create",
    entityType: "decision",
    entityId: decision.id,
    entityName: decision.title,
    userId,
  });

  return mapDecision(decision);
}

export async function updateDecision(
  supabase: SupabaseClient,
  decisionId: string,
  input: Partial<CreateDecisionInput>
): Promise<Decision | null> {
  const update: Record<string, unknown> = {};
  if (input.title !== undefined) update.title = input.title;
  if (input.topic !== undefined) update.topic = input.topic || null;
  if (input.context !== undefined) update.context = input.context || null;
  if (input.proposed_decision !== undefined)
    update.proposed_decision = input.proposed_decision || null;
  if (input.decision_text !== undefined)
    update.decision_text = input.decision_text || null;
  if (input.reason !== undefined) update.reason = input.reason || null;
  if (input.alternatives !== undefined)
    update.alternatives = input.alternatives || null;
  if (input.owner_id !== undefined) update.owner_id = input.owner_id || null;
  if (input.project_id !== undefined) update.project_id = input.project_id || null;
  if (input.status_id !== undefined) update.status_id = input.status_id;

  const { data, error } = await supabase
    .from("decisions")
    .update(update)
    .eq("id", decisionId)
    .select(DECISION_SELECT)
    .single();

  if (error) {
    console.error("Error updating decision:", error);
    return null;
  }

  logActivity({
    supabase,
    action: "update",
    entityType: "decision",
    entityId: decisionId,
    entityName: data.title,
  });

  return mapDecision(data);
}

export async function archiveDecision(
  supabase: SupabaseClient,
  decisionId: string
): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("decisions")
    .update({ is_archived: true })
    .eq("id", decisionId);

  if (error) {
    console.error("Error archiving decision:", error);
  }

  logActivity({
    supabase,
    action: "archive",
    entityType: "decision",
    entityId: decisionId,
    entityName: "decision",
    userId: userData.user?.id,
  });
}

export async function fetchAllUsers(
  supabase: SupabaseClient
): Promise<DecisionUser[]> {
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

export async function fetchAllProjects(
  supabase: SupabaseClient
): Promise<{ id: string; name: string }[]> {
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

export async function fetchAllTags(
  supabase: SupabaseClient
): Promise<{ id: string; name: string; color: string }[]> {
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
