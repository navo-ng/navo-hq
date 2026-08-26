"use client";

import { Search, X } from "lucide-react";
import { Select } from "@/components/ui/select";
import { DocumentStatusConfig } from "@/types/document";

interface DocumentFiltersProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: string;
  onStatusFilterChange: (s: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (c: string) => void;
  sort: string;
  onSortChange: (s: string) => void;
  statuses: DocumentStatusConfig[];
  categories: string[];
}

export function DocumentFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  sort,
  onSortChange,
  statuses,
  categories,
}: DocumentFiltersProps) {
  const hasFilters =
    searchQuery || statusFilter !== "all" || categoryFilter !== "all";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-navo-blue focus:outline-none focus:ring-1 focus:ring-navo-blue dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          options={[
            { value: "all", label: "All Statuses" },
            ...statuses.map((s) => ({ value: s.id, label: s.name })),
          ]}
        />
        <Select
          value={categoryFilter}
          onChange={(e) => onCategoryFilterChange(e.target.value)}
          options={[
            { value: "all", label: "All Categories" },
            ...categories.map((c) => ({ value: c, label: c })),
          ]}
        />
        <Select
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          options={[
            { value: "newest", label: "Newest" },
            { value: "oldest", label: "Oldest" },
            { value: "title", label: "Title A-Z" },
            { value: "most_versions", label: "Most Versions" },
          ]}
        />
        {hasFilters && (
          <button
            onClick={() => {
              onSearchChange("");
              onStatusFilterChange("all");
              onCategoryFilterChange("all");
            }}
            className="whitespace-nowrap text-xs font-medium text-navo-blue hover:underline"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
