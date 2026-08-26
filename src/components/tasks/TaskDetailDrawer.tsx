"use client";

import { Drawer } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Task, getStatusConfig, getPriorityConfig } from "@/types/task";
import { Calendar, User, Folder, Tag, MessageSquare, Activity } from "lucide-react";

interface TaskDetailDrawerProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-NG", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function isOverdue(task: Task): boolean {
  if (!task.due_date || task.status_id === "done") return false;
  return new Date(task.due_date) < new Date();
}

export function TaskDetailDrawer({ task, open, onClose }: TaskDetailDrawerProps) {
  if (!task) return null;

  const status = getStatusConfig(task.status_id);
  const priority = getPriorityConfig(task.priority_id);
  const overdue = isOverdue(task);

  return (
    <Drawer open={open} onClose={onClose} title="Task Details">
      <div className="space-y-6">
        <div>
          <div className="mb-2 flex flex-wrap gap-2">
            <Badge color={priority.color}>{priority.name}</Badge>
            <Badge color={status.color}>{status.name}</Badge>
            {overdue && <Badge color="#EF4444">Overdue</Badge>}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {task.title}
          </h3>
        </div>

        {task.description && (
          <div>
            <h4 className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {task.description}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <User size={14} className="text-gray-400" />
              <span className="text-gray-500">Assignee:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {task.owner?.name || "Unassigned"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Folder size={14} className="text-gray-400" />
              <span className="text-gray-500">Project:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {task.project?.name || "None"}
              </span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Calendar size={14} className="text-gray-400" />
              <span className="text-gray-500">Due:</span>
              <span
                className={`font-medium ${
                  overdue ? "text-red-500" : "text-gray-900 dark:text-white"
                }`}
              >
                {task.due_date ? formatDate(task.due_date) : "No due date"}
              </span>
            </div>
            {task.completed_at && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar size={14} className="text-emerald-400" />
                <span className="text-gray-500">Completed:</span>
                <span className="font-medium text-emerald-600">
                  {formatDate(task.completed_at)}
                </span>
              </div>
            )}
          </div>
        </div>

        {task.tags && task.tags.length > 0 && (
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Tag size={14} />
              Tags
            </div>
            <div className="flex flex-wrap gap-2">
              {task.tags.map((tag) => (
                <Badge key={tag.id} color={tag.color}>
                  {tag.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-gray-200 pt-4 dark:border-gray-800">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <Activity size={14} />
            Activity
          </div>
          <div className="rounded-lg bg-gray-50 p-4 text-center text-sm text-gray-400 dark:bg-gray-800/50">
            Activity will appear here once the database is connected.
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4 dark:border-gray-800">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <MessageSquare size={14} />
            Comments
          </div>
          <div className="rounded-lg bg-gray-50 p-4 text-center text-sm text-gray-400 dark:bg-gray-800/50">
            Comments will appear here once the database is connected.
          </div>
        </div>
      </div>
    </Drawer>
  );
}
