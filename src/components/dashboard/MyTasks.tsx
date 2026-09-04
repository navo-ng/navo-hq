"use client";

import Link from "next/link";
import { ArrowRight, Calendar } from "lucide-react";
import { Task, TaskStatusConfig } from "@/types/task";

interface MyTasksProps {
  tasks: Task[];
  statuses: TaskStatusConfig[];
  userId?: string;
}

export default function MyTasks({ tasks, statuses, userId }: MyTasksProps) {
  const doneId = statuses.find((s) => s.name === "Done")?.id || "";

  const getStatusColor = (statusId: string): string => {
    const s = statuses.find((st) => st.id === statusId);
    return s?.color || "#9CA3AF";
  };

  const getStatusName = (statusId: string): string => {
    const s = statuses.find((st) => st.id === statusId);
    return s?.name || "Unknown";
  };

  const myTasks = tasks
    .filter((t) => t.status_id !== doneId && t.owner_id === userId)
    .slice(0, 4);

  return (
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
          No tasks assigned to you yet.
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
  );
}
