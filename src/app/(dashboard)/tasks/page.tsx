"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Plus, GripVertical, X, BarChart3, ChevronDown, ChevronRight, Printer, LayoutGrid, List, Sparkles, FileText, Download, Target, CheckSquare, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import TaskStatusChart from "@/components/dashboard/TaskStatusChart";
import TaskPriorityChart from "@/components/dashboard/TaskPriorityChart";
import { TaskCard } from "@/components/tasks/TaskCard";
import { KanbanBoard } from "@/components/tasks/KanbanBoard";
import { TaskFilters, QuickFilter } from "@/components/tasks/TaskFilters";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { TaskDetailDrawer } from "@/components/tasks/TaskDetailDrawer";
import { TaskBreakdownDialog } from "@/components/tasks/TaskBreakdownDialog";
import { ScoreMatrixDialog } from "@/components/tasks/ScoreMatrixDialog";
import { BulkEditDialog } from "@/components/tasks/BulkEditDialog";
import { ImportTasksDialog } from "@/components/tasks/ImportTasksDialog";
import { MeetingNotesParser } from "@/components/meetings/MeetingNotesParser";
import { Task, TaskStatusConfig, TaskPriorityConfig } from "@/types/task";
import { createClient } from "@/lib/supabase/client";
import {
  fetchTasks,
  fetchTaskStatuses,
  fetchTaskPriorities,
  fetchUsers,
  fetchProjects,
  fetchTags,
  createTask,
  updateTaskStatus,
  reorderTasks,
  batchUpdateTasks,
} from "@/lib/data/tasks";
import { TaskUser, TaskProject, TaskTag } from "@/types/task";
import { useRealtimeEntity } from "@/lib/hooks/useRealtimeEntity";
import { ErrorState } from "@/components/ui/error-state";
import { printTaskReport } from "@/lib/utils/pdf-export";
import { tasksToCSV, downloadCSV } from "@/lib/utils/csv-export";
import { useToast } from "@/lib/hooks/useToast";
import { MESSAGES } from "@/lib/utils/messages";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [statuses, setStatuses] = useState<TaskStatusConfig[]>([]);
  const [priorities, setPriorities] = useState<TaskPriorityConfig[]>([]);
  const [users, setUsers] = useState<TaskUser[]>([]);
  const [projects, setProjects] = useState<TaskProject[]>([]);
  const [tags, setTags] = useState<TaskTag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | undefined>();
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const dragNodeRef = useRef<HTMLDivElement | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchStatusId, setBatchStatusId] = useState("");
  const [batchOwnerId, setBatchOwnerId] = useState("");
  const [showCharts, setShowCharts] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [createTaskStatusId, setCreateTaskStatusId] = useState<string | null>(null);
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [meetingNotesOpen, setMeetingNotesOpen] = useState(false);
  const [scoreMatrixOpen, setScoreMatrixOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const { showToast } = useToast();

  const supabase = createClient();

  useEffect(() => {
    const handler = () => setCreateDialogOpen(true);
    document.addEventListener("open-new-task", handler);
    return () => document.removeEventListener("open-new-task", handler);
  }, []);

  const refetchTasks = useCallback(async () => {
    try {
      const data = await fetchTasks(supabase);
      setTasks(data);
      setError(null);
    } catch {
      setError("Failed to load tasks. Please try again.");
    }
  }, [supabase]);

  useRealtimeEntity("tasks", null, () => refetchTasks(), () => refetchTasks(), () => refetchTasks());

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!cancelled) setUserId(user?.id);
        const [taskData, statusData, priorityData, userData, projectData, tagData] =
          await Promise.all([
            fetchTasks(supabase),
            fetchTaskStatuses(supabase),
            fetchTaskPriorities(supabase),
            fetchUsers(supabase),
            fetchProjects(supabase),
            fetchTags(supabase),
          ]);
        if (!cancelled) {
          setTasks(taskData);
          setStatuses(statusData);
          setPriorities(priorityData);
          setUsers(userData);
          setProjects(projectData);
          setTags(tagData);
          setIsLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError("Failed to load tasks. Please try again.");
          setIsLoading(false);
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [supabase]);

  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    switch (quickFilter) {
      case "my_tasks":
        result = result.filter((t) => t.owner_id === userId);
        break;
      case "overdue": {
        const doneId = statuses.find((s) => s.name === "Done")?.id;
        result = result.filter(
          (t) =>
            t.due_date &&
            new Date(t.due_date) < new Date() &&
            t.status_id !== doneId
        );
        break;
      }
      case "due_today": {
        const today = new Date().toISOString().split("T")[0];
        result = result.filter((t) => t.due_date === today);
        break;
      }
      case "completed": {
        const doneId = statuses.find((s) => s.name === "Done")?.id;
        result = result.filter((t) => t.status_id === doneId);
        break;
      }
    }

    if (statusFilter !== "all") {
      result = result.filter((t) => t.status_id === statusFilter);
    }

    if (priorityFilter !== "all") {
      result = result.filter((t) => t.priority_id === priorityFilter);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.owner?.name.toLowerCase().includes(q) ||
          t.project?.name.toLowerCase().includes(q)
      );
    }

    return result;
  }, [tasks, quickFilter, statusFilter, priorityFilter, searchQuery, statuses, userId]);

  const stats = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const doneId = statuses.find((s) => s.name === "Done")?.id;
    const inProgressId = statuses.find((s) => s.name === "In Progress")?.id;
    return {
      total: tasks.length,
      overdue: tasks.filter(
        (t) =>
          t.due_date && new Date(t.due_date) < now && t.status_id !== doneId
      ).length,
      dueToday: tasks.filter(
        (t) => t.due_date === today && t.status_id !== doneId
      ).length,
      inProgress: tasks.filter((t) => t.status_id === inProgressId).length,
      completed: tasks.filter((t) => t.status_id === doneId).length,
    };
  }, [tasks, statuses]);

  const handleCreateTask = async (newTask: {
    title: string;
    description: string;
    owner_id: string;
    project_id: string;
    status_id: string;
    priority_id: string;
    due_date: string;
    tag_ids: string[];
    recurrence: string;
    recurrence_end_date: string;
  }) => {
    const task = await createTask(supabase, {
      title: newTask.title,
      description: newTask.description || undefined,
      owner_id: newTask.owner_id || undefined,
      project_id: newTask.project_id || undefined,
      status_id: newTask.status_id,
      priority_id: newTask.priority_id,
      due_date: newTask.due_date || undefined,
      tag_ids: newTask.tag_ids,
      recurrence: newTask.recurrence || "none",
      recurrence_end_date: newTask.recurrence_end_date || undefined,
    });

    if (task) {
      setTasks((prev) => [task, ...prev]);
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setDetailDrawerOpen(true);
  };

  const handleTaskDeleted = async () => {
    const taskData = await fetchTasks(supabase);
    setTasks(taskData);
  };

  const handleTaskUpdated = async () => {
    const taskData = await fetchTasks(supabase);
    setTasks(taskData);
  };

  const isDragDisabled =
    searchQuery !== "" ||
    statusFilter !== "all" ||
    priorityFilter !== "all" ||
    quickFilter !== "all";

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
    if (isDragDisabled) return;
    setDraggedId(taskId);
    dragNodeRef.current = e.currentTarget;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", taskId);
    setTimeout(() => {
      e.currentTarget.style.opacity = "0.4";
    }, 0);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
    if (isDragDisabled) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (taskId !== draggedId) {
      setOverId(taskId);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropId: string) => {
    e.preventDefault();
    if (isDragDisabled || !draggedId || draggedId === dropId) {
      setDraggedId(null);
      setOverId(null);
      return;
    }

    const currentTasks = [...filteredTasks];
    const draggedIndex = currentTasks.findIndex((t) => t.id === draggedId);
    const dropIndex = currentTasks.findIndex((t) => t.id === dropId);

    if (draggedIndex === -1 || dropIndex === -1) return;

    const [draggedTask] = currentTasks.splice(draggedIndex, 1);
    currentTasks.splice(dropIndex, 0, draggedTask);

    setTasks((prev) => {
      const newTasks = [...prev];
      currentTasks.forEach((task, idx) => {
        const pos = newTasks.findIndex((t) => t.id === task.id);
        if (pos !== -1) {
          newTasks[pos] = { ...newTasks[pos], sort_order: idx };
        }
      });
      return newTasks.sort((a, b) => a.sort_order - b.sort_order);
    });

    reorderTasks(
      supabase,
      currentTasks.map((t) => t.id)
    );

    setDraggedId(null);
    setOverId(null);
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.style.opacity = "1";
    setDraggedId(null);
    setOverId(null);
    dragNodeRef.current = null;
  };

  const toggleTaskSelection = (taskId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredTasks.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTasks.map((t) => t.id)));
    }
  };

  const handleBatchStatusChange = async (statusId: string) => {
    if (selectedIds.size === 0 || !statusId) return;
    await batchUpdateTasks(supabase, Array.from(selectedIds), { status_id: statusId });
    setSelectedIds(new Set());
    setBatchStatusId("");
    refetchTasks();
  };

  const handleBatchAssign = async (ownerId: string) => {
    if (selectedIds.size === 0 || !ownerId) return;
    await batchUpdateTasks(supabase, Array.from(selectedIds), { owner_id: ownerId });
    setSelectedIds(new Set());
    setBatchOwnerId("");
    refetchTasks();
  };

  const handleBatchArchive = async () => {
    if (selectedIds.size === 0) return;
    await batchUpdateTasks(supabase, Array.from(selectedIds), { is_archived: true });
    setSelectedIds(new Set());
    refetchTasks();
  };

  const handleStatusChange = async (taskId: string, statusId: string) => {
    await updateTaskStatus(supabase, taskId, statusId);
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const status = statuses.find((s) => s.id === statusId);
        return {
          ...t,
          status_id: statusId,
          status,
          completed_at:
            status?.name === "Done" ? new Date().toISOString() : null,
        };
      })
    );
  };

  const handleExportCSV = () => {
    const csv = tasksToCSV(filteredTasks as unknown as Record<string, unknown>[]);
    const date = new Date().toISOString().split("T")[0];
    downloadCSV(csv, `navo-tasks-${date}.csv`);
    showToast({ title: MESSAGES.CSV_EXPORTED, type: "success" });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Tasks
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Track and manage all team tasks
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900"
            />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tasks</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Track and manage all team tasks</p>
        </div>
        <ErrorState message={error} onRetry={() => { setError(null); setIsLoading(true); refetchTasks().finally(() => setIsLoading(false)); }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Tasks
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Track and manage all team tasks
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="secondary" onClick={() => printTaskReport(filteredTasks)}>
            <Printer size={16} />
            Print
          </Button>
          <Button variant="secondary" onClick={handleExportCSV}>
            <Download size={16} />
            Export CSV
          </Button>
          <Button variant="secondary" onClick={() => setImportOpen(true)}>
            <Upload size={16} />
            Import CSV
          </Button>
          <div className="flex rounded-lg border border-gray-300 dark:border-gray-700">
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === "list"
                  ? "bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              <List size={14} />
              List
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === "kanban"
                  ? "bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              <LayoutGrid size={14} />
              Board
            </button>
          </div>
          <Button variant="secondary" onClick={() => setMeetingNotesOpen(true)}>
            <FileText size={16} />
            Meeting Notes
          </Button>
          <Button variant="secondary" onClick={() => setBreakdownOpen(true)}>
            <Sparkles size={16} />
            Break Down
          </Button>
          <Button variant="secondary" onClick={() => setScoreMatrixOpen(true)}>
            <Target size={16} />
            Score Matrix
          </Button>
          <Button onClick={() => { setCreateTaskStatusId(null); setCreateDialogOpen(true); }}>
            <Plus size={16} />
            New Task
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: "Total",
            value: stats.total,
            color: "text-gray-900 dark:text-white",
          },
          { label: "Overdue", value: stats.overdue, color: "text-red-500" },
          {
            label: "In Progress",
            value: stats.inProgress,
            color: "text-amber-500",
          },
          {
            label: "Completed",
            value: stats.completed,
            color: "text-emerald-500",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900"
          >
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {stat.label}
            </p>
            <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <button
          onClick={() => setShowCharts(!showCharts)}
          className="flex w-full items-center justify-between p-4 text-left"
        >
          <span className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
            <BarChart3 size={16} />
            Charts
          </span>
          {showCharts ? <ChevronDown size={16} className="text-gray-500" /> : <ChevronRight size={16} className="text-gray-500" />}
        </button>
        {showCharts && (
          <div className="grid grid-cols-1 gap-4 border-t border-gray-200 p-4 dark:border-gray-800 sm:grid-cols-2">
            <TaskStatusChart tasks={filteredTasks} />
            <TaskPriorityChart tasks={filteredTasks} />
          </div>
        )}
      </div>

      <TaskFilters
        quickFilter={quickFilter}
        onQuickFilterChange={setQuickFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={setPriorityFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statuses={statuses}
        priorities={priorities}
      />

      {viewMode === "list" ? (
        <>
          {filteredTasks.length > 0 && !isDragDisabled && (
            <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2 dark:border-gray-800 dark:bg-gray-900">
              <input
                type="checkbox"
                checked={selectedIds.size === filteredTasks.length && filteredTasks.length > 0}
                onChange={toggleSelectAll}
                className="h-4 w-4 rounded border-gray-300 text-navo-blue focus:ring-navo-blue"
              />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {selectedIds.size === 0
                  ? `Select all (${filteredTasks.length})`
                  : `${selectedIds.size} of ${filteredTasks.length} selected`}
              </span>
            </div>
          )}

          <div className="space-y-3">
            {filteredTasks.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center dark:border-gray-800 dark:bg-gray-900">
                {searchQuery || statusFilter !== "all" || priorityFilter !== "all" ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No tasks match your filters.
                  </p>
                ) : (
                  <>
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-navo-light dark:bg-navo-blue/10">
                      <CheckSquare size={24} className="text-navo-blue" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                      No tasks yet
                    </h3>
                    <p className="mb-6 mx-auto max-w-sm text-sm text-gray-500 dark:text-gray-400">
                      Tasks help you track and manage all your team's work. Create one to get started.
                    </p>
                    <button
                      onClick={() => { setCreateTaskStatusId(null); setCreateDialogOpen(true); }}
                      className="inline-flex items-center gap-2 rounded-lg bg-navo-blue px-4 py-2 text-sm font-medium text-white hover:bg-navo-deep transition-colors"
                    >
                      <Plus size={16} />
                      Create your first task
                    </button>
                  </>
                )}
              </div>
            ) : (
              filteredTasks.map((task) => (
                <div
                  key={task.id}
                  draggable={!isDragDisabled}
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onDragOver={(e) => handleDragOver(e, task.id)}
                  onDrop={(e) => handleDrop(e, task.id)}
                  onDragEnd={handleDragEnd}
                  className={`transition-all ${
                    draggedId === task.id ? "opacity-40" : ""
                  } ${overId === task.id && draggedId !== task.id ? "border-2 border-navo-blue rounded-xl" : ""}`}
                >
                  <div className="flex items-center gap-1">
                    {!isDragDisabled && (
                      <>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(task.id)}
                          onChange={() => toggleTaskSelection(task.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="h-4 w-4 shrink-0 rounded border-gray-300 text-navo-blue focus:ring-navo-blue"
                        />
                        <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 shrink-0">
                          <GripVertical size={16} />
                        </div>
                      </>
                    )}
                    <div className="flex-1 min-w-0">
                      <TaskCard task={task} onClick={handleTaskClick} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <KanbanBoard
          tasks={filteredTasks}
          statuses={statuses}
          onTaskClick={handleTaskClick}
          onTaskMoved={refetchTasks}
          onCreateTask={(statusId) => {
            setCreateTaskStatusId(statusId);
            setCreateDialogOpen(true);
          }}
        />
      )}

      <CreateTaskDialog
        open={createDialogOpen}
        onClose={() => { setCreateDialogOpen(false); setCreateTaskStatusId(null); }}
        onCreate={handleCreateTask}
        users={users}
        projects={projects}
        tags={tags}
        statuses={statuses}
        priorities={priorities}
        initialStatusId={createTaskStatusId || undefined}
      />

      <TaskDetailDrawer
        task={selectedTask}
        open={detailDrawerOpen}
        onClose={() => {
          setDetailDrawerOpen(false);
          setSelectedTask(null);
        }}
        onStatusChange={handleStatusChange}
        onDeleted={handleTaskDeleted}
        onUpdated={handleTaskUpdated}
        statuses={statuses}
        users={users}
      />

      <TaskBreakdownDialog
        open={breakdownOpen}
        onClose={() => setBreakdownOpen(false)}
      />

      <MeetingNotesParser
        open={meetingNotesOpen}
        onClose={() => setMeetingNotesOpen(false)}
      />

      <ScoreMatrixDialog
        open={scoreMatrixOpen}
        onClose={() => setScoreMatrixOpen(false)}
        tasks={filteredTasks}
        onTaskClick={handleTaskClick}
      />

      <ImportTasksDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={() => window.location.reload()}
      />

      <BulkEditDialog
        open={bulkEditOpen}
        onClose={() => setBulkEditOpen(false)}
        taskIds={Array.from(selectedIds)}
        onUpdated={() => {
          setSelectedIds(new Set());
          refetchTasks();
        }}
      />

      {selectedIds.size > 0 && (
        <div className="fixed bottom-20 left-1/2 z-40 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 rounded-xl border border-gray-200 bg-white p-3 shadow-xl dark:border-gray-800 dark:bg-gray-900 sm:bottom-6 sm:w-auto sm:max-w-none">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <span className="whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
              {selectedIds.size} task{selectedIds.size !== 1 ? "s" : ""} selected
            </span>
            <select
              value={batchStatusId}
              onChange={(e) => {
                setBatchStatusId(e.target.value);
                if (e.target.value) handleBatchStatusChange(e.target.value);
              }}
              className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-navo-blue focus:outline-none focus:ring-1 focus:ring-navo-blue dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Change status</option>
              {statuses.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <select
              value={batchOwnerId}
              onChange={(e) => {
                setBatchOwnerId(e.target.value);
                if (e.target.value) handleBatchAssign(e.target.value);
              }}
              className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-navo-blue focus:outline-none focus:ring-1 focus:ring-navo-blue dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Assign to</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
            <Button variant="secondary" size="sm" onClick={() => setBulkEditOpen(true)}>
              Edit
            </Button>
            <Button variant="danger" size="sm" onClick={handleBatchArchive}>
              Archive
            </Button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
