import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("user");
  if (!userId) {
    return NextResponse.json({ error: "user parameter required" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: doneStatus } = await supabase
    .from("task_statuses")
    .select("id")
    .eq("name", "Done")
    .single();

  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, description, due_date")
    .eq("owner_id", userId)
    .eq("is_archived", false)
    .neq("status_id", doneStatus?.id || "")
    .not("due_date", "is", null);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//NAVO HQ//Tasks//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:NAVO HQ Tasks",
  ];

  for (const task of tasks || []) {
    const date = (task.due_date as string).replace(/-/g, "");
    lines.push(
      "BEGIN:VEVENT",
      `UID:${task.id}@navo-hq`,
      `DTSTART;VALUE=DATE:${date}`,
      `DTEND;VALUE=DATE:${date}`,
      `SUMMARY:${(task.title as string).replace(/[,:]/g, "\\$&")}`,
      task.description
        ? `DESCRIPTION:${(task.description as string).replace(/\n/g, "\\n").slice(0, 200)}`
        : "",
      "STATUS:CONFIRMED",
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");

  return new NextResponse(lines.filter(Boolean).join("\r\n"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="navo-tasks.ics"',
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
