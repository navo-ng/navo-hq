export function tasksToCSV(tasks: Record<string, unknown>[]): string {
  if (tasks.length === 0) return "";
  const headers = ["Title", "Description", "Status", "Priority", "Assignee", "Project", "Due Date", "Created", "Completed"];
  const rows = tasks.map((t) => [
    escapeCSV(t.title as string),
    escapeCSV((t.description as string) || ""),
    escapeCSV(((t.status as Record<string, unknown>)?.name as string) || ""),
    escapeCSV(((t.priority as Record<string, unknown>)?.name as string) || ""),
    escapeCSV(((t.owner as Record<string, unknown>)?.name as string) || "Unassigned"),
    escapeCSV(((t.project as Record<string, unknown>)?.name as string) || ""),
    escapeCSV((t.due_date as string) || ""),
    escapeCSV(t.created_at as string),
    escapeCSV((t.completed_at as string) || ""),
  ]);
  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

function escapeCSV(val: string): string {
  if (!val) return '""';
  const v = val.replace(/"/g, '""');
  return v.includes(",") || v.includes("\n") || v.includes('"') ? `"${v}"` : v;
}

export function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
