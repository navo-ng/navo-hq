"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskFilters, QuickFilter } from "@/components/tasks/TaskFilters";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { TaskDetailDrawer } from "@/components/tasks/TaskDetailDrawer";
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
} from "@/lib/data/tasks";
import { TaskUser, TaskProject, TaskTag } from "@/types/task";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [statuses, setStatuses] = useState<TaskStatusConfig[]>([]);
  const [priorities, setPriorities] = useState<TaskPriorityConfig[]>([]);
  const [users, setUsers] = useState<TaskUser[]>([]);
  const [projects, setProjects] = useState<TaskProject[]>([]);
  const [tags, setTags] = useState<TaskTag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;
    async function load() {
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
    }
    load();
    return () => { cancelled = true; };
  }, [supabase]);

  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    switch (quickFilter) {
      case "my_tasks":
        // Will be filtered by current user when auth is wired
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
  }, [tasks, quickFilter, statusFilter, priorityFilter, searchQuery, statuses]);

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
        <Button onClick={() => setCreateDialogOpen(true)} className="shrink-0">
          <Plus size={16} />
          New Task
        </Button>
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

      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {searchQuery || statusFilter !== "all" || priorityFilter !== "all"
                ? "No tasks match your filters."
                : "No tasks yet. Create your first task to get started."}
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={handleTaskClick} />
          ))
        )}
      </div>

      <CreateTaskDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onCreate={handleCreateTask}
        users={users}
        projects={projects}
        tags={tags}
        statuses={statuses}
        priorities={priorities}
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
        statuses={statuses}
        users={users}
      />
    </div>
  );
}
