"use client";

import { CheckSquare, FolderKanban, AlertTriangle, CheckCircle } from "lucide-react";
import { Task, TaskStatusConfig } from "@/types/task";
import { Project } from "@/types/project";

interface StatCardsProps {
  tasks: Task[];
  statuses: TaskStatusConfig[];
  projects: Project[];
}

export default function StatCards({ tasks, statuses, projects }: StatCardsProps) {
  const now = new Date();
  const doneId = statuses.find((s) => s.name === "Done")?.id || "";

  const stats = {
    openTasks: tasks.filter((t) => t.status_id !== doneId).length,
    activeProjects: projects.filter(
      (p) => p.status?.name?.toLowerCase() === "active"
    ).length,
    overdueTasks: tasks.filter(
      (t) => t.due_date && new Date(t.due_date) < now && t.status_id !== doneId
    ).length,
    completedThisWeek: tasks.filter((t) => {
      if (t.status_id !== doneId || !t.completed_at) return false;
      const completed = new Date(t.completed_at);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return completed >= sevenDaysAgo;
    }).length,
  };

  const statCards = [
    {
      label: "Open Tasks",
      value: stats.openTasks,
      icon: CheckSquare,
      color: "text-navo-blue",
      bg: "bg-navo-light dark:bg-navo-blue/10",
    },
    {
      label: "Active Projects",
      value: stats.activeProjects,
      icon: FolderKanban,
      color: "text-navo-deep",
      bg: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      label: "Overdue Tasks",
      value: stats.overdueTasks,
      icon: AlertTriangle,
      color: "text-red-500",
      bg: "bg-red-50 dark:bg-red-900/20",
    },
    {
      label: "Completed This Week",
      value: stats.completedThisWeek,
      icon: CheckCircle,
      color: "text-navo-green",
      bg: "bg-navo-green-light dark:bg-emerald-900/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {statCards.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {stat.label}
              </p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                {stat.value}
              </p>
            </div>
            <div className={`rounded-lg p-2 ${stat.bg}`}>
              <stat.icon size={20} className={stat.color} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
