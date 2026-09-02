"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  CheckSquare,
  FolderKanban,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Calendar,
  User,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { fetchTasks, fetchTaskStatuses } from "@/lib/data/tasks";
import { fetchProjects } from "@/lib/data/projects";
import { fetchActivities } from "@/lib/data/activities";
import { Task, TaskStatusConfig } from "@/types/task";
import { Project } from "@/types/project";
import { ActivityWithUser } from "@/types/activity";
import TaskStatusChart from "@/components/dashboard/TaskStatusChart";
import TaskPriorityChart from "@/components/dashboard/TaskPriorityChart";
import ProjectProgressList from "@/components/dashboard/ProjectProgressList";
import { ActivityFeed } from "@/components/activity/ActivityFeed";
import { ErrorState } from "@/components/ui/error-state";

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [statuses, setStatuses] = useState<TaskStatusConfig[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activities, setActivities] = useState<ActivityWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUserId(user?.id);
        const [taskData, statusData, projectData, activityData] = await Promise.all([
          fetchTasks(supabase),
          fetchTaskStatuses(supabase),
          fetchProjects(supabase),
          fetchActivities(supabase, { limit: 10 }),
        ]);
        setTasks(taskData);
        setStatuses(statusData);
        setProjects(projectData);
        setActivities(activityData);
      } catch {
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [supabase]);

  const getStatusColor = (statusId: string): string => {
    const s = statuses.find((st) => st.id === statusId);
    return s?.color || "#9CA3AF";
  };

  const getStatusName = (statusId: string): string => {
    const s = statuses.find((st) => st.id === statusId);
    return s?.name || "Unknown";
  };

  const getDoneId = (): string => {
    return statuses.find((s) => s.name === "Done")?.id || "";
  };

  if (isLoading) {
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
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">One team. One source of truth.</p>
        </div>
        <ErrorState message={error} onRetry={() => { setError(null); setIsLoading(true); window.location.reload(); }} />
      </div>
    );
  }

  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const doneId = getDoneId();

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

  const myTasks = tasks.filter((t) => t.status_id !== doneId && t.owner_id === userId).slice(0, 4);

  const dueToday = tasks.filter(
    (t) => t.due_date === today && t.status_id !== doneId
  );

  const overdue = tasks
    .filter(
      (t) =>
        t.due_date && new Date(t.due_date) < now && t.status_id !== doneId
    )
    .slice(0, 3);

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
              {myTasks.map((task) => (
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
                          backgroundColor: `${getStatusColor(task.status_id)}20`,
                          color: getStatusColor(task.status_id),
                        }}
                      >
                        {getStatusName(task.status_id)}
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
              ))}
            </div>
          )}
        </div>

        <ProjectProgressList projects={projects} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TaskStatusChart tasks={tasks} />
        <TaskPriorityChart tasks={tasks} />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Activity
          </h2>
          <Link
            href="/activity"
            className="flex items-center gap-1 text-xs font-medium text-navo-blue hover:underline"
          >
            View all <ArrowRight size={12} />
          </Link>
        </div>
        <ActivityFeed activities={activities} />
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
