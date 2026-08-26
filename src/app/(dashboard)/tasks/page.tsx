"use client";

import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskFilters, QuickFilter } from "@/components/tasks/TaskFilters";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { TaskDetailDrawer } from "@/components/tasks/TaskDetailDrawer";
import { Task, TaskStatus, TaskPriority } from "@/types/task";
import { getMockTasks, getMockUsers, getMockProjects, getMockTags } from "@/lib/mock-data";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(() => getMockTasks());
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);

  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    // Quick filters
    switch (quickFilter) {
      case "my_tasks":
        result = result.filter((t) => t.owner_id === "user-1");
        break;
      case "overdue":
        result = result.filter(
          (t) =>
            t.due_date &&
            new Date(t.due_date) < new Date() &&
            t.status_id !== "done"
        );
        break;
      case "due_today":
        result = result.filter((t) => {
          if (!t.due_date) return false;
          const today = new Date().toISOString().split("T")[0];
          return t.due_date === today;
        });
        break;
      case "completed":
        result = result.filter((t) => t.status_id === "done");
        break;
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((t) => t.status_id === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== "all") {
      result = result.filter((t) => t.priority_id === priorityFilter);
    }

    // Search
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
  }, [tasks, quickFilter, statusFilter, priorityFilter, searchQuery]);

  const stats = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    return {
      total: tasks.length,
      overdue: tasks.filter(
        (t) =>
          t.due_date && new Date(t.due_date) < now && t.status_id !== "done"
      ).length,
      dueToday: tasks.filter((t) => t.due_date === today && t.status_id !== "done")
        .length,
      inProgress: tasks.filter((t) => t.status_id === "in_progress").length,
      completed: tasks.filter((t) => t.status_id === "done").length,
    };
  }, [tasks]);

  const handleCreateTask = (newTask: {
    title: string;
    description: string;
    owner_id: string;
    project_id: string;
    status_id: TaskStatus;
    priority_id: TaskPriority;
    due_date: string;
    tag_ids: string[];
  }) => {
    const users = getMockUsers();
    const projects = getMockProjects();
    const tags = getMockTags();

    const task: Task = {
      id: `task-${Date.now()}`,
      title: newTask.title,
      description: newTask.description || null,
      creator_id: "user-1",
      owner_id: newTask.owner_id || null,
      project_id: newTask.project_id || null,
      status_id: newTask.status_id,
      priority_id: newTask.priority_id,
      start_date: null,
      due_date: newTask.due_date || null,
      completed_at: null,
      is_archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      owner: newTask.owner_id
        ? users.find((u) => u.id === newTask.owner_id) || null
        : null,
      creator: users.find((u) => u.id === "user-1"),
      project: newTask.project_id
        ? projects.find((p) => p.id === newTask.project_id) || null
        : null,
      tags: newTask.tag_ids
        .map((id) => tags.find((t) => t.id === id))
        .filter(Boolean) as Task["tags"],
    };

    setTasks((prev) => [task, ...prev]);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setDetailDrawerOpen(true);
  };

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
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus size={16} />
          New Task
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total", value: stats.total, color: "text-gray-900 dark:text-white" },
          { label: "Overdue", value: stats.overdue, color: "text-red-500" },
          { label: "In Progress", value: stats.inProgress, color: "text-amber-500" },
          { label: "Completed", value: stats.completed, color: "text-emerald-500" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900"
          >
            <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
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
      />

      <TaskDetailDrawer
        task={selectedTask}
        open={detailDrawerOpen}
        onClose={() => {
          setDetailDrawerOpen(false);
          setSelectedTask(null);
        }}
      />
    </div>
  );
}
