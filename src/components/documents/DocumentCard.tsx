"use client";

import { useState, useRef, useEffect } from "react";
import { DocDocument } from "@/types/document";
import { Badge } from "@/components/ui/badge";
import { FileText, GitBranch, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

interface DocumentCardProps {
  document: DocDocument;
  onEdit: (document: DocDocument) => void;
  onDelete: (document: DocDocument) => void;
}

export function DocumentCard({ document: doc, onEdit, onDelete }: DocumentCardProps) {
  const versionCount = doc.versions?.length || 0;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

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
        <div className="flex items-center gap-2 shrink-0">
          {doc.status && (
            <Badge color={doc.status.color}>{doc.status.name}</Badge>
          )}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors"
            >
              <MoreHorizontal size={16} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full z-20 mt-1 w-36 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit(doc);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  <Pencil size={14} />
                  Edit
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(doc);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
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
