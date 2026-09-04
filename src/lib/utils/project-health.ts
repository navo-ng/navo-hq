import type { Project } from "@/types/project";

export function computeProjectHealth(project: Project): "green" | "yellow" | "red" {
  const stats = project.task_stats;
  const now = new Date();

  if (!stats || stats.total === 0) return "green";

  const completionRate = stats.done / stats.total;
  const overdueRate = stats.overdue / stats.total;

  if (project.target_date) {
    const deadline = new Date(project.target_date);
    const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilDeadline < 0 && completionRate < 1) return "red";
    if (daysUntilDeadline <= 7 && completionRate < 0.75) return "yellow";
    if (overdueRate > 0.5) return "red";
  }

  if (overdueRate > 0.5) return "red";
  if (completionRate < 0.25) return "yellow";

  return "green";
}

export const HEALTH_CONFIG = {
  green: { label: "On Track", bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
  yellow: { label: "At Risk", bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400", dot: "bg-amber-500" },
  red: { label: "Off Track", bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", dot: "bg-red-500" },
} as const;
