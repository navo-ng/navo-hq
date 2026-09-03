"use client";

import { useState, useEffect } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useToast } from "@/lib/hooks/useToast";
import { MESSAGES } from "@/lib/utils/messages";
import { createClient } from "@/lib/supabase/client";
import { createTask, fetchTaskStatuses, fetchTaskPriorities, fetchUsers } from "@/lib/data/tasks";
import { ActionItem } from "@/lib/utils/task-breakdown";
import { TaskUser } from "@/types/task";
import { Loader2, FileText } from "lucide-react";

interface MeetingNotesParserProps {
  open: boolean;
  onClose: () => void;
}

export function MeetingNotesParser({ open, onClose }: MeetingNotesParserProps) {
  const [notes, setNotes] = useState("");
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [editedActions, setEditedActions] = useState<(ActionItem & { selected: boolean; assignee_id: string })[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [users, setUsers] = useState<TaskUser[]>([]);
  const { showToast } = useToast();

  useEffect(() => {
    if (open) {
      const supabase = createClient();
      fetchUsers(supabase).then(setUsers);
    }
  }, [open]);

  const handleExtract = async () => {
    if (!notes.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ai/extract-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notes.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setActions(data.actions);
      setEditedActions(
        data.actions.map((a: ActionItem) => {
          const hint = a.assignee_hint.toLowerCase();
          const matched = users.find(
            (u) => u.name.toLowerCase().includes(hint) || u.email.toLowerCase().includes(hint)
          );
          return { ...a, selected: true, assignee_id: matched?.id || "" };
        })
      );
    } catch {
      showToast({ title: "Failed to extract action items", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTasks = async () => {
    setCreating(true);
    try {
      const supabase = createClient();
      const [statuses, priorities] = await Promise.all([
        fetchTaskStatuses(supabase),
        fetchTaskPriorities(supabase),
      ]);
      const todoStatus = statuses.find((s) => s.name === "To Do");
      const mediumPriority = priorities.find((p) => p.name === "Medium");
      const highPriority = priorities.find((p) => p.name === "High");
      const lowPriority = priorities.find((p) => p.name === "Low");

      let created = 0;
      for (const action of editedActions) {
        if (!action.selected) continue;

        const priorityMap: Record<string, typeof highPriority> = {
          high: highPriority,
          medium: mediumPriority,
          low: lowPriority,
        };
        const priority = priorityMap[action.priority] || mediumPriority;

        const task = await createTask(supabase, {
          title: action.title,
          status_id: todoStatus?.id || "",
          priority_id: priority?.id || "",
          owner_id: action.assignee_id || undefined,
        });
        if (task) created++;
      }

      showToast({ title: MESSAGES.ACTIONS_EXTRACTED.replace("{count}", String(created)), type: "success" });
      handleClose();
    } catch {
      showToast({ title: "Failed to create tasks", type: "error" });
    } finally {
      setCreating(false);
    }
  };

  const updateAction = (idx: number, updates: Partial<(typeof editedActions)[0]>) => {
    setEditedActions((prev) => prev.map((a, i) => (i === idx ? { ...a, ...updates } : a)));
  };

  const handleClose = () => {
    setNotes("");
    setActions([]);
    setEditedActions([]);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} title="Meeting Notes to Action Items" maxWidth="lg">
      <div className="space-y-4">
        {editedActions.length === 0 && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Paste your meeting notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Paste meeting notes, minutes, or transcript here..."
                rows={8}
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-navo-blue focus:outline-none focus:ring-1 focus:ring-navo-blue dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleExtract} disabled={!notes.trim() || loading}>
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <FileText size={16} />
                )}
                Extract Action Items
              </Button>
            </div>
          </>
        )}

        {editedActions.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Extracted action items ({editedActions.filter((a) => a.selected).length} selected)
            </p>
            <div className="max-h-80 overflow-y-auto space-y-2">
              {editedActions.map((action, idx) => {
                const priorityColors: Record<string, string> = {
                  high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                  low: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
                };
                return (
                  <div
                    key={idx}
                    className={`rounded-lg border p-3 transition-colors ${
                      action.selected
                        ? "border-navo-blue bg-navo-blue/5"
                        : "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={action.selected}
                        onChange={() => updateAction(idx, { selected: !action.selected })}
                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-navo-blue focus:ring-navo-blue"
                      />
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={action.title}
                          onChange={(e) => updateAction(idx, { title: e.target.value })}
                          className="block w-full rounded-md border-0 bg-transparent px-0 py-0.5 text-sm font-medium text-gray-900 focus:outline-none focus:ring-0 dark:text-white"
                        />
                        <div className="flex items-center gap-2">
                          <select
                            value={action.priority}
                            onChange={(e) => updateAction(idx, { priority: e.target.value as ActionItem["priority"] })}
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorityColors[action.priority]} border-0 focus:outline-none focus:ring-0`}
                          >
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                          </select>
                          <select
                            value={action.assignee_id}
                            onChange={(e) => updateAction(idx, { assignee_id: e.target.value })}
                            className="rounded-lg border border-gray-300 bg-white px-2 py-0.5 text-xs text-gray-700 focus:border-navo-blue focus:outline-none focus:ring-0 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                          >
                            <option value="">Unassigned</option>
                            {users.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-gray-200 dark:border-gray-800">
              <Button variant="secondary" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleCreateTasks} disabled={editedActions.filter((a) => a.selected).length === 0 || creating}>
                {creating ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : null}
                Create {editedActions.filter((a) => a.selected).length} task{editedActions.filter((a) => a.selected).length !== 1 ? "s" : ""}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}
