import { SupabaseClient } from "@supabase/supabase-js";

interface DigestData {
  overdueTasks: { id: string; title: string; due_date: string | null }[];
  dueTodayTasks: { id: string; title: string; due_date: string | null }[];
  dueTomorrowTasks: { id: string; title: string; due_date: string | null }[];
  recentComments: {
    id: string;
    content: string;
    entity_type: string;
    entity_id: string;
    created_at: string;
    user_name: string;
  }[];
  unreadCount: number;
}

async function gatherDigestData(
  supabase: SupabaseClient,
  userId: string
): Promise<DigestData> {
  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  const { data: doneStatus } = await supabase
    .from("task_statuses")
    .select("id")
    .eq("name", "Done")
    .single();

  const doneStatusId = doneStatus?.id || "";

  const [overdueRes, todayRes, tomorrowRes, commentsRes, unreadRes] =
    await Promise.all([
      supabase
        .from("tasks")
        .select("id, title, due_date")
        .eq("owner_id", userId)
        .eq("is_archived", false)
        .neq("status_id", doneStatusId)
        .lt("due_date", today)
        .order("due_date", { ascending: true })
        .limit(10),
      supabase
        .from("tasks")
        .select("id, title, due_date")
        .eq("owner_id", userId)
        .eq("is_archived", false)
        .eq("due_date", today)
        .neq("status_id", doneStatusId)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("tasks")
        .select("id, title, due_date")
        .eq("owner_id", userId)
        .eq("is_archived", false)
        .eq("due_date", tomorrow)
        .neq("status_id", doneStatusId)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("comments")
        .select("id, content, entity_type, entity_id, created_at, user:profiles!comments_user_id_fkey(name)")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_read", false),
    ]);

  const recentComments = (commentsRes.data || [])
    .filter((c: Record<string, unknown>) => {
      const user = c.user as Record<string, unknown> | null;
      return user != null;
    })
    .slice(0, 5)
    .map((c: Record<string, unknown>) => {
      const user = c.user as Record<string, unknown>;
      return {
        id: c.id as string,
        content: c.content as string,
        entity_type: c.entity_type as string,
        entity_id: c.entity_id as string,
        created_at: c.created_at as string,
        user_name: (user.name as string) || "Someone",
      };
    });

  return {
    overdueTasks: (overdueRes.data || []) as { id: string; title: string; due_date: string | null }[],
    dueTodayTasks: (todayRes.data || []) as { id: string; title: string; due_date: string | null }[],
    dueTomorrowTasks: (tomorrowRes.data || []) as { id: string; title: string; due_date: string | null }[],
    recentComments,
    unreadCount: unreadRes.count || 0,
  };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildDigestHtml(
  userName: string,
  data: DigestData,
  baseUrl: string
): string {
  const hasContent =
    data.overdueTasks.length > 0 ||
    data.dueTodayTasks.length > 0 ||
    data.dueTomorrowTasks.length > 0 ||
    data.recentComments.length > 0 ||
    data.unreadCount > 0;

  if (!hasContent) return "";

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const taskRow = (t: { id: string; title: string; due_date: string | null }) =>
    `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">
        <a href="${baseUrl}/tasks?id=${t.id}" style="color:#1a1a1a;text-decoration:none;font-size:14px;">${escapeHtml(t.title)}</a>
        ${t.due_date ? `<span style="color:#999;font-size:12px;margin-left:8px;">${t.due_date}</span>` : ""}
      </td>
    </tr>`;

  const commentRow = (c: {
    id: string;
    content: string;
    entity_type: string;
    entity_id: string;
    created_at: string;
    user_name: string;
  }) =>
    `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">
        <span style="color:#666;font-size:12px;">${escapeHtml(c.user_name)} commented on ${c.entity_type}</span><br/>
        <span style="color:#333;font-size:13px;">"${escapeHtml(c.content.slice(0, 120))}${c.content.length > 120 ? "..." : ""}"</span>
      </td>
    </tr>`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:20px auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:#2563eb;padding:24px;">
      <h1 style="color:#ffffff;margin:0;font-size:20px;">NAVO HQ - Daily Digest</h1>
      <p style="color:#bfdbfe;margin:4px 0 0;font-size:13px;">${today}</p>
    </div>
    <div style="padding:24px;">
      <p style="color:#333;font-size:15px;margin:0 0 20px;">Hi ${escapeHtml(userName)}, here's your daily summary:</p>

      ${data.overdueTasks.length > 0 ? `
      <div style="margin-bottom:20px;">
        <h2 style="color:#dc2626;font-size:14px;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.5px;">Overdue (${data.overdueTasks.length})</h2>
        <table style="width:100%;border-collapse:collapse;background:#fef2f2;border-radius:6px;overflow:hidden;">
          ${data.overdueTasks.map(taskRow).join("")}
        </table>
      </div>` : ""}

      ${data.dueTodayTasks.length > 0 ? `
      <div style="margin-bottom:20px;">
        <h2 style="color:#2563eb;font-size:14px;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.5px;">Due Today (${data.dueTodayTasks.length})</h2>
        <table style="width:100%;border-collapse:collapse;background:#eff6ff;border-radius:6px;overflow:hidden;">
          ${data.dueTodayTasks.map(taskRow).join("")}
        </table>
      </div>` : ""}

      ${data.dueTomorrowTasks.length > 0 ? `
      <div style="margin-bottom:20px;">
        <h2 style="color:#d97706;font-size:14px;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.5px;">Due Tomorrow (${data.dueTomorrowTasks.length})</h2>
        <table style="width:100%;border-collapse:collapse;background:#fffbeb;border-radius:6px;overflow:hidden;">
          ${data.dueTomorrowTasks.map(taskRow).join("")}
        </table>
      </div>` : ""}

      ${data.recentComments.length > 0 ? `
      <div style="margin-bottom:20px;">
        <h2 style="color:#333;font-size:14px;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.5px;">Recent Comments</h2>
        <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:6px;overflow:hidden;">
          ${data.recentComments.map(commentRow).join("")}
        </table>
      </div>` : ""}

      ${data.unreadCount > 0 ? `
      <div style="margin-bottom:20px;padding:12px 16px;background:#f0fdf4;border-radius:6px;border:1px solid #bbf7d0;">
        <span style="color:#166534;font-size:14px;">You have <strong>${data.unreadCount}</strong> unread notification${data.unreadCount === 1 ? "" : "s"}.</span>
      </div>` : ""}

      <div style="text-align:center;margin-top:24px;">
        <a href="${baseUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:500;">Open NAVO HQ</a>
      </div>
    </div>
    <div style="padding:16px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
      <p style="color:#999;font-size:12px;margin:0;">NAVO HQ Daily Digest - Automated</p>
    </div>
  </div>
</body>
</html>`;
}

function buildDigestSubject(data: DigestData): string {
  const parts: string[] = [];
  if (data.overdueTasks.length > 0)
    parts.push(`${data.overdueTasks.length} overdue`);
  if (data.dueTodayTasks.length > 0)
    parts.push(`${data.dueTodayTasks.length} due today`);
  if (data.unreadCount > 0) parts.push(`${data.unreadCount} unread`);

  if (parts.length === 0) return "NAVO HQ - Daily Digest";
  return `NAVO HQ: ${parts.join(", ")}`;
}

export async function buildDailyDigest(
  supabase: SupabaseClient,
  userId: string,
  baseUrl: string
): Promise<{ subject: string; html: string } | null> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", userId)
    .single();

  const userName = profile?.name || "there";
  const data = await gatherDigestData(supabase, userId);

  const hasContent =
    data.overdueTasks.length > 0 ||
    data.dueTodayTasks.length > 0 ||
    data.dueTomorrowTasks.length > 0 ||
    data.recentComments.length > 0 ||
    data.unreadCount > 0;

  if (!hasContent) return null;

  return {
    subject: buildDigestSubject(data),
    html: buildDigestHtml(userName, data, baseUrl),
  };
}

export async function logDigest(
  supabase: SupabaseClient,
  userId: string,
  subject: string,
  html: string
): Promise<void> {
  const { error } = await supabase.from("email_digests").insert({
    user_id: userId,
    subject,
    html,
  });

  if (error) {
    console.error("Error logging digest:", error);
  }
}

export interface WeeklyDigestData {
  completedThisWeek: { id: string; title: string; completed_at: string | null }[];
  overdueTasks: { id: string; title: string; due_date: string | null }[];
  upcomingDue: { id: string; title: string; due_date: string | null }[];
  activeProjects: { name: string; task_count: number; completed_count: number }[];
  teamActivity: { user_name: string; tasks_completed: number; comments: number }[];
}

export async function gatherWeeklyDigestData(
  supabase: SupabaseClient,
  userId: string
): Promise<WeeklyDigestData> {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const today = now.toISOString().split("T")[0];
  const twoWeeksLater = new Date(now.getTime() + 14 * 86400000).toISOString().split("T")[0];

  const { data: doneStatus } = await supabase
    .from("task_statuses")
    .select("id")
    .eq("name", "Done")
    .single();
  const doneStatusId = doneStatus?.id || "";

  const [completedRes, overdueRes, upcomingRes, projectsRes, activityRes] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, title, completed_at")
      .eq("owner_id", userId)
      .eq("status_id", doneStatusId)
      .eq("is_archived", false)
      .gte("completed_at", weekAgo.toISOString())
      .order("completed_at", { ascending: false }),
    supabase
      .from("tasks")
      .select("id, title, due_date")
      .eq("owner_id", userId)
      .eq("is_archived", false)
      .neq("status_id", doneStatusId)
      .lt("due_date", today),
    supabase
      .from("tasks")
      .select("id, title, due_date")
      .eq("owner_id", userId)
      .eq("is_archived", false)
      .neq("status_id", doneStatusId)
      .gte("due_date", today)
      .lte("due_date", twoWeeksLater)
      .order("due_date"),
    supabase
      .from("projects")
      .select("id, name, tasks:tasks(id, status_id)")
      .eq("is_archived", false),
    supabase
      .from("activities")
      .select("user:profiles!activities_user_id_fkey(name), action, entity_type")
      .gte("created_at", weekAgo.toISOString())
      .limit(200),
  ]);

  const activeProjects = (projectsRes.data || [])
    .map((p: Record<string, unknown>) => {
      const tasks = (p.tasks || []) as { status_id: string }[];
      const taskCount = tasks.length;
      const completedCount = tasks.filter((t) => t.status_id === doneStatusId).length;
      return { name: p.name as string, task_count: taskCount, completed_count: completedCount };
    })
    .filter((p) => p.task_count > 0)
    .slice(0, 5);

  const activityByUser: Record<string, { tasks_completed: number; comments: number }> = {};
  for (const a of (activityRes.data || []) as Record<string, unknown>[]) {
    const user = a.user as Record<string, unknown> | null;
    const name = (user?.name as string) || "Unknown";
    if (!activityByUser[name]) activityByUser[name] = { tasks_completed: 0, comments: 0 };
    if (a.action === "completed") activityByUser[name].tasks_completed++;
    if (a.entity_type === "comment") activityByUser[name].comments++;
  }
  const teamActivity = Object.entries(activityByUser)
    .map(([user_name, stats]) => ({ user_name, ...stats }))
    .sort((a, b) => b.tasks_completed - a.tasks_completed)
    .slice(0, 5);

  return {
    completedThisWeek: (completedRes.data || []) as WeeklyDigestData["completedThisWeek"],
    overdueTasks: (overdueRes.data || []) as WeeklyDigestData["overdueTasks"],
    upcomingDue: (upcomingRes.data || []) as WeeklyDigestData["upcomingDue"],
    activeProjects,
    teamActivity,
  };
}

export async function buildWeeklyDigest(
  supabase: SupabaseClient,
  userId: string,
  baseUrl: string
): Promise<{ subject: string; html: string } | null> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", userId)
    .single();

  const userName = profile?.name || "there";
  const data = await gatherWeeklyDigestData(supabase, userId);

  const hasContent =
    data.completedThisWeek.length > 0 ||
    data.overdueTasks.length > 0 ||
    data.upcomingDue.length > 0 ||
    data.activeProjects.length > 0;

  if (!hasContent) return null;

  const weekOf = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const taskRow = (t: { id: string; title: string; due_date?: string | null; completed_at?: string | null }) =>
    `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">
        <a href="${baseUrl}/tasks?id=${t.id}" style="color:#1a1a1a;text-decoration:none;font-size:14px;">${escapeHtml(t.title)}</a>
        ${t.due_date ? `<span style="color:#999;font-size:12px;margin-left:8px;">${t.due_date}</span>` : ""}
      </td>
    </tr>`;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:20px auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:#0B2B63;padding:24px;">
      <h1 style="color:#ffffff;margin:0;font-size:20px;">NAVO HQ - Weekly Report</h1>
      <p style="color:#bfdbfe;margin:4px 0 0;font-size:13px;">Week of ${weekOf}</p>
    </div>
    <div style="padding:24px;">
      <p style="color:#333;font-size:15px;margin:0 0 20px;">Hi ${escapeHtml(userName)}, here's your weekly summary:</p>

      ${data.completedThisWeek.length > 0 ? `
      <div style="margin-bottom:24px;">
        <h2 style="color:#10b981;font-size:14px;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.5px;">Completed This Week (${data.completedThisWeek.length})</h2>
        <table style="width:100%;border-collapse:collapse;background:#f0fdf4;border-radius:6px;overflow:hidden;">
          ${data.completedThisWeek.map(taskRow).join("")}
        </table>
      </div>` : ""}

      ${data.overdueTasks.length > 0 ? `
      <div style="margin-bottom:24px;">
        <h2 style="color:#dc2626;font-size:14px;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.5px;">Overdue (${data.overdueTasks.length})</h2>
        <table style="width:100%;border-collapse:collapse;background:#fef2f2;border-radius:6px;overflow:hidden;">
          ${data.overdueTasks.map(taskRow).join("")}
        </table>
      </div>` : ""}

      ${data.upcomingDue.length > 0 ? `
      <div style="margin-bottom:24px;">
        <h2 style="color:#d97706;font-size:14px;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.5px;">Coming Up (${data.upcomingDue.length})</h2>
        <table style="width:100%;border-collapse:collapse;background:#fffbeb;border-radius:6px;overflow:hidden;">
          ${data.upcomingDue.map(taskRow).join("")}
        </table>
      </div>` : ""}

      ${data.activeProjects.length > 0 ? `
      <div style="margin-bottom:24px;">
        <h2 style="color:#333;font-size:14px;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.5px;">Project Progress</h2>
        ${data.activeProjects.map((p) => {
          const pct = p.task_count > 0 ? Math.round((p.completed_count / p.task_count) * 100) : 0;
          return `<div style="margin-bottom:8px;padding:8px 12px;background:#f9fafb;border-radius:6px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
              <span style="font-size:13px;color:#333;font-weight:500;">${escapeHtml(p.name)}</span>
              <span style="font-size:12px;color:#666;">${p.completed_count}/${p.task_count} (${pct}%)</span>
            </div>
            <div style="height:6px;background:#e5e7eb;border-radius:3px;">
              <div style="height:100%;width:${pct}%;background:#0064F0;border-radius:3px;"></div>
            </div>
          </div>`;
        }).join("")}
      </div>` : ""}

      ${data.teamActivity.length > 0 ? `
      <div style="margin-bottom:24px;">
        <h2 style="color:#333;font-size:14px;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.5px;">Team Activity</h2>
        <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:6px;overflow:hidden;">
          ${data.teamActivity.map((a) =>
            `<tr>
              <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;color:#333;">
                <strong>${escapeHtml(a.user_name)}</strong>
                <span style="color:#666;margin-left:8px;">${a.tasks_completed} completed · ${a.comments} comments</span>
              </td>
            </tr>`
          ).join("")}
        </table>
      </div>` : ""}

      <div style="text-align:center;margin-top:24px;">
        <a href="${baseUrl}" style="display:inline-block;background:#0064F0;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:500;">Open NAVO HQ</a>
      </div>
    </div>
    <div style="padding:16px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
      <p style="color:#999;font-size:12px;margin:0;">NAVO HQ Weekly Report - Automated</p>
    </div>
  </div>
</body>
</html>`;

  return {
    subject: `NAVO HQ Weekly: ${data.completedThisWeek.length} completed, ${data.overdueTasks.length} overdue`,
    html,
  };
}
