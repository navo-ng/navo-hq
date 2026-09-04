"use client";

import { useState } from "react";
import { DecisionVote, DecisionVoteSummary } from "@/types/decision";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { castVote, removeVote, computeVoteSummary } from "@/lib/data/decisions";
import { Check, X, Minus } from "lucide-react";

interface VotePanelProps {
  decisionId: string;
  votes: DecisionVote[];
  currentUserId: string;
  totalMembers?: number;
  onVoteChange: () => void;
}

const VOTE_OPTIONS = [
  { value: "approve" as const, label: "Approve", icon: Check, color: "bg-emerald-500", activeColor: "bg-emerald-100 border-emerald-500 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-400 dark:text-emerald-300" },
  { value: "reject" as const, label: "Reject", icon: X, color: "bg-red-500", activeColor: "bg-red-100 border-red-500 text-red-700 dark:bg-red-900/30 dark:border-red-400 dark:text-red-300" },
  { value: "abstain" as const, label: "Abstain", icon: Minus, color: "bg-gray-400", activeColor: "bg-gray-100 border-gray-400 text-gray-700 dark:bg-gray-800 dark:border-gray-500 dark:text-gray-300" },
] as const;

export function VotePanel({ decisionId, votes, currentUserId, totalMembers, onVoteChange }: VotePanelProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();
  const summary: DecisionVoteSummary = computeVoteSummary(votes, currentUserId);

  const handleVote = async (vote: "approve" | "reject" | "abstain") => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (summary.myVote === vote) {
        await removeVote(supabase, decisionId);
      } else {
        await castVote(supabase, decisionId, vote);
      }
      onVoteChange();
    } finally {
      setIsSubmitting(false);
    }
  };

  const total = summary.approve + summary.reject + summary.abstain;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Team Vote
        </h3>
        {total > 0 && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {votes.length} of {totalMembers ?? votes.length} team members voted
          </span>
        )}
      </div>

      <div className="flex gap-2">
        {VOTE_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isActive = summary.myVote === opt.value;
          const count = opt.value === "approve" ? summary.approve : opt.value === "reject" ? summary.reject : summary.abstain;

          return (
            <button
              key={opt.value}
              onClick={() => handleVote(opt.value)}
              disabled={isSubmitting}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-all disabled:opacity-50 ${
                isActive
                  ? opt.activeColor
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800"
              }`}
            >
              <Icon size={16} />
              <span className="hidden sm:inline">{opt.label}</span>
              {count > 0 && (
                <Badge color={opt.value === "approve" ? "emerald" : opt.value === "reject" ? "red" : "gray"}>
                  {count}
                </Badge>
              )}
            </button>
          );
        })}
      </div>

      {total > 0 && (
        <div className="space-y-2">
          <div className="flex h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            {summary.approve > 0 && (
              <div
                className="bg-emerald-500 transition-all"
                style={{ width: `${(summary.approve / total) * 100}%` }}
              />
            )}
            {summary.reject > 0 && (
              <div
                className="bg-red-500 transition-all"
                style={{ width: `${(summary.reject / total) * 100}%` }}
              />
            )}
            {summary.abstain > 0 && (
              <div
                className="bg-gray-400 transition-all"
                style={{ width: `${(summary.abstain / total) * 100}%` }}
              />
            )}
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {summary.approve} approve
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              {summary.reject} reject
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-gray-400" />
              {summary.abstain} abstain
            </span>
          </div>
        </div>
      )}

      {votes.length > 0 && (
        <div className="space-y-1.5 pt-1">
          {votes.map((v) => (
            <div key={v.id} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <span
                className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium text-white"
                style={{ backgroundColor: "#0064F0" }}
              >
                {v.user?.name?.charAt(0).toUpperCase() || "?"}
              </span>
              <span className="font-medium">{v.user?.name || "Unknown"}</span>
              <Badge color={v.vote === "approve" ? "emerald" : v.vote === "reject" ? "red" : "gray"}>
                {v.vote}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
