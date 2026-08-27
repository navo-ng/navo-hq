"use client";

import { useState, useEffect } from "react";
import { Drawer } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Task, TaskStatusConfig, TaskUser } from "@/types/task";
import { ActivityWithUser } from "@/types/activity";
import { Calendar, User, Folder, Tag, Activity, MessageSquare, Check, ShieldAlert, Trash2 } from "lucide-react";
import { CommentThread } from "@/components/comments/CommentThread";
import { TaskDependencySection } from "./TaskDependencySection";
import { DeleteTaskDialog } from "./DeleteTaskDialog";
import { createClient } from "@/lib/supabase/client";
import { updateTaskOwner } from "@/lib/data/tasks";
import { logActivity } from "@/lib/data/log-activity";
import { createNotification } from "@/lib/data/create-notification";
import { fetchActivities } from "@/lib/data/activities";
import { useToast } from "@/lib/hooks/useToast";

interface TaskDetailDrawerProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onStatusChange?: (taskId: string, statusId: string) => void;
  onDeleted?: () => void;
  statuses: TaskStatusConfig[];
  users?: TaskUser[];
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
  if (!task.due_date || task.completed_at) return false;
  return new Date(task.due_date) < new Date();
}

export function TaskDetailDrawer({
  task,
  open,
  onClose,
  onStatusChange,
  onDeleted,
  statuses,
  users = [],
}: TaskDetailDrawerProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activities, setActivities] = useState<ActivityWithUser[]>([]);
  const { showToast } = useToast();
  const supabase = createClient();
  const [ownerOverride, setOwnerOverride] = useState<string | null>(null);
  const localTask = task ? { ...task, owner_id: ownerOverride ?? task.owner_id } : null;

  useEffect(() => {
    if (!task || !open) return;
    let cancelled = false;
    fetchActivities(supabase, {
      entityType: "task",
      entityId: task.id,
      limit: 5,
    }).then((data) => {
      if (!cancelled) setActivities(data);
    });
    return () => { cancelled = true; };
  }, [task, open, supabase]);

  if (!localTask) return null;

  const overdue = isOverdue(localTask);
  const statusName = localTask.status?.name || "Unknown";
  const statusColor = localTask.status?.color || "#9CA3AF";
  const priorityName = localTask.priority?.name || "Unknown";
  const priorityColor = localTask.priority?.color || "#9CA3AF";

  const handleStatusChange = async (newStatusId: string) => {
    if (!onStatusChange || isUpdating) return;
    setIsUpdating(true);
    await onStatusChange(localTask.id, newStatusId);
    setIsUpdating(false);
  };

  const handleOwnerChange = async (newOwnerId: string) => {
    const ownerIdValue = newOwnerId === "" ? null : newOwnerId;
    try {
      await updateTaskOwner(supabase, localTask.id, ownerIdValue);

      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData.user?.id;

      logActivity({
        supabase,
        action: "assign",
        entityType: "task",
        entityId: localTask.id,
        entityName: localTask.title,
        details: { new_owner_id: ownerIdValue },
      });

      if (ownerIdValue && currentUserId && ownerIdValue !== currentUserId) {
        const { data: actorProfile } = await supabase
          .from("profiles")
          .select("name")
          .eq("id", currentUserId)
          .single();
        const actorName = actorProfile?.name || "Someone";
        createNotification({
          supabase,
          userId: ownerIdValue,
          type: "task_assigned",
          title: "Task reassigned",
          message: `${actorName} assigned you '${localTask.title}'`,
          entityType: "task",
          entityId: localTask.id,
        });
      }

      setOwnerOverride(ownerIdValue);

      showToast({ title: "Task reassigned", type: "success" });
    } catch {
      showToast({ title: "Failed to reassign task", type: "error" });
    }
  };

  return (
    <Drawer open={open} onClose={onClose} title="Task Details">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
            className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <Trash2 size={14} />
            Delete
          </Button>
        </div>
        <div>
          <div className="mb-2 flex flex-wrap gap-2">
            <Badge color={priorityColor}>{priorityName}</Badge>
            <Badge color={statusColor}>{statusName}</Badge>
            {overdue && <Badge color="#EF4444">Overdue</Badge>}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {localTask.title}
          </h3>
        </div>

        {localTask.description && (
          <div>
            <h4 className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {localTask.description}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <User size={14} className="text-gray-400" />
              <span className="text-gray-500">Assignee:</span>
              <select
                value={localTask.owner_id || ""}
                onChange={(e) => handleOwnerChange(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm font-medium text-gray-900 focus:border-navo-blue focus:outline-none focus:ring-1 focus:ring-navo-blue dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Folder size={14} className="text-gray-400" />
              <span className="text-gray-500">Project:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {localTask.project?.name || "None"}
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
                {localTask.due_date ? formatDate(localTask.due_date) : "No due date"}
              </span>
            </div>
            {localTask.completed_at && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar size={14} className="text-emerald-400" />
                <span className="text-gray-500">Completed:</span>
                <span className="font-medium text-emerald-600">
                  {formatDate(localTask.completed_at)}
                </span>
              </div>
            )}
          </div>
        </div>

        {localTask.tags && localTask.tags.length > 0 && (
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Tag size={14} />
              Tags
            </div>
            <div className="flex flex-wrap gap-2">
              {localTask.tags.map((tag) => (
                <Badge key={tag.id} color={tag.color}>
                  {tag.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {onStatusChange && (
          <div>
            <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Change Status
            </h4>
            <div className="flex flex-wrap gap-2">
              {statuses.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleStatusChange(s.id)}
                  disabled={isUpdating || s.id === localTask.status_id}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    s.id === localTask.status_id
                      ? "text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                  } disabled:opacity-50`}
                  style={
                    s.id === localTask.status_id
                      ? { backgroundColor: s.color }
                      : undefined
                  }
                >
                  {s.id === localTask.status_id && (
                    <Check size={12} className="mr-1 inline" />
                  )}
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-gray-200 pt-4 dark:border-gray-800">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <Activity size={14} />
            Activity
          </div>
          {activities.length === 0 ? (
            <div className="rounded-lg bg-gray-50 p-4 text-center text-sm text-gray-400 dark:bg-gray-800/50">
              No activity yet.
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((a) => (
                <div key={a.id} className="flex items-start gap-2 text-sm">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                    {a.user?.name?.charAt(0) || "?"}
                  </div>
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {a.user?.name || "Someone"}
                    </span>{" "}
                    <span className="text-gray-500">{a.action}</span>
                    <div className="text-xs text-gray-400">
                      {new Date(a.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 pt-4 dark:border-gray-800">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <MessageSquare size={14} />
            Comments
          </div>
          <CommentThread entityType="task" entityId={localTask.id} />
        </div>

        <div className="border-t border-gray-200 pt-4 dark:border-gray-800">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <ShieldAlert size={14} />
            Dependencies
          </div>
          <TaskDependencySection taskId={localTask.id} />
        </div>
      </div>

      {localTask && (
        <DeleteTaskDialog
          task={localTask}
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onDeleted={() => {
            onDeleted?.();
            onClose();
          }}
        />
      )}
    </Drawer>
  );
}
