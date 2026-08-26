"use client";

import { DocDocument } from "@/types/document";
import { Badge } from "@/components/ui/badge";
import { FileText, GitBranch, User } from "lucide-react";

interface DocumentCardProps {
  document: DocDocument;
}

export function DocumentCard({ document: doc }: DocumentCardProps) {
  const versionCount = doc.versions?.length || 0;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">
            {doc.title}
          </h3>
          {doc.description && (
            <p className="line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
              {doc.description}
            </p>
          )}
        </div>
        {doc.status && (
          <Badge color={doc.status.color}>{doc.status.name}</Badge>
        )}
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-gray-400">
        {doc.category && (
          <span className="flex items-center gap-1">
            <FileText size={12} />
            {doc.category}
          </span>
        )}
        {doc.owner && (
          <span className="flex items-center gap-1">
            <span
              className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium text-white"
              style={{ backgroundColor: "#0064F0" }}
            >
              {doc.owner.name.charAt(0).toUpperCase()}
            </span>
            {doc.owner.name}
          </span>
        )}
        <span className="flex items-center gap-1">
          <GitBranch size={12} />
          {versionCount} {versionCount === 1 ? "version" : "versions"}
        </span>
        {doc.project && (
          <span className="flex items-center gap-1 text-navo-blue">
            {doc.project.name}
          </span>
        )}
      </div>

      {doc.tags && doc.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {doc.tags.slice(0, 3).map((tag) => (
            <Badge key={tag.id} color={tag.color}>
              {tag.name}
            </Badge>
          ))}
          {doc.tags.length > 3 && (
            <span className="text-xs text-gray-400">
              +{doc.tags.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
