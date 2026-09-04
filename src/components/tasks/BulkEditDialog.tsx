"use client";

import { useState, useEffect } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { fetchAllUsers } from "@/lib/data/users";
import { fetchTaskStatuses, fetchTaskPriorities } from "@/lib/data/tasks";

interface BulkEditDialogProps {
  open: boolean;
  onClose: () => void;
  taskIds: string[];
  onUpdated: () => void;
}

export function BulkEditDialog({
  open,
  onClose,
  taskIds,
  onUpdated,
}: BulkEditDialogProps) {
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [statuses, setStatuses] = useState<{ id: string; name: string }[]>([]);
  const [priorities, setPriorities] = useState<{ id: string; name: string }[]>([]);
  const [changeStatus, setChangeStatus] = useState(false);
  const [statusId, setStatusId] = useState("");
  const [changeAssignee, setChangeAssignee] = useState(false);
  const [assigneeId, setAssigneeId] = useState("");
  const [changePriority, setChangePriority] = useState(false);
  const [priorityId, setPriorityId] = useState("");
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!open) return;
    setChangeStatus(false);
    setStatusId("");
    setChangeAssignee(false);
    setAssigneeId("");
    setChangePriority(false);
    setPriorityId("");
    async function load() {
      const [u, s, p] = await Promise.all([
        fetchAllUsers(supabase),
        fetchTaskStatuses(supabase),
        fetchTaskPriorities(supabase),
      ]);
      setUsers(u.map((u) => ({ id: u.id, name: u.name })));
      setStatuses(s);
      setPriorities(p);
    }
    load();
  }, [open, supabase]);

  const handleApply = async () => {
    setSaving(true);
    const updates: Record<string, unknown> = {};
    if (changeStatus && statusId) updates.status_id = statusId;
    if (changeAssignee) updates.owner_id = assigneeId || null;
    if (changePriority && priorityId) updates.priority_id = priorityId;

    if (Object.keys(updates).length === 0) {
      setSaving(false);
      return;
    }

    await supabase.from("tasks").update(updates).in("id", taskIds);
    setSaving(false);
    onUpdated();
    onClose();
  };

  const hasChanges =
    (changeStatus && statusId) || changeAssignee || (changePriority && priorityId);

  return (
    <Dialog open={open} onClose={onClose} title={`Edit ${taskIds.length} Tasks`} maxWidth="md">
      <div className="space-y-4 py-2">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={changeStatus}
            onChange={(e) => setChangeStatus(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-navo-blue focus:ring-navo-blue"
          />
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Change status to
          </label>
          {changeStatus && (
            <select
              value={statusId}
              onChange={(e) => setStatusId(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-navo-blue focus:outline-none focus:ring-1 focus:ring-navo-blue dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Select status</option>
              {statuses.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={changePriority}
            onChange={(e) => setChangePriority(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-navo-blue focus:ring-navo-blue"
          />
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Set priority to
          </label>
          {changePriority && (
            <select
              value={priorityId}
              onChange={(e) => setPriorityId(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-navo-blue focus:outline-none focus:ring-1 focus:ring-navo-blue dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Select priority</option>
              {priorities.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={changeAssignee}
            onChange={(e) => setChangeAssignee(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-navo-blue focus:ring-navo-blue"
          />
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Assign to
          </label>
          {changeAssignee && (
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-navo-blue focus:outline-none focus:ring-1 focus:ring-navo-blue dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleApply} disabled={saving || !hasChanges}>
          {saving ? "Applying..." : "Apply Changes"}
        </Button>
      </div>
    </Dialog>
  );
}
