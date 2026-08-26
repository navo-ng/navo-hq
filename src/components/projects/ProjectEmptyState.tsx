"use client";

import { FolderKanban, Plus } from "lucide-react";

interface ProjectEmptyStateProps {
  onCreateClick: () => void;
}

export function ProjectEmptyState({ onCreateClick }: ProjectEmptyStateProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center dark:border-gray-800 dark:bg-gray-900">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-navo-light dark:bg-navo-blue/10">
        <FolderKanban size={24} className="text-navo-blue" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
        No projects yet
      </h3>
      <p className="mb-6 mx-auto max-w-sm text-sm text-gray-500 dark:text-gray-400">
        Projects help you organize work into meaningful initiatives. Track
        progress, assign team members, and keep everything in one place.
      </p>
      <button
        onClick={onCreateClick}
        className="inline-flex items-center gap-2 rounded-lg bg-navo-blue px-4 py-2 text-sm font-medium text-white hover:bg-navo-deep transition-colors"
      >
        <Plus size={16} />
        Create your first project
      </button>
    </div>
  );
}
