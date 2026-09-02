"use client";

import { Task } from "@/types/task";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Download } from "lucide-react";
import { generateICS, downloadICS } from "@/lib/utils/ics";

interface TaskCardProps {
  task: Task;
  onClick: (task: Task) => void;
  onDelete?: (task: Task) => void;
}

function isOverdue(task: Task): boolean {
  if (!task.due_date || task.status_id === "") return false;
  if (task.completed_at) return false;
  return new Date(task.due_date) < new Date();
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.ceil(
    (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays < -1) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays <= 7) return `${diffDays}d left`;
  return date.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
}

export function TaskCard({ task, onClick, onDelete }: TaskCardProps) {
  const overdue = isOverdue(task);
  const statusName = task.status?.name || "Unknown";
  const statusColor = task.status?.color || "#9CA3AF";
  const priorityName = task.priority?.name || "Unknown";
  const priorityColor = task.priority?.color || "#9CA3AF";

  const handleExportTaskICS = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!task.due_date) return;
    const icsContent = generateICS([
      {
        title: task.title,
        start: task.due_date + "T09:00:00",
        end: task.due_date + "T10:00:00",
        description: task.description || undefined,
        id: task.id,
      },
    ]);
    downloadICS(icsContent, `task-${task.id}.ics`);
  };

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
            <Badge color={priorityColor}>{priorityName}</Badge>
            <Badge color={statusColor}>{statusName}</Badge>
          </div>
          <h3 className="mb-1 text-sm font-medium text-gray-900 dark:text-white">
            {task.title}
          </h3>
          {task.description && (
            <p className="mb-2 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
              {task.description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
            {task.owner && (
              <span className="flex items-center gap-1">
                <User size={12} />
                {task.owner.name}
              </span>
            )}
            {task.due_date && (
              <span
                className={`flex items-center gap-1 ${
                  overdue ? "font-medium text-red-500 dark:text-red-400" : ""
                }`}
              >
                <Calendar size={12} />
                {formatDate(task.due_date)}
                <button
                  onClick={handleExportTaskICS}
                  className="ml-1 rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
                  title="Export to calendar"
                >
                  <Download size={12} />
                </button>
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
