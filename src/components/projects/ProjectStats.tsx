"use client";

import { FolderKanban, CheckCircle, Clock, Pause } from "lucide-react";

interface ProjectStatsProps {
  total: number;
  active: number;
  planning: number;
  onHold: number;
  completed: number;
}

export function ProjectStats({
  total,
  active,
  planning,
  onHold,
  completed,
}: ProjectStatsProps) {
  const stats = [
    {
      label: "Total",
      value: total,
      icon: FolderKanban,
      color: "text-gray-900 dark:text-white",
    },
    {
      label: "Active",
      value: active,
      icon: CheckCircle,
      color: "text-navo-blue",
    },
    {
      label: "Planning",
      value: planning,
      icon: Clock,
      color: "text-amber-500",
    },
    {
      label: "On Hold",
      value: onHold,
      icon: Pause,
      color: "text-orange-500",
    },
    {
      label: "Completed",
      value: completed,
      icon: CheckCircle,
      color: "text-navo-green",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900"
        >
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {stat.label}
          </p>
          <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
        </div>
      ))}
    </div>
  );
}
