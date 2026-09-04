"use client";

import { useMemo } from "react";

interface GanttTask {
  id: string;
  title: string;
  start_date: string | null;
  due_date: string | null;
  status: string;
  status_color: string;
  owner?: string;
}

interface GanttChartProps {
  tasks: GanttTask[];
  startDate?: Date;
  endDate?: Date;
}

function parseDate(d: string): Date {
  return new Date(d + "T00:00:00");
}

function daysBetween(a: Date, b: Date): number {
  const msPerDay = 86400000;
  return Math.round((b.getTime() - a.getTime()) / msPerDay);
}

function formatDateLabel(d: Date): string {
  return d.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
}

export function GanttChart({ tasks, startDate, endDate }: GanttChartProps) {
  const { rangedTasks, noDateTasks, chartStart, chartEnd, totalDays } =
    useMemo(() => {
      const withDates = tasks.filter((t) => t.start_date || t.due_date);
      const noDate = tasks.filter((t) => !t.start_date && !t.due_date);

      if (withDates.length === 0 && noDate.length === 0) {
        return {
          rangedTasks: [],
          noDateTasks: [],
          chartStart: new Date(),
          chartEnd: new Date(),
          totalDays: 0,
        };
      }

      const allStarts = withDates
        .map((t) => (t.start_date ? parseDate(t.start_date) : parseDate(t.due_date!)))
        .filter(Boolean);
      const allEnds = withDates
        .map((t) => (t.due_date ? parseDate(t.due_date) : parseDate(t.start_date!)))
        .filter(Boolean);

      const minDate = startDate || new Date(Math.min(...allStarts.map((d) => d.getTime())));
      const maxDate = endDate || new Date(Math.max(...allEnds.map((d) => d.getTime())));

      const padStart = new Date(minDate);
      padStart.setDate(padStart.getDate() - 2);
      const padEnd = new Date(maxDate);
      padEnd.setDate(padEnd.getDate() + 2);

      const total = Math.max(daysBetween(padStart, padEnd), 7);

      return {
        rangedTasks: withDates,
        noDateTasks: noDate,
        chartStart: padStart,
        chartEnd: padEnd,
        totalDays: total,
      };
    }, [tasks, startDate, endDate]);

  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
        <p className="text-sm text-gray-500 dark:text-gray-400">No tasks to display</p>
      </div>
    );
  }

  const rowHeight = 40;
  const labelWidth = 200;
  const dayWidth = Math.max(30, 800 / totalDays);
  const chartWidth = totalDays * dayWidth;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayOffset = daysBetween(chartStart, today);
  const showTodayLine = todayOffset >= 0 && todayOffset <= totalDays;

  const milestones = useMemo(() => {
    const dates = new Set<string>();
    for (let i = 0; i <= totalDays; i++) {
      const d = new Date(chartStart);
      d.setDate(d.getDate() + i);
      if (d.getDate() === 1 || d.getDate() === 15) {
        dates.add(d.toISOString().split("T")[0]);
      }
    }
    return Array.from(dates)
      .map((ds) => ({
        date: parseDate(ds),
        offset: daysBetween(chartStart, parseDate(ds)),
      }))
      .filter((m) => m.offset >= 0 && m.offset <= totalDays);
  }, [chartStart, totalDays]);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="relative">
        <div className="min-h-[300px] overflow-x-auto">
        <div style={{ minWidth: labelWidth + chartWidth + 16 }}>
          <div className="flex border-b border-gray-200 dark:border-gray-800">
            <div
              className="sticky left-0 z-10 flex shrink-0 items-center border-r border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400"
              style={{ width: labelWidth }}
            >
              Task
            </div>
            <div className="relative flex-1" style={{ width: chartWidth }}>
              <div className="flex h-full items-end">
                {milestones.map((m) => (
                  <div
                    key={m.date.toISOString()}
                    className="absolute bottom-0 flex flex-col items-center"
                    style={{ left: m.offset * dayWidth }}
                  >
                    <span className="mb-1 text-[10px] text-gray-400 dark:text-gray-500">
                      {formatDateLabel(m.date)}
                    </span>
                    <div className="h-2 w-px bg-gray-300 dark:bg-gray-600" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="relative">
            {showTodayLine && (
              <div
                className="absolute top-0 z-20 h-full w-px bg-red-400"
                style={{ left: labelWidth + todayOffset * dayWidth }}
              >
                <div className="absolute -top-0 left-1 rounded bg-red-400 px-1 py-0.5 text-[9px] font-medium text-white">
                  Today
                </div>
              </div>
            )}

            {rangedTasks.map((task) => {
              const taskStart = task.start_date
                ? parseDate(task.start_date)
                : parseDate(task.due_date!);
              const taskEnd = task.due_date
                ? parseDate(task.due_date)
                : parseDate(task.start_date!);

              const startOffset = Math.max(0, daysBetween(chartStart, taskStart));
              const endOffset = daysBetween(chartStart, taskEnd);
              const barDays = Math.max(1, endOffset - startOffset + 1);

              return (
                <div
                  key={task.id}
                  className="flex border-b border-gray-100 dark:border-gray-800/50"
                  style={{ height: rowHeight }}
                >
                  <div
                    className="sticky left-0 z-10 flex shrink-0 items-center border-r border-gray-200 bg-white px-3 dark:border-gray-800 dark:bg-gray-900"
                    style={{ width: labelWidth }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-gray-900 dark:text-white">
                        {task.title}
                      </p>
                      {task.owner && (
                        <p className="truncate text-[10px] text-gray-400">
                          {task.owner}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="relative flex-1" style={{ width: chartWidth }}>
                    <div
                      className="absolute top-1/2 flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium text-white shadow-sm -translate-y-1/2"
                      style={{
                        left: startOffset * dayWidth + 2,
                        width: barDays * dayWidth - 4,
                        backgroundColor: task.status_color,
                        minWidth: 24,
                      }}
                    >
                      <span className="truncate">{task.status}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {noDateTasks.map((task) => (
              <div
                key={task.id}
                className="flex border-b border-gray-100 dark:border-gray-800/50"
                style={{ height: rowHeight }}
              >
                <div
                  className="sticky left-0 z-10 flex shrink-0 items-center border-r border-gray-200 bg-white px-3 dark:border-gray-800 dark:bg-gray-900"
                  style={{ width: labelWidth }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-gray-900 dark:text-white">
                      {task.title}
                    </p>
                  </div>
                </div>
                <div className="flex flex-1 items-center px-3" style={{ width: chartWidth }}>
                  <span className="text-[10px] italic text-gray-400">No dates</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent dark:from-gray-900 md:hidden" />
      </div>
    </div>
  );
}
