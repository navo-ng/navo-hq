"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  fetchBlockedByTasks,
  fetchBlockingTasks,
  addDependency,
  removeDependency,
} from "@/lib/data/dependencies";
import { TaskSearchSelect } from "./TaskSearchSelect";
import { Badge } from "@/components/ui/badge";
import { X, ShieldAlert, Link2, ArrowRight } from "lucide-react";

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
  const [viewMode, setViewMode] = useState<"list" | "graph">("list");
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

  const chainNodes = useMemo(() => {
    const nodes: DependencyTask[] = [];
    blockedBy.forEach((t) => {
      if (!nodes.find((n) => n.id === t.id)) nodes.push(t);
    });
    nodes.push({ id: taskId, title: "This Task", status: null });
    blocks.forEach((t) => {
      if (!nodes.find((n) => n.id === t.id)) nodes.push(t);
    });
    return nodes;
  }, [blockedBy, blocks, taskId]);

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
    if (!confirm("Remove this dependency?")) return;
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
    if (!confirm("Remove this dependency?")) return;
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

  const hasDeps = blockedBy.length > 0 || blocks.length > 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setViewMode("list")}
          className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
            viewMode === "list"
              ? "bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          List
        </button>
        <button
          onClick={() => setViewMode("graph")}
          className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
            viewMode === "graph"
              ? "bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          Graph
        </button>
      </div>

      {viewMode === "graph" && hasDeps && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/30">
          <div className="flex items-center gap-1 min-w-max">
            {chainNodes.map((node, idx) => {
              const isCurrent = node.id === taskId;
              return (
                <div key={node.id} className="flex items-center gap-1">
                  <div
                    className={`relative rounded-lg border px-3 py-2 text-xs font-medium ${
                      isCurrent
                        ? "border-navo-blue bg-navo-blue/10 text-navo-blue ring-1 ring-navo-blue/30"
                        : "border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                    }`}
                  >
                    <div className="max-w-[140px] truncate">{node.title}</div>
                    {node.status && (
                      <div className="mt-1">
                        <Badge color={node.status.color}>
                          {node.status.name}
                        </Badge>
                      </div>
                    )}
                  </div>
                  {idx < chainNodes.length - 1 && (
                    <div className="flex items-center text-gray-400">
                      <div className="h-px w-4 bg-gray-300 dark:bg-gray-600" />
                      <ArrowRight size={14} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {viewMode === "list" && (
        <div className="space-y-5">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400">
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
                    className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50/50 px-3 py-2 dark:border-red-900/30 dark:bg-red-900/10"
                  >
                    <Link2 size={14} className="shrink-0 text-red-400" />
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
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-orange-600 dark:text-orange-400">
              <ShieldAlert size={14} />
              Blocking
            </div>
            {blocks.length === 0 && !addingBlocks ? (
              <p className="text-xs text-gray-400">No dependencies</p>
            ) : (
              <div className="mb-2 space-y-1.5">
                {blocks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-2 rounded-lg border border-orange-100 bg-orange-50/50 px-3 py-2 dark:border-orange-900/30 dark:bg-orange-900/10"
                  >
                    <Link2 size={14} className="shrink-0 text-orange-400" />
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
      )}
    </div>
  );
}
