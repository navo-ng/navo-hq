"use client";

import { AlertTriangle, User } from "lucide-react";
import { Task, TaskStatusConfig } from "@/types/task";

interface OverdueTasksProps {
  tasks: Task[];
  statuses: TaskStatusConfig[];
}

export default function OverdueTasks({ tasks, statuses }: OverdueTasksProps) {
  const doneId = statuses.find((s) => s.name === "Done")?.id || "";
  const now = new Date();

  const overdue = tasks
    .filter(
      (t) =>
        t.due_date && new Date(t.due_date) < now && t.status_id !== doneId
    )
    .slice(0, 5);

  if (overdue.length === 0) return null;

  return (
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
  );
}
