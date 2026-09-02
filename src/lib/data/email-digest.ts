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
