"use client";

import { Project } from "@/types/project";

const STATUS_COLORS: Record<string, string> = {
  Planning: "#9CA3AF",
  Active: "#0064F0",
  "On Hold": "#F59E0B",
  Completed: "#32C85A",
  Archived: "#6B7280",
};

interface StatusGroup {
  name: string;
  color: string;
  count: number;
}

export default function ProjectStatusChart({ projects }: { projects: Project[] }) {
  const grouped = new Map<string, { color: string; count: number }>();

  for (const project of projects) {
    const name = project.status?.name || "Unknown";
    const color = project.status?.color || STATUS_COLORS[name] || "#9CA3AF";
    const entry = grouped.get(name);
    if (entry) {
      entry.count++;
    } else {
      grouped.set(name, { color, count: 1 });
    }
  }

  const groups: StatusGroup[] = Array.from(grouped.entries())
    .map(([name, { color, count }]) => ({ name, color, count }))
    .sort((a, b) => b.count - a.count);

  const total = projects.length;

  if (total === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Projects by Status
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No projects to display.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
        Projects by Status
      </h2>
      <div className="space-y-3">
        {groups.map((group) => {
          const pct = Math.round((group.count / total) * 100);
          return (
            <div key={group.name}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: group.color }}
                  />
                  {group.name}
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  {group.count}
                  <span className="ml-1 text-xs">({pct}%)</span>
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: group.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
