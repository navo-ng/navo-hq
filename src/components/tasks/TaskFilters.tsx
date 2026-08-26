"use client";

import { TaskStatusConfig, TaskPriorityConfig } from "@/types/task";
import { Search, Filter, X } from "lucide-react";

export type QuickFilter = "all" | "my_tasks" | "overdue" | "due_today" | "completed";

interface TaskFiltersProps {
  quickFilter: QuickFilter;
  onQuickFilterChange: (filter: QuickFilter) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  priorityFilter: string;
  onPriorityFilterChange: (priority: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statuses: TaskStatusConfig[];
  priorities: TaskPriorityConfig[];
}

const QUICK_FILTERS: { id: QuickFilter; label: string }[] = [
  { id: "all", label: "All Tasks" },
  { id: "my_tasks", label: "My Tasks" },
  { id: "overdue", label: "Overdue" },
  { id: "due_today", label: "Due Today" },
  { id: "completed", label: "Completed" },
];

export function TaskFilters({
  quickFilter,
  onQuickFilterChange,
  statusFilter,
  onStatusFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  searchQuery,
  onSearchChange,
  statuses,
  priorities,
}: TaskFiltersProps) {
  const hasActiveFilters =
    statusFilter !== "all" || priorityFilter !== "all" || searchQuery.length > 0;

  const clearFilters = () => {
    onStatusFilterChange("all");
    onPriorityFilterChange("all");
    onSearchChange("");
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {QUICK_FILTERS.map((filter) => (
          <button
            key={filter.id}
            onClick={() => onQuickFilterChange(filter.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              quickFilter === filter.id
                ? "bg-navo-blue text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-1.5 pl-8 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-navo-blue focus:outline-none focus:ring-1 focus:ring-navo-blue dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 focus:border-navo-blue focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
          >
            <option value="all">All Status</option>
            {statuses.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => onPriorityFilterChange(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 focus:border-navo-blue focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
          >
            <option value="all">All Priority</option>
            {priorities.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={12} />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
