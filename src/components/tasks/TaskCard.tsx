"use client";

import { Task, getStatusConfig, getPriorityConfig } from "@/types/task";
import { Badge } from "@/components/ui/badge";
import { Calendar, User } from "lucide-react";

interface TaskCardProps {
  task: Task;
  onClick: (task: Task) => void;
}

function isOverdue(task: Task): boolean {
  if (!task.due_date || task.status_id === "done") return false;
  return new Date(task.due_date) < new Date();
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays < -1) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays <= 7) return `${diffDays}d left`;
  return date.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const status = getStatusConfig(task.status_id);
  const priority = getPriorityConfig(task.priority_id);
  const overdue = isOverdue(task);

  return (
    <button
      onClick={() => onClick(task)}
      className={`w-full rounded-xl border bg-white p-4 text-left transition-all hover:shadow-md dark:bg-gray-900 ${
        overdue
          ? "border-red-200 hover:border-red-300 dark:border-red-900"
          : "border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-center gap-2">
            <Badge color={priority.color}>{priority.name}</Badge>
            <Badge color={status.color}>{status.name}</Badge>
          </div>
          <h3 className="mb-1 text-sm font-medium text-gray-900 dark:text-white">
            {task.title}
          </h3>
          {task.description && (
            <p className="mb-2 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
              {task.description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
            {task.owner && (
              <span className="flex items-center gap-1">
                <User size={12} />
                {task.owner.name}
              </span>
            )}
            {task.due_date && (
              <span
                className={`flex items-center gap-1 ${
                  overdue ? "font-medium text-red-500" : ""
                }`}
              >
                <Calendar size={12} />
                {formatDate(task.due_date)}
              </span>
            )}
            {task.project && (
              <span className="rounded bg-gray-100 px-1.5 py-0.5 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                {task.project.name}
              </span>
            )}
          </div>
        </div>
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-col gap-1">
            {task.tags.slice(0, 2).map((tag) => (
              <Badge key={tag.id} color={tag.color}>
                {tag.name}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}
