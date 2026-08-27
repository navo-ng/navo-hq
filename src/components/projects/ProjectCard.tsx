"use client";

import Link from "next/link";
import { Project } from "@/types/project";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, CheckCircle } from "lucide-react";

interface ProjectCardProps {
  project: Project;
  onDelete?: (project: Project) => void;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.ceil(
    (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays < -1) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays <= 7) return `${diffDays}d left`;
  return date.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
}

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const memberCount = project.members?.length || 0;
  const stats = project.task_stats;
  const hasTasks = stats && stats.total > 0;
  const progressPct = hasTasks
    ? Math.round(((stats?.done || 0) / (stats?.total || 1)) * 100)
    : 0;
  const isOverdue =
    project.target_date &&
    new Date(project.target_date) < new Date() &&
    project.status?.name !== "Completed";

  return (
    <Link
      href={`/projects/${project.id}`}
      className="block rounded-xl border border-gray-200 bg-white p-5 transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">
            {project.name}
          </h3>
          {project.description && (
            <p className="line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
              {project.description}
            </p>
          )}
        </div>
        {project.status && (
          <Badge color={project.status.color}>{project.status.name}</Badge>
        )}
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-gray-400">
        {project.owner && (
          <span className="flex items-center gap-1">
            <span
              className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium text-white"
              style={{ backgroundColor: "#0064F0" }}
            >
              {project.owner.name.charAt(0).toUpperCase()}
            </span>
            {project.owner.name}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Users size={12} />
          {memberCount} {memberCount === 1 ? "member" : "members"}
        </span>
        {project.target_date && (
          <span
            className={`flex items-center gap-1 ${
              isOverdue ? "font-medium text-red-500" : ""
            }`}
          >
            <Calendar size={12} />
            {formatDate(project.target_date)}
          </span>
        )}
      </div>

      {hasTasks ? (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500 dark:text-gray-400">
              {stats?.done}/{stats?.total} tasks
            </span>
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {progressPct}%
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            <div
              className="h-full rounded-full bg-navo-green transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <CheckCircle size={12} />
          No tasks yet
        </div>
      )}

      {project.tags && project.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {project.tags.slice(0, 2).map((tag) => (
            <Badge key={tag.id} color={tag.color}>
              {tag.name}
            </Badge>
          ))}
          {project.tags.length > 2 && (
            <span className="text-xs text-gray-400">
              +{project.tags.length - 2}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
