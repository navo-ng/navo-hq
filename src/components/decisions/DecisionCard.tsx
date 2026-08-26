"use client";

import { Decision } from "@/types/decision";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users } from "lucide-react";

interface DecisionCardProps {
  decision: Decision;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function DecisionCard({ decision }: DecisionCardProps) {
  const contributorCount = decision.contributors?.length || 0;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">
            {decision.title}
          </h3>
          {decision.topic && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {decision.topic}
            </p>
          )}
        </div>
        {decision.status && (
          <Badge color={decision.status.color}>{decision.status.name}</Badge>
        )}
      </div>

      {decision.context && (
        <p className="mb-3 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
          {decision.context}
        </p>
      )}

      {decision.decision_text && (
        <div className="mb-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Decision
          </p>
          <p className="mt-1 line-clamp-2 text-sm text-gray-900 dark:text-white">
            {decision.decision_text}
          </p>
        </div>
      )}

      <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-gray-400">
        {decision.owner && (
          <span className="flex items-center gap-1">
            <span
              className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium text-white"
              style={{ backgroundColor: "#0064F0" }}
            >
              {decision.owner.name.charAt(0).toUpperCase()}
            </span>
            {decision.owner.name}
          </span>
        )}
        {contributorCount > 0 && (
          <span className="flex items-center gap-1">
            <Users size={12} />
            {contributorCount} {contributorCount === 1 ? "contributor" : "contributors"}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Calendar size={12} />
          {formatDate(decision.created_at)}
        </span>
      </div>

      {decision.tags && decision.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {decision.tags.slice(0, 3).map((tag) => (
            <Badge key={tag.id} color={tag.color}>
              {tag.name}
            </Badge>
          ))}
          {decision.tags.length > 3 && (
            <span className="text-xs text-gray-400">
              +{decision.tags.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
