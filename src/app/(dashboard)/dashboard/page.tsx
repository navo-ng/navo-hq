"use client";

import Link from "next/link";
import {
  CheckSquare,
  FolderKanban,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Calendar,
  User,
} from "lucide-react";
import { getMockTasks } from "@/lib/mock-data";
import { getStatusConfig } from "@/types/task";

export default function DashboardPage() {
  const tasks = getMockTasks();

  const now = new Date();
  const today = now.toISOString().split("T")[0];

  const stats = {
    openTasks: tasks.filter((t) => t.status_id !== "done").length,
    activeProjects: 3,
    overdueTasks: tasks.filter(
      (t) => t.due_date && new Date(t.due_date) < now && t.status_id !== "done"
    ).length,
    completedThisWeek: tasks.filter((t) => t.status_id === "done").length,
  };

  const myTasks = tasks
    .filter((t) => t.owner_id === "user-1" && t.status_id !== "done")
    .slice(0, 4);

  const dueToday = tasks.filter(
    (t) => t.due_date === today && t.status_id !== "done"
  );

  const overdue = tasks
    .filter(
      (t) =>
        t.due_date && new Date(t.due_date) < now && t.status_id !== "done"
    )
    .slice(0, 3);

  const statCards = [
    {
      label: "Open Tasks",
      value: stats.openTasks,
      icon: CheckSquare,
      color: "text-navo-blue",
      bg: "bg-navo-light",
    },
    {
      label: "Active Projects",
      value: stats.activeProjects,
      icon: FolderKanban,
      color: "text-navo-deep",
      bg: "bg-blue-50",
    },
    {
      label: "Overdue Tasks",
      value: stats.overdueTasks,
      icon: AlertTriangle,
      color: "text-red-500",
      bg: "bg-red-50",
    },
    {
      label: "Completed This Week",
      value: stats.completedThisWeek,
      icon: CheckCircle,
      color: "text-navo-green",
      bg: "bg-navo-green-light",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          One team. One source of truth.
        </p>
      </div>

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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              My Tasks
            </h2>
            <Link
              href="/tasks"
              className="flex items-center gap-1 text-xs font-medium text-navo-blue hover:underline"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {myTasks.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No tasks assigned to you.
            </p>
          ) : (
            <div className="space-y-3">
              {myTasks.map((task) => {
                const status = getStatusConfig(task.status_id);
                return (
                  <div
                    key={task.id}
                    className="flex items-center justify-between rounded-lg border border-gray-100 p-3 dark:border-gray-800"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {task.title}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                        <span
                          className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                          style={{
                            backgroundColor: `${status.color}20`,
                            color: status.color,
                          }}
                        >
                          {status.name}
                        </span>
                        {task.due_date && (
                          <span className="flex items-center gap-1">
                            <Calendar size={10} />
                            {new Date(task.due_date).toLocaleDateString("en-NG", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Team Activity
            </h2>
            <Link
              href="/activity"
              className="flex items-center gap-1 text-xs font-medium text-navo-blue hover:underline"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-3">
            {[
              { user: "Ayomide", action: "completed", target: "Research driver onboarding flow", time: "2 days ago" },
              { user: "Daniel", action: "created", target: "Set up Supabase database schema", time: "3 days ago" },
              { user: "Widom", action: "updated", target: "Create Instagram content calendar", time: "3 days ago" },
            ].map((activity, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-lg border border-gray-100 p-3 dark:border-gray-800"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-navo-blue/10 text-[10px] font-bold text-navo-blue">
                  {activity.user[0]}
                </div>
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">{activity.user}</span>{" "}
                    {activity.action}{" "}
                    <span className="font-medium">{activity.target}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {(overdue.length > 0 || dueToday.length > 0) && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {overdue.length > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50/50 p-6 dark:border-red-900 dark:bg-red-900/10">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-red-700 dark:text-red-400">
                <AlertTriangle size={18} />
                Overdue
              </h2>
              <div className="space-y-2">
                {overdue.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between rounded-lg bg-white p-3 dark:bg-gray-900"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {task.title}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                        {task.owner && (
                          <span className="flex items-center gap-1">
                            <User size={10} />
                            {task.owner.name}
                          </span>
                        )}
                        <span className="text-red-500">
                          {task.due_date &&
                            new Date(task.due_date).toLocaleDateString("en-NG", {
                              month: "short",
                              day: "numeric",
                            })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {dueToday.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-6 dark:border-amber-900 dark:bg-amber-900/10">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-amber-700 dark:text-amber-400">
                <Calendar size={18} />
                Due Today
              </h2>
              <div className="space-y-2">
                {dueToday.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between rounded-lg bg-white p-3 dark:bg-gray-900"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {task.title}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                        {task.owner && (
                          <span className="flex items-center gap-1">
                            <User size={10} />
                            {task.owner.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
