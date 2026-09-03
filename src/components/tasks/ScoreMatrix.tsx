"use client";

import { Task } from "@/types/task";

interface ScoreMatrixProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

const QUADRANT_CONFIG = [
  {
    label: "Fill-ins",
    bg: "bg-yellow-50 dark:bg-yellow-950/30",
    border: "border-yellow-200 dark:border-yellow-800",
    textColor: "text-yellow-700 dark:text-yellow-400",
  },
  {
    label: "Major Projects",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800",
    textColor: "text-blue-700 dark:text-blue-400",
  },
  {
    label: "Thankless Tasks",
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-800",
    textColor: "text-red-700 dark:text-red-400",
  },
  {
    label: "Quick Wins",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-800",
    textColor: "text-emerald-700 dark:text-emerald-400",
  },
];

function getQuadrant(effort: number, impact: number): typeof QUADRANT_CONFIG[number] {
  // Effort: 1-2 = low, 3-5 = high
  // Impact: 1-2 = low, 3-5 = high
  const isHighImpact = impact >= 3;
  const isHighEffort = effort >= 3;

  if (!isHighImpact && !isHighEffort) return QUADRANT_CONFIG[0]; // Fill-ins (low impact, low effort)
  if (isHighImpact && !isHighEffort) return QUADRANT_CONFIG[3]; // Quick Wins (high impact, low effort)
  if (!isHighImpact && isHighEffort) return QUADRANT_CONFIG[2]; // Thankless Tasks (low impact, high effort)
  return QUADRANT_CONFIG[1]; // Major Projects (high impact, high effort)
}

export function ScoreMatrix({ tasks, onTaskClick }: ScoreMatrixProps) {
  const grid: (Task[] | null)[][] = Array.from({ length: 5 }, () =>
    Array.from({ length: 5 }, () => null)
  );

  tasks.forEach((task) => {
    const impact = task.impact_score ?? 3;
    const effort = task.effort_score ?? 3;
    if (!grid[5 - impact][effort - 1]) {
      grid[5 - impact][effort - 1] = [];
    }
    grid[5 - impact][effort - 1]!.push(task);
  });

  const quadrantLabels = [
    { row: 0, col: 0, label: "Fill-ins" },
    { row: 0, col: 3, label: "Major Projects" },
    { row: 3, col: 0, label: "Thankless Tasks" },
    { row: 3, col: 3, label: "Quick Wins" },
  ];

  return (
    <div className="space-y-3">
      <div className="text-center">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Impact &rarr;
        </p>
      </div>
      <div className="grid grid-cols-[auto_1fr_1fr_1fr_1fr_1fr] gap-0">
        <div className="flex items-center justify-center pr-2">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 -rotate-90 whitespace-nowrap">
            Effort &rarr;
          </span>
        </div>
        {grid.map((row, rowIdx) =>
          row.map((cell, colIdx) => {
            const effort = colIdx + 1;
            const impact = 5 - rowIdx;
            const q = getQuadrant(effort, impact);
            const cellTasks = cell || [];
            return (
              <div
                key={`${rowIdx}-${colIdx}`}
                className={`relative min-h-[80px] border ${q.border} ${q.bg} p-1.5 transition-colors`}
              >
                {rowIdx === 0 && colIdx === 0 && (
                  <span className={`absolute top-1 left-1 text-[10px] font-bold ${q.textColor}`}>
                    Fill-ins
                  </span>
                )}
                {rowIdx === 0 && colIdx === 4 && (
                  <span className={`absolute top-1 right-1 text-[10px] font-bold ${q.textColor}`}>
                    Major Projects
                  </span>
                )}
                {rowIdx === 4 && colIdx === 0 && (
                  <span className={`absolute bottom-1 left-1 text-[10px] font-bold ${q.textColor}`}>
                    Thankless Tasks
                  </span>
                )}
                {rowIdx === 4 && colIdx === 4 && (
                  <span className={`absolute bottom-1 right-1 text-[10px] font-bold ${q.textColor}`}>
                    Quick Wins
                  </span>
                )}
                <div className="flex flex-wrap gap-1 pt-3">
                  {cellTasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => onTaskClick(task)}
                      className="group relative flex h-5 w-5 items-center justify-center rounded-full bg-navo-blue text-[8px] font-bold text-white shadow-sm transition-transform hover:scale-125 hover:z-10"
                      title={task.title}
                    >
                      {task.title.charAt(0).toUpperCase()}
                      <span className="pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-gray-100 dark:text-gray-900">
                        {task.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
      <div className="flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500">
        <span>1 (Low Effort)</span>
        <span>5 (High Effort)</span>
      </div>
      <div className="flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500">
        <span>1 (Low Impact)</span>
        <span>5 (High Impact)</span>
      </div>
    </div>
  );
}
