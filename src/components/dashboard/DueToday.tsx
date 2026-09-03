"use client";

import { Calendar, User } from "lucide-react";
import { Task, TaskStatusConfig } from "@/types/task";

interface DueTodayProps {
  tasks: Task[];
  statuses: TaskStatusConfig[];
}

export default function DueToday({ tasks, statuses }: DueTodayProps) {
  const doneId = statuses.find((s) => s.name === "Done")?.id || "";
  const today = new Date().toISOString().split("T")[0];

  const dueToday = tasks.filter(
    (t) => t.due_date === today && t.status_id !== doneId
  );

  if (dueToday.length === 0) return null;

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
