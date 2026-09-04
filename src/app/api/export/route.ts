import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.replace("Bearer ", "");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: userData } = await supabase.auth.getUser(token);
  if (!userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { format = "json" } = await req.json();

  const [tasksRes, projectsRes, decisionsRes, documentsRes, calendarRes, standupsRes] = await Promise.all([
    supabase.from("tasks").select("*").eq("is_archived", false),
    supabase.from("projects").select("*").eq("is_archived", false),
    supabase.from("decisions").select("*").eq("is_archived", false),
    supabase.from("documents").select("*").eq("is_archived", false),
    supabase.from("calendar_events").select("*").eq("is_archived", false),
    supabase.from("standups").select("*").order("created_at", { ascending: false }),
  ]);

  const exportData = {
    exported_at: new Date().toISOString(),
    tasks: tasksRes.data || [],
    projects: projectsRes.data || [],
    decisions: decisionsRes.data || [],
    documents: documentsRes.data || [],
    calendar_events: calendarRes.data || [],
    standups: standupsRes.data || [],
  };

  if (format === "csv") {
    const headers = ["Title", "Description", "Status", "Priority", "Due Date", "Created At"];
    const rows = exportData.tasks.map(t => [
      `"${(t.title || "").replace(/"/g, '""')}"`,
      `"${(t.description || "").replace(/"/g, '""')}"`,
      t.status_id || "",
      t.priority_id || "",
      t.due_date || "",
      t.created_at || "",
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="navo-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  }

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="navo-export-${new Date().toISOString().split("T")[0]}.json"`,
    },
  });
}
