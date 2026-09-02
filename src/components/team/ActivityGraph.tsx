"use client";

import { useMemo, useState } from "react";

interface ActivityGraphProps {
  activities: { created_at: string }[];
}

const GREENS = ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"];

function getWeeks(activities: { created_at: string }[]) {
  const now = new Date();
  const weeks: { date: Date; count: number; dateStr: string }[][] = [];

  const countsByDate: Record<string, number> = {};
  for (const a of activities) {
    const d = new Date(a.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    countsByDate[key] = (countsByDate[key] || 0) + 1;
  }

  const startOfWeek = new Date(now);
  startOfWeek.setDate(startOfWeek.getDate() - (startOfWeek.getDay() + 7 * 11));
  startOfWeek.setHours(0, 0, 0, 0);

  for (let w = 0; w < 12; w++) {
    const week: { date: Date; count: number; dateStr: string }[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + w * 7 + d);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      week.push({
        date,
        count: countsByDate[key] || 0,
        dateStr: date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      });
    }
    weeks.push(week);
  }

  return weeks;
}

function getColor(count: number): string {
  if (count === 0) return GREENS[0];
  if (count === 1) return GREENS[1];
  if (count <= 3) return GREENS[2];
  if (count <= 6) return GREENS[3];
  return GREENS[4];
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function ActivityGraph({ activities }: ActivityGraphProps) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);
  const weeks = useMemo(() => getWeeks(activities), [activities]);

  const total = activities.length;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Activity
        </h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {total} events in the last 12 weeks
        </span>
      </div>

      <div className="overflow-x-auto">
        <div className="flex gap-0.5" style={{ minWidth: `${weeks.length * 14 + 28}px` }}>
          <div className="flex flex-col gap-0.5 pr-1">
            {DAY_LABELS.map((label, i) => (
              <div key={i} className="flex h-[13px] items-center">
                {i % 2 === 1 && (
                  <span className="text-[9px] text-gray-400 dark:text-gray-500 w-6 text-right pr-1">
                    {label}
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-0.5">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-0.5">
                {week.map((day, di) => (
                  <div
                    key={di}
                    className="relative h-[11px] w-[11px] rounded-[2px] cursor-pointer hover:ring-1 hover:ring-gray-400 dark:hover:ring-gray-500"
                    style={{ backgroundColor: getColor(day.count) }}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setTooltip({
                        x: rect.left + rect.width / 2,
                        y: rect.top - 8,
                        text: `${day.count} event${day.count !== 1 ? "s" : ""} on ${day.dateStr}`,
                      });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end gap-1">
        <span className="text-[10px] text-gray-400 dark:text-gray-500">Less</span>
        {GREENS.map((color, i) => (
          <div
            key={i}
            className="h-[10px] w-[10px] rounded-[2px]"
            style={{ backgroundColor: color }}
          />
        ))}
        <span className="text-[10px] text-gray-400 dark:text-gray-500">More</span>
      </div>

      {tooltip && (
        <div
          className="fixed z-50 rounded-lg bg-gray-900 px-2 py-1 text-xs text-white shadow-lg pointer-events-none"
          style={{ left: tooltip.x, top: tooltip.y, transform: "translate(-50%, -100%)" }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
