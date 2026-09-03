"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/hooks/useToast";
import { MESSAGES } from "@/lib/utils/messages";
import { createClient } from "@/lib/supabase/client";
import { createTask, fetchTaskStatuses, fetchTaskPriorities } from "@/lib/data/tasks";
import { SubTask } from "@/lib/utils/task-breakdown";
import { Loader2, Sparkles } from "lucide-react";

interface TaskBreakdownDialogProps {
  open: boolean;
  onClose: () => void;
  projectId?: string;
}

export function TaskBreakdownDialog({ open, onClose, projectId }: TaskBreakdownDialogProps) {
  const [goal, setGoal] = useState("");
  const [context, setContext] = useState("");
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const { showToast } = useToast();

  const handleBreakdown = async () => {
    if (!goal.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ai/task-breakdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: goal.trim(), context: context.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSubtasks(data.subtasks);
      setSelected(new Set(data.subtasks.map((_: SubTask, i: number) => i)));
    } catch {
      showToast({ title: MESSAGES.AI_BREAKDOWN_ERROR, type: "error" });
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
      for (const idx of selected) {
        const st = subtasks[idx];
        if (!st) continue;

        const priorityMap: Record<string, typeof highPriority> = {
          high: highPriority,
          medium: mediumPriority,
          low: lowPriority,
        };
        const priority = priorityMap[st.priority] || mediumPriority;

        const task = await createTask(supabase, {
          title: st.title,
          description: st.description,
          status_id: todoStatus?.id || "",
          priority_id: priority?.id || "",
          project_id: projectId || undefined,
        });
        if (task) created++;
      }

      showToast({ title: MESSAGES.TASKS_CREATED_FROM_BREAKDOWN.replace("{count}", String(created)), type: "success" });
      handleClose();
    } catch {
      showToast({ title: MESSAGES.AI_BREAKDOWN_ERROR, type: "error" });
    } finally {
      setCreating(false);
    }
  };

  const toggle = (idx: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleClose = () => {
    setGoal("");
    setContext("");
    setSubtasks([]);
    setSelected(new Set());
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} title="AI Task Breakdown" maxWidth="lg">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Describe your goal or task
          </label>
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g. Launch the new onboarding flow for beta users"
            rows={3}
            className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-navo-blue focus:outline-none focus:ring-1 focus:ring-navo-blue dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Any additional context? <span className="text-gray-400">(optional)</span>
          </label>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="e.g. We have 2 weeks, team of 3 engineers, existing auth system..."
            rows={2}
            className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-navo-blue focus:outline-none focus:ring-1 focus:ring-navo-blue dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>

        {subtasks.length === 0 && (
          <div className="flex justify-end">
            <Button onClick={handleBreakdown} disabled={!goal.trim() || loading}>
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Sparkles size={16} />
              )}
              Break it down
            </Button>
          </div>
        )}

        {subtasks.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Suggested subtasks ({selected.size} selected)
            </p>
            <div className="max-h-80 overflow-y-auto space-y-2">
              {subtasks.map((st, idx) => {
                const priorityColors: Record<string, string> = {
                  high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                  low: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
                };
                return (
                  <label
                    key={idx}
                    className={`flex items-start gap-3 rounded-lg border p-3 transition-colors cursor-pointer ${
                      selected.has(idx)
                        ? "border-navo-blue bg-navo-blue/5"
                        : "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(idx)}
                      onChange={() => toggle(idx)}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-navo-blue focus:ring-navo-blue"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{st.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{st.description}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorityColors[st.priority]}`}>
                          {st.priority}
                        </span>
                        <span className="text-xs text-gray-400">{st.estimated_hours}h estimated</span>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-gray-200 dark:border-gray-800">
              <Button variant="secondary" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleCreateTasks} disabled={selected.size === 0 || creating}>
                {creating ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : null}
                Create {selected.size} task{selected.size !== 1 ? "s" : ""}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}
