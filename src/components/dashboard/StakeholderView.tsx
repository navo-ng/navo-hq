"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, Ban, CheckCircle2 } from "lucide-react";
import { Task, TaskStatusConfig } from "@/types/task";
import { Project } from "@/types/project";
import { ActivityWithUser } from "@/types/activity";
import { computeProjectHealth, HEALTH_CONFIG } from "@/lib/utils/project-health";
import StatCards from "@/components/dashboard/StatCards";
import TaskStatusChart from "@/components/dashboard/TaskStatusChart";
import TaskPriorityChart from "@/components/dashboard/TaskPriorityChart";
import { WorkloadView } from "@/components/dashboard/WorkloadView";
import { ActivityFeed } from "@/components/activity/ActivityFeed";

interface StakeholderViewProps {
  tasks: Task[];
  statuses: TaskStatusConfig[];
  projects: Project[];
  activities: ActivityWithUser[];
  members: { id: string; name: string; avatar_url: string | null }[];
}

function isDone(task: Task, statuses: TaskStatusConfig[]): boolean {
  if (task.completed_at) return true;
  const doneId = statuses.find((s) => s.name.toLowerCase() === "done")?.id;
  return !!doneId && task.status_id === doneId;
}

function isBlocked(task: Task, statuses: TaskStatusConfig[]): boolean {
  const blockedId = statuses.find((s) => s.name.toLowerCase() === "blocked")?.id;
  if (blockedId) return task.status_id === blockedId;
  return task.status?.name?.toLowerCase() === "blocked";
}

export function StakeholderView({ tasks, statuses, projects, activities, members }: StakeholderViewProps) {
  const healthCounts = { green: 0, yellow: 0, red: 0 };
  const rankedProjects = [...projects]
    .map((p) => ({ project: p, health: computeProjectHealth(p) }))
    .sort((a, b) => {
      const rank = { red: 0, yellow: 1, green: 2 };
      return rank[a.health] - rank[b.health];
    });
  rankedProjects.forEach(({ health }) => {
    healthCounts[health] += 1;
  });

  const today = new Date().toISOString().split("T")[0];
  const overdue = tasks.filter(
    (t) => t.due_date && t.due_date < today && !isDone(t, statuses)
  );
  const blocked = tasks.filter((t) => isBlocked(t, statuses) && !isDone(t, statuses));
  const attention = [...overdue.map((t) => ({ task: t, reason: "Overdue" as const })), ...blocked.map((t) => ({ task: t, reason: "Blocked" as const }))].slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {(["green", "yellow", "red"] as const).map((h) => {
          const cfg = HEALTH_CONFIG[h];
          return (
            <div
              key={h}
              className="rounded-xl border border-gray-200 bg-white p-4 text-center dark:border-gray-800 dark:bg-gray-900 sm:p-6"
            >
              <div className={`mx-auto mb-2 h-3 w-3 rounded-full ${cfg.dot}`} />
              <p className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
                {healthCounts[h]}
              </p>
              <p className={`text-xs font-medium sm:text-sm ${cfg.text}`}>{cfg.label}</p>
            </div>
          );
        })}
      </div>

      <StatCards tasks={tasks} statuses={statuses} projects={projects} />

      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Project Health
          </h2>
          <Link
            href="/projects"
            className="flex items-center gap-1 text-xs font-medium text-navo-blue hover:underline"
          >
            View all <ArrowRight size={12} />
          </Link>
        </div>
        {rankedProjects.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
            No projects yet.
          </p>
        ) : (
          <div className="space-y-3">
            {rankedProjects.slice(0, 8).map(({ project, health }) => {
              const cfg = HEALTH_CONFIG[health];
              const stats = project.task_stats;
              const total = stats?.total || 0;
              const done = stats?.done || 0;
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="block rounded-lg border border-gray-100 p-3 transition-colors hover:border-gray-200 dark:border-gray-800 dark:hover:border-gray-700"
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                      {project.name}
                    </p>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${cfg.bg} ${cfg.text}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>
                      {done}/{total} tasks
                    </span>
                    <span>{pct}%</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    <div
                      className={`h-full rounded-full ${cfg.dot}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-6 dark:border-amber-900/40 dark:bg-amber-950/20">
        <div className="mb-4 flex items-center gap-2">
          <AlertTriangle size={18} className="text-amber-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Needs Attention
          </h2>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
            {overdue.length + blocked.length}
          </span>
        </div>
        {attention.length === 0 ? (
          <div className="flex items-center gap-2 py-2 text-sm text-gray-500 dark:text-gray-400">
            <CheckCircle2 size={16} className="text-emerald-500" />
            Nothing overdue or blocked. All clear.
          </div>
        ) : (
          <div className="space-y-2">
            {attention.map(({ task, reason }) => (
              <Link
                key={`${reason}-${task.id}`}
                href={`/tasks?id=${task.id}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-amber-200/60 bg-white px-3 py-2.5 transition-colors hover:border-amber-300 dark:border-amber-900/30 dark:bg-gray-900 dark:hover:border-amber-800"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                    {task.title}
                  </p>
                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                    {task.project?.name || "No project"}
                    {task.due_date ? ` · Due ${task.due_date}` : ""}
                  </p>
                </div>
                <span
                  className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    reason === "Overdue"
                      ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                      : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                  }`}
                >
                  {reason === "Blocked" && <Ban size={11} />}
                  {reason}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TaskStatusChart tasks={tasks} />
        <TaskPriorityChart tasks={tasks} />
      </div>

      <WorkloadView tasks={tasks} members={members} statuses={statuses} />

      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Recent Activity
        </h2>
        <ActivityFeed activities={activities} />
      </div>
    </div>
  );
}
