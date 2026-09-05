"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Decision, DecisionVote } from "@/types/decision";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

interface DecisionCardProps {
  decision: Decision;
  votes?: DecisionVote[];
  onEdit: (decision: Decision) => void;
  onDelete: (decision: Decision) => void;
  isViewer?: boolean;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function DecisionCard({ decision, votes = [], onEdit, onDelete, isViewer }: DecisionCardProps) {
  const contributorCount = decision.contributors?.length || 0;
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

  const approveCount = votes.filter((v) => v.vote === "approve").length;
  const rejectCount = votes.filter((v) => v.vote === "reject").length;
  const abstainCount = votes.filter((v) => v.vote === "abstain").length;
  const totalVotes = approveCount + rejectCount + abstainCount;

  return (
    <Link href={`/decisions/${decision.id}`}>
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
          <div className="flex items-center gap-2 shrink-0">
            {decision.status && (
              <Badge color={decision.status.color}>{decision.status.name}</Badge>
            )}
            {!isViewer && (
              <div className="relative" ref={menuRef} onClick={(e) => e.stopPropagation()}>
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
                        onEdit(decision);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      <Pencil size={14} />
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete(decision);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
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

        {totalVotes > 0 && (
          <div className="mb-3 space-y-2">
            <div className="flex h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              {approveCount > 0 && (
                <div
                  className="bg-emerald-500"
                  style={{ width: `${(approveCount / totalVotes) * 100}%` }}
                />
              )}
              {rejectCount > 0 && (
                <div
                  className="bg-red-500"
                  style={{ width: `${(rejectCount / totalVotes) * 100}%` }}
                />
              )}
              {abstainCount > 0 && (
                <div
                  className="bg-gray-400"
                  style={{ width: `${(abstainCount / totalVotes) * 100}%` }}
                />
              )}
            </div>
            <div className="flex items-center gap-3 text-[10px] text-gray-400">
              {approveCount > 0 && (
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {approveCount}
                </span>
              )}
              {rejectCount > 0 && (
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  {rejectCount}
                </span>
              )}
              {abstainCount > 0 && (
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                  {abstainCount}
                </span>
              )}
            </div>
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
    </Link>
  );
}
