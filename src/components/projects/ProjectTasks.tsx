"use client";

import { Badge } from "@/components/ui/badge";
import { Calendar, User } from "lucide-react";

interface ProjectTask {
  id: string;
  title: string;
  status_id: string;
  priority_id: string;
  owner_id: string | null;
  due_date: string | null;
  completed_at: string | null;
  status: { id: string; name: string; color: string } | null;
  priority: { id: string; name: string; color: string } | null;
  owner: { id: string; name: string; avatar_url: string | null } | null;
}

interface ProjectTasksProps {
  tasks: ProjectTask[];
  onAddTask?: () => void;
}

export function ProjectTasks({ tasks, onAddTask }: ProjectTasksProps) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Tasks
        </h3>
        {onAddTask && (
          <button
            onClick={onAddTask}
            className="text-xs font-medium text-navo-blue hover:underline"
          >
            + Add task
          </button>
        )}
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50/50 p-8 text-center dark:border-gray-700 dark:bg-gray-800/30">
          <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
            No tasks yet
          </p>
          {onAddTask && (
            <button
              onClick={onAddTask}
              className="text-xs font-medium text-navo-blue hover:underline"
            >
              Add your first task
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between rounded-lg border border-gray-100 p-3 dark:border-gray-800"
            >
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  {task.priority && (
                    <Badge color={task.priority.color}>
                      {task.priority.name}
                    </Badge>
                  )}
                  {task.status && (
                    <Badge color={task.status.color}>{task.status.name}</Badge>
                  )}
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {task.title}
                </p>
                <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                  {task.owner && (
                    <span className="flex items-center gap-1">
                      <User size={12} />
                      {task.owner.name}
                    </span>
                  )}
                  {task.due_date && (
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
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
