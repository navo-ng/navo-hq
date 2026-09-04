"use client";

import { useState, useEffect } from "react";
import { Drawer } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Task, TaskUser, TaskProject, TaskTag, TaskStatusConfig, TaskPriorityConfig } from "@/types/task";
import { Calendar, User, Folder, Tag, Activity, MessageSquare, Check, ShieldAlert, Trash2, Pencil, Clock, Paperclip, ListChecks, Link2, Moon } from "lucide-react";
import { CommentThread } from "@/components/comments/CommentThread";
import { TaskActivityTimeline } from "./TaskActivityTimeline";
import { TaskDependencySection } from "./TaskDependencySection";
import { TimeTracker } from "./TimeTracker";
import { AttachmentSection } from "./AttachmentSection";
import { DeleteTaskDialog } from "./DeleteTaskDialog";
import { EditTaskDialog } from "./EditTaskDialog";
import { ChecklistSection } from "./ChecklistSection";
import { TaskLinksSection } from "./TaskLinksSection";
import { createClient } from "@/lib/supabase/client";
import { updateTaskOwner, fetchUsers, fetchProjects, fetchTags, fetchTaskStatuses, fetchTaskPriorities, updateTask } from "@/lib/data/tasks";
import { logActivity } from "@/lib/data/log-activity";
import { createNotification } from "@/lib/data/create-notification";
import { useToast } from "@/lib/hooks/useToast";
import { MESSAGES } from "@/lib/utils/messages";

interface TaskDetailDrawerProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onStatusChange?: (taskId: string, statusId: string) => void;
  onDeleted?: () => void;
  onUpdated?: () => void;
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
  onUpdated,
  statuses,
  users = [],
}: TaskDetailDrawerProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<TaskUser[]>([]);
  const [allProjects, setAllProjects] = useState<TaskProject[]>([]);
  const [allTags, setAllTags] = useState<TaskTag[]>([]);
  const [allStatuses, setAllStatuses] = useState<TaskStatusConfig[]>([]);
  const [allPriorities, setAllPriorities] = useState<TaskPriorityConfig[]>([]);
  const { showToast } = useToast();
  const supabase = createClient();
  const [ownerOverride, setOwnerOverride] = useState<string | null>(null);
  const [snoozeOpen, setSnoozeOpen] = useState(false);
  const [snoozedUntil, setSnoozedUntil] = useState<string | null>(task?.snoozed_until ?? null);
  const localTask = task ? { ...task, owner_id: ownerOverride ?? task.owner_id, snoozed_until: snoozedUntil } : null;

  useEffect(() => {
    if (!open) return;
    Promise.all([
      fetchUsers(supabase),
      fetchProjects(supabase),
      fetchTags(supabase),
      fetchTaskStatuses(supabase),
      fetchTaskPriorities(supabase),
    ]).then(([u, p, t, s, pr]) => {
      setAllUsers(u);
      setAllProjects(p);
      setAllTags(t);
      setAllStatuses(s);
      setAllPriorities(pr);
    });
  }, [open, supabase]);

  useEffect(() => {
    if (task) {
      setOwnerOverride(task.owner_id);
      setSnoozedUntil(task.snoozed_until ?? null);
    }
  }, [task]);

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

      const assignedName =
        users.find((u) => u.id === ownerIdValue)?.name || "someone";
      showToast({
        title: MESSAGES.TASK_ASSIGNED.replace("{name}", assignedName),
        type: "success",
      });
    } catch {
      showToast({ title: MESSAGES.NETWORK_ERROR, type: "error" });
    }
  };

  const handleSnooze = async (days: number | null) => {
    const date = days === null
      ? null
      : new Date(Date.now() + days * 86400000).toISOString().split("T")[0];
    await updateTask(supabase, localTask.id, { snoozed_until: date });
    setSnoozedUntil(date);
    setSnoozeOpen(false);
    if (date) {
      showToast({ title: MESSAGES.TASK_SNOOZED.replace("{date}", formatDate(date)), type: "success" });
    } else {
      showToast({ title: MESSAGES.TASK_UNSNOOZED, type: "success" });
    }
  };

  const handleSnoozeCustom = async (dateStr: string) => {
    await updateTask(supabase, localTask.id, { snoozed_until: dateStr });
    setSnoozedUntil(dateStr);
    setSnoozeOpen(false);
    showToast({ title: MESSAGES.TASK_SNOOZED.replace("{date}", formatDate(dateStr)), type: "success" });
  };

  return (
    <Drawer open={open} onClose={onClose} title="Task Details">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditDialogOpen(true)}
            className="text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <Pencil size={14} className="mr-1" />
            Edit
          </Button>
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

        {snoozedUntil && (
          <div className="flex items-center justify-between rounded-lg bg-yellow-50 px-3 py-2 dark:bg-yellow-900/20">
            <div className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-300">
              <Moon size={14} />
              Snoozed until {formatDate(snoozedUntil)}
            </div>
            <button
              onClick={() => handleSnooze(null)}
              className="text-xs font-medium text-yellow-600 hover:text-yellow-800 dark:text-yellow-400"
            >
              Clear
            </button>
          </div>
        )}

        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSnoozeOpen(!snoozeOpen)}
            className="text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <Moon size={14} className="mr-1" />
            {snoozedUntil ? "Reschedule" : "Snooze"}
          </Button>
          {snoozeOpen && (
            <div className="absolute left-0 z-10 mt-1 w-56 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
              <button
                onClick={() => handleSnooze(1)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Tomorrow
              </button>
              <button
                onClick={() => handleSnooze(7)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Next week
              </button>
              <div className="border-t border-gray-100 dark:border-gray-800">
                <div className="px-3 py-2">
                  <label className="mb-1 block text-xs text-gray-500">Custom date</label>
                  <input
                    type="date"
                    onChange={(e) => e.target.value && handleSnoozeCustom(e.target.value)}
                    className="w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>
              {snoozedUntil && (
                <div className="border-t border-gray-100 dark:border-gray-800">
                  <button
                    onClick={() => handleSnooze(null)}
                    className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    Clear snooze
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

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
            <ListChecks size={14} />
            Checklists
          </div>
          <ChecklistSection taskId={localTask.id} />
        </div>

        <div className="border-t border-gray-200 pt-4 dark:border-gray-800">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <Link2 size={14} />
            Related Tasks
          </div>
          <TaskLinksSection taskId={localTask.id} />
        </div>

        <div className="border-t border-gray-200 pt-4 dark:border-gray-800">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <Activity size={14} />
            Activity
          </div>
          <TaskActivityTimeline taskId={localTask.id} />
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
            <Paperclip size={14} />
            Attachments
          </div>
          <AttachmentSection taskId={localTask.id} />
        </div>

        <div className="border-t border-gray-200 pt-4 dark:border-gray-800">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <ShieldAlert size={14} />
            Dependencies
          </div>
          <TaskDependencySection taskId={localTask.id} />
        </div>

        <div className="border-t border-gray-200 pt-4 dark:border-gray-800">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <Clock size={14} />
            Time Tracking
          </div>
          <TimeTracker taskId={localTask.id} />
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

      {localTask && (
        <EditTaskDialog
          task={localTask}
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          onUpdated={() => {
            onUpdated?.();
          }}
          users={allUsers}
          projects={allProjects}
          tags={allTags}
          statuses={allStatuses}
          priorities={allPriorities}
        />
      )}
    </Drawer>
  );
}
