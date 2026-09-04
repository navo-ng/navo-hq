"use client";

import { Calendar, CheckCircle, User } from "lucide-react";
import { Task, TaskStatusConfig } from "@/types/task";

interface DueTodayProps {
  tasks: Task[];
  statuses: TaskStatusConfig[];
  isLoading?: boolean;
}

export default function DueToday({ tasks, statuses, isLoading = false }: DueTodayProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4 flex items-center gap-2">
          <div className="h-5 w-24 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800"
            >
              <div className="h-3.5 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="mt-2 h-3 w-20 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const doneId = statuses.find((s) => s.name === "Done")?.id || "";
  const today = new Date().toISOString().split("T")[0];

  const dueToday = tasks.filter(
    (t) => t.due_date === today && t.status_id !== doneId
  );

  if (dueToday.length === 0) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50/50 p-6 dark:border-green-900 dark:bg-green-900/10">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-green-700 dark:text-green-400">
          <CheckCircle size={18} />
          Nothing due today
        </h2>
      </div>
    );
  }

  return (
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
  );
}
