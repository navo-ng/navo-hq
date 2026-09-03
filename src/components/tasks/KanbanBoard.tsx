"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { Task, TaskStatusConfig } from "@/types/task";
import { Badge } from "@/components/ui/badge";
import { Calendar, GripVertical, Plus } from "lucide-react";
import { updateTaskStatus } from "@/lib/data/tasks";
import { createClient } from "@/lib/supabase/client";

interface KanbanBoardProps {
  tasks: Task[];
  statuses: TaskStatusConfig[];
  onTaskClick: (task: Task) => void;
  onTaskMoved: () => void;
  onCreateTask?: (statusId: string) => void;
}

function isOverdue(task: Task): boolean {
  if (!task.due_date) return false;
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

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function KanbanCard({
  task,
  onClick,
  onDragStart,
}: {
  task: Task;
  onClick: (task: Task) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, taskId: string) => void;
}) {
  const overdue = isOverdue(task);
  const priorityName = task.priority?.name || "Unknown";
  const priorityColor = task.priority?.color || "#9CA3AF";

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onClick={() => onClick(task)}
      className="group cursor-grab active:cursor-grabbing rounded-lg border border-gray-200 bg-white p-3 transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700"
    >
      <div className="mb-2 flex items-center gap-2">
        <Badge color={priorityColor}>{priorityName}</Badge>
        <GripVertical
          size={14}
          className="ml-auto text-gray-300 opacity-0 transition-opacity group-hover:opacity-100 dark:text-gray-600"
        />
      </div>
      <h4 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">
        {task.title}
      </h4>
      <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
        <div className="flex items-center gap-2">
          {task.owner && (
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-medium text-white"
              style={{
                backgroundColor: task.owner.avatar_url ? undefined : "#6366f1",
              }}
            >
              {task.owner.avatar_url ? (
                <img
                  src={task.owner.avatar_url}
                  alt={task.owner.name}
                  className="h-6 w-6 rounded-full object-cover"
                />
              ) : (
                getInitials(task.owner.name)
              )}
            </span>
          )}
        </div>
        {task.due_date && (
          <span
            className={`flex items-center gap-1 ${
              overdue
                ? "font-medium text-red-500 dark:text-red-400"
                : ""
            }`}
          >
            <Calendar size={12} />
            {formatDate(task.due_date)}
          </span>
        )}
      </div>
    </div>
  );
}

export function KanbanBoard({
  tasks,
  statuses,
  onTaskClick,
  onTaskMoved,
  onCreateTask,
}: KanbanBoardProps) {
  const [overStatusId, setOverStatusId] = useState<string | null>(null);
  const dragNodeRef = useRef<HTMLDivElement | null>(null);
  const supabase = createClient();

  const tasksByStatus = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    statuses.forEach((s) => {
      grouped[s.id] = [];
    });
    tasks.forEach((task) => {
      if (grouped[task.status_id]) {
        grouped[task.status_id].push(task);
      }
    });
    return grouped;
  }, [tasks, statuses]);

  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
      dragNodeRef.current = e.currentTarget;
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", taskId);
      requestAnimationFrame(() => {
        e.currentTarget.style.opacity = "0.4";
      });
    },
    []
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>, statusId: string) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setOverStatusId(statusId);
    },
    []
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent<HTMLDivElement>, statusId: string) => {
      if (overStatusId === statusId) {
        setOverStatusId(null);
      }
    },
    [overStatusId]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>, statusId: string) => {
      e.preventDefault();
      const taskId = e.dataTransfer.getData("text/plain");
      if (!taskId) {
        setOverStatusId(null);
        return;
      }

      const task = tasks.find((t) => t.id === taskId);
      if (!task || task.status_id === statusId) {
        setOverStatusId(null);
        return;
      }

      await updateTaskStatus(supabase, taskId, statusId);
      setOverStatusId(null);
      onTaskMoved();
    },
    [tasks, supabase, onTaskMoved]
  );

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {statuses.map((status) => {
        const columnTasks = tasksByStatus[status.id] || [];
        const isOver = overStatusId === status.id;

        return (
          <div
            key={status.id}
            onDragOver={(e) => handleDragOver(e, status.id)}
            onDragLeave={(e) => handleDragLeave(e, status.id)}
            onDrop={(e) => handleDrop(e, status.id)}
            className={`flex min-w-[280px] flex-1 flex-col rounded-xl bg-gray-50 transition-colors dark:bg-gray-800/50 ${
              isOver ? "ring-2 ring-blue-500/50" : ""
            }`}
          >
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: status.color }}
                />
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {status.name}
                </h3>
                <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                  {columnTasks.length}
                </span>
              </div>
              {onCreateTask && (
                <button
                  onClick={() => onCreateTask(status.id)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                  title={`Add task to ${status.name}`}
                >
                  <Plus size={16} />
                </button>
              )}
            </div>

            <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-3 pb-3">
              {columnTasks.length === 0 ? (
                <div className="flex flex-1 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 py-8 text-xs text-gray-400 dark:border-gray-700 dark:text-gray-600">
                  Drop tasks here
                </div>
              ) : (
                columnTasks.map((task) => (
                  <KanbanCard
                    key={task.id}
                    task={task}
                    onClick={onTaskClick}
                    onDragStart={handleDragStart}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
