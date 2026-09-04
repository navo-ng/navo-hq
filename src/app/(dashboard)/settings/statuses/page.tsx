"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, GripVertical, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import {
  fetchStatuses,
  createStatus,
  updateStatus,
  deleteStatus,
  CustomStatus,
} from "@/lib/data/custom-statuses";
import { MESSAGES } from "@/lib/utils/messages";

const STATUS_COLORS = [
  "#EF4444",
  "#F59E0B",
  "#10B981",
  "#0064F0",
  "#8B5CF6",
  "#EC4899",
  "#6B7280",
  "#14B8A6",
  "#F97316",
  "#6366F1",
];

export default function StatusesPage() {
  const [statuses, setStatuses] = useState<CustomStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusName, setStatusName] = useState("");
  const [statusColor, setStatusColor] = useState(STATUS_COLORS[0]);
  const [errors, setErrors] = useState<{ name?: string }>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const data = await fetchStatuses(supabase);
      if (!cancelled) {
        setStatuses(data);
        setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const resetForm = () => {
    setStatusName("");
    setStatusColor(STATUS_COLORS[0]);
    setErrors({});
  };

  const handleCreate = async () => {
    if (!statusName.trim()) {
      setErrors({ name: "Status name is required" });
      return;
    }

    const created = await createStatus(supabase, {
      name: statusName.trim(),
      color: statusColor,
    });

    if (created) {
      setStatuses((prev) => [...prev, created]);
      showToast(MESSAGES.STATUS_CREATED);
    }

    resetForm();
    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    const success = await deleteStatus(supabase, deletingId);
    if (success) {
      setStatuses((prev) => prev.filter((s) => s.id !== deletingId));
      showToast(MESSAGES.STATUS_DELETED);
    } else {
      showToast("Cannot delete status — it may be in use by tasks");
    }
    setDeletingId(null);
  };

  const handleToggleActive = async (status: CustomStatus) => {
    const success = await updateStatus(supabase, status.id, { is_active: !status.is_active });
    if (success) {
      setStatuses((prev) =>
        prev.map((s) =>
          s.id === status.id ? { ...s, is_active: !s.is_active } : s
        )
      );
    }
  };

  const handleMoveUp = async (status: CustomStatus, index: number) => {
    if (index === 0) return;
    const prev = statuses[index - 1];
    const success = await Promise.all([
      updateStatus(supabase, status.id, { position: prev.position }),
      updateStatus(supabase, prev.id, { position: status.position }),
    ]);
    if (success.every(Boolean)) {
      const updated = [...statuses];
      [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
      const reordered = updated.map((s, i) => ({ ...s, position: i }));
      setStatuses(reordered);
    }
  };

  const handleMoveDown = async (status: CustomStatus, index: number) => {
    if (index === statuses.length - 1) return;
    const next = statuses[index + 1];
    const success = await Promise.all([
      updateStatus(supabase, status.id, { position: next.position }),
      updateStatus(supabase, next.id, { position: status.position }),
    ]);
    if (success.every(Boolean)) {
      const updated = [...statuses];
      [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
      const reordered = updated.map((s, i) => ({ ...s, position: i }));
      setStatuses(reordered);
    }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed right-4 top-4 z-50 rounded-lg bg-green-600 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Task Statuses
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Create and manage custom statuses for tasks
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setDialogOpen(true);
          }}
          className="shrink-0"
        >
          <Plus size={16} />
          Add Status
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800"
            />
          ))}
        </div>
      ) : statuses.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No statuses yet. Create your first status.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 w-8" />
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                    Position
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                    Active
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {statuses.map((status, index) => (
                  <tr
                    key={status.id}
                    className="border-b border-gray-100 last:border-0 dark:border-gray-800/50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleMoveUp(status, index)}
                          disabled={index === 0}
                          className="rounded p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        >
                          <GripVertical size={12} className="rotate-180" />
                        </button>
                        <button
                          onClick={() => handleMoveDown(status, index)}
                          disabled={index === statuses.length - 1}
                          className="rounded p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        >
                          <GripVertical size={12} />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full shrink-0"
                          style={{ backgroundColor: status.color }}
                        />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {status.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {status.position}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleActive(status)}
                        className="text-gray-400 hover:text-gray-600"
                        title={status.is_active ? "Deactivate" : "Activate"}
                      >
                        {status.is_active ? (
                          <ToggleRight size={20} className="text-green-500" />
                        ) : (
                          <ToggleLeft size={20} className="text-gray-300" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(status.id)}
                        className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          resetForm();
        }}
        title="Create Status"
      >
        <div className="space-y-4">
          <Input
            label="Status Name"
            placeholder="e.g., In Review, Blocked, Done"
            value={statusName}
            onChange={(e) => {
              setStatusName(e.target.value);
              if (errors.name) setErrors({});
            }}
            error={errors.name}
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {STATUS_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setStatusColor(color)}
                  className={`h-8 w-8 rounded-full transition-transform ${
                    statusColor === color
                      ? "scale-110 ring-2 ring-offset-2 ring-gray-400"
                      : ""
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
            <Button
              variant="secondary"
              onClick={() => {
                setDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create Status</Button>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={!!deletingId}
        onClose={() => setDeletingId(null)}
        title="Delete Status"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Are you sure you want to delete this status? Tasks using this status
            will need to be reassigned.
          </p>
          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
            <Button variant="secondary" onClick={() => setDeletingId(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
