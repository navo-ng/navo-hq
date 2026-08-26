"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  fetchBlockedByTasks,
  fetchBlockingTasks,
  addDependency,
  removeDependency,
} from "@/lib/data/dependencies";
import { TaskSearchSelect } from "./TaskSearchSelect";
import { Badge } from "@/components/ui/badge";
import { X, ShieldAlert } from "lucide-react";

interface TaskDependencySectionProps {
  taskId: string;
  onUpdate?: () => void;
}

interface DependencyTask {
  id: string;
  title: string;
  status: { name: string; color: string } | null;
}

export function TaskDependencySection({
  taskId,
  onUpdate,
}: TaskDependencySectionProps) {
  const [blockedBy, setBlockedBy] = useState<DependencyTask[]>([]);
  const [blocks, setBlocks] = useState<DependencyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingBlockedBy, setAddingBlockedBy] = useState(false);
  const [addingBlocks, setAddingBlocks] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [bb, bl] = await Promise.all([
        fetchBlockedByTasks(supabase, taskId),
        fetchBlockingTasks(supabase, taskId),
      ]);
      if (!cancelled) {
        setBlockedBy(bb);
        setBlocks(bl);
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [supabase, taskId, refreshKey]);

  const refresh = () => setRefreshKey((k) => k + 1);

  const handleAddBlockedBy = async (
    task: { id: string; title: string }
  ) => {
    setAddingBlockedBy(true);
    const optimistic = { id: task.id, title: task.title, status: null };
    setBlockedBy((prev) => [optimistic, ...prev]);
    await addDependency(supabase, taskId, task.id);
    refresh();
    onUpdate?.();
    setAddingBlockedBy(false);
  };

  const handleRemoveBlockedBy = async (blockedById: string) => {
    setBlockedBy((d) => d.filter((t) => t.id !== blockedById));
    await removeDependency(supabase, taskId, blockedById);
    refresh();
    onUpdate?.();
  };

  const handleAddBlocks = async (task: { id: string; title: string }) => {
    setAddingBlocks(true);
    const optimistic = { id: task.id, title: task.title, status: null };
    setBlocks((prev) => [optimistic, ...prev]);
    await addDependency(supabase, task.id, taskId);
    refresh();
    onUpdate?.();
    setAddingBlocks(false);
  };

  const handleRemoveBlocks = async (blockedTaskId: string) => {
    setBlocks((d) => d.filter((t) => t.id !== blockedTaskId));
    await removeDependency(supabase, blockedTaskId, taskId);
    refresh();
    onUpdate?.();
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-12 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
        <div className="h-12 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800 w-3/4" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          <ShieldAlert size={14} />
          Blocked By
        </div>
        {blockedBy.length === 0 && !addingBlockedBy ? (
          <p className="text-xs text-gray-400">No dependencies</p>
        ) : (
          <div className="mb-2 space-y-1.5">
            {blockedBy.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800/50"
              >
                <span className="flex-1 truncate text-sm text-gray-900 dark:text-white">
                  {task.title}
                </span>
                {task.status && (
                  <Badge color={task.status.color}>{task.status.name}</Badge>
                )}
                <button
                  onClick={() => handleRemoveBlockedBy(task.id)}
                  className="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-red-500 dark:hover:bg-gray-700"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
        <TaskSearchSelect
          excludeIds={[taskId, ...blockedBy.map((t) => t.id)]}
          onSelect={handleAddBlockedBy}
          placeholder="Add dependency..."
        />
      </div>

      <div>
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          <ShieldAlert size={14} />
          Blocks
        </div>
        {blocks.length === 0 && !addingBlocks ? (
          <p className="text-xs text-gray-400">No dependencies</p>
        ) : (
          <div className="mb-2 space-y-1.5">
            {blocks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800/50"
              >
                <span className="flex-1 truncate text-sm text-gray-900 dark:text-white">
                  {task.title}
                </span>
                {task.status && (
                  <Badge color={task.status.color}>{task.status.name}</Badge>
                )}
                <button
                  onClick={() => handleRemoveBlocks(task.id)}
                  className="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-red-500 dark:hover:bg-gray-700"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
        <TaskSearchSelect
          excludeIds={[taskId, ...blocks.map((t) => t.id)]}
          onSelect={handleAddBlocks}
          placeholder="Add task to block..."
        />
      </div>
    </div>
  );
}
