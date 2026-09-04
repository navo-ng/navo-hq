"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Project } from "@/types/project";

export default function ProjectProgressList({
  projects,
  isLoading = false,
}: {
  projects: Project[];
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <div className="h-5 w-32 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-3 w-16 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-gray-100 p-3 dark:border-gray-800"
            >
              <div className="flex items-center justify-between">
                <div className="h-3.5 w-32 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-4 w-14 rounded-full bg-gray-200 dark:bg-gray-700" />
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between">
                  <div className="h-2.5 w-16 rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="h-2.5 w-6 rounded bg-gray-200 dark:bg-gray-700" />
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const activeProjects = projects
    .filter((p) => p.status?.name?.toLowerCase() === "active" || p.task_stats)
    .slice(0, 6);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Project Progress
        </h2>
        <Link
          href="/projects"
          className="flex items-center gap-1 text-xs font-medium text-navo-blue hover:underline"
        >
          View all <ArrowRight size={12} />
        </Link>
      </div>
      {activeProjects.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No active projects
          </p>
          <Link
            href="/projects"
            className="mt-2 inline-block text-xs font-medium text-navo-blue hover:underline"
          >
            View projects →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {activeProjects.map((project) => {
            const stats = project.task_stats;
            const hasTasks = stats && stats.total > 0;
            const done = stats?.done || 0;
            const total = stats?.total || 0;
            const pct = hasTasks ? Math.round((done / total) * 100) : 0;

            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="block rounded-lg border border-gray-100 dark:border-gray-800 p-3 transition-colors hover:border-gray-200 dark:border-gray-800 dark:hover:border-gray-700"
              >
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {project.name}
                  </p>
                  {project.status && (
                    <span
                      className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                      style={{
                        backgroundColor: `${project.status.color}20`,
                        color: project.status.color,
                      }}
                    >
                      {project.status.name}
                    </span>
                  )}
                </div>
                {hasTasks ? (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>
                        {done}/{total} tasks
                      </span>
                      <span>{pct}%</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <div
                        className="h-full rounded-full bg-navo-green transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="mt-1 text-xs text-gray-400">No tasks</p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
