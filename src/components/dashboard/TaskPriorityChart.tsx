"use client";

import { Task } from "@/types/task";

const FALLBACK_COLORS: Record<string, string> = {
  Critical: "#EF4444",
  High: "#F97316",
  Medium: "#0064F0",
  Low: "#32C85A",
  Urgent: "#EF4444",
};

interface PriorityGroup {
  name: string;
  color: string;
  count: number;
}

export default function TaskPriorityChart({ tasks }: { tasks: Task[] }) {
  const grouped = new Map<string, { color: string; count: number }>();

  for (const task of tasks) {
    const name = task.priority?.name || "Unknown";
    const color =
      task.priority?.color || FALLBACK_COLORS[name] || "#9CA3AF";
    const entry = grouped.get(name);
    if (entry) {
      entry.count++;
    } else {
      grouped.set(name, { color, count: 1 });
    }
  }

  const groups: PriorityGroup[] = Array.from(grouped.entries())
    .map(([name, { color, count }]) => ({ name, color, count }))
    .sort((a, b) => b.count - a.count);

  const total = tasks.length;

  if (total === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Tasks by Priority
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No tasks to display.
        </p>
      </div>
    );
  }

  const maxCount = Math.max(...groups.map((g) => g.count));

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
        Tasks by Priority
      </h2>
      <div className="space-y-3">
        {groups.map((group) => {
          const pct = Math.round((group.count / total) * 100);
          const barWidth = maxCount > 0 ? (group.count / maxCount) * 100 : 0;
          return (
            <div key={group.name} className="flex items-center gap-3">
              <div className="flex w-20 items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <span
                  className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: group.color }}
                />
                <span className="truncate">{group.name}</span>
              </div>
              <div className="flex-1">
                <div className="h-2.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${barWidth}%`,
                      backgroundColor: group.color,
                    }}
                  />
                </div>
              </div>
              <span className="w-16 text-right text-xs text-gray-500 dark:text-gray-400">
                {group.count} <span className="text-gray-400 dark:text-gray-500">({pct}%)</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
