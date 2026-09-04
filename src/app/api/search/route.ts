import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const { query, limit = 20 } = await req.json();

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ results: [] });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const searchTerm = `%${query.trim()}%`;
  const results: Array<{ type: string; id: string; title: string; subtitle: string; url: string }> = [];

  // Search tasks
  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, description")
    .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
    .eq("is_archived", false)
    .limit(limit);

  if (tasks) {
    for (const t of tasks) {
      results.push({
        type: "task",
        id: t.id,
        title: t.title,
        subtitle: t.description?.slice(0, 80) || "Task",
        url: "/tasks",
      });
    }
  }

  // Search projects
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, description")
    .or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`)
    .eq("is_archived", false)
    .limit(limit);

  if (projects) {
    for (const p of projects) {
      results.push({
        type: "project",
        id: p.id,
        title: p.name,
        subtitle: p.description?.slice(0, 80) || "Project",
        url: `/projects/${p.id}`,
      });
    }
  }

  // Search decisions
  const { data: decisions } = await supabase
    .from("decisions")
    .select("id, title, proposed_decision")
    .or(`title.ilike.${searchTerm},proposed_decision.ilike.${searchTerm}`)
    .eq("is_archived", false)
    .limit(limit);

  if (decisions) {
    for (const d of decisions) {
      results.push({
        type: "decision",
        id: d.id,
        title: d.title,
        subtitle: d.proposed_decision?.slice(0, 80) || "Decision",
        url: `/decisions/${d.id}`,
      });
    }
  }

  // Search documents
  const { data: documents } = await supabase
    .from("documents")
    .select("id, title, description")
    .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
    .eq("is_archived", false)
    .limit(limit);

  if (documents) {
    for (const d of documents) {
      results.push({
        type: "document",
        id: d.id,
        title: d.title,
        subtitle: d.description?.slice(0, 80) || "Document",
        url: `/documents/${d.id}`,
      });
    }
  }

  // Search team members
  const { data: members } = await supabase
    .from("profiles")
    .select("id, name, email")
    .ilike("name", searchTerm)
    .limit(limit);

  if (members) {
    for (const m of members) {
      results.push({
        type: "team",
        id: m.id,
        title: m.name,
        subtitle: m.email || "Team member",
        url: `/team/${m.id}`,
      });
    }
  }

  return NextResponse.json({ results: results.slice(0, limit) });
}
