"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VotePanel } from "@/components/decisions/VotePanel";
import { Decision, DecisionVote, DecisionUser } from "@/types/decision";
import { createClient } from "@/lib/supabase/client";
import { fetchDecisionById, fetchDecisionVotes, fetchAllUsers } from "@/lib/data/decisions";
import { printDecisionReport } from "@/lib/utils/pdf-export";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  if (!children || (typeof children === "string" && !children.trim())) return null;
  return (
    <div className="space-y-1">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {title}
      </h3>
      <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-900 dark:bg-gray-800 dark:text-white whitespace-pre-wrap">
        {children}
      </div>
    </div>
  );
}

export default function DecisionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const decisionId = params.id as string;

  const [decision, setDecision] = useState<Decision | null>(null);
  const [votes, setVotes] = useState<DecisionVote[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!cancelled && userData.user) {
        setCurrentUserId(userData.user.id);
      }

      const [decisionData, voteData] = await Promise.all([
        fetchDecisionById(supabase, decisionId),
        fetchDecisionVotes(supabase, decisionId),
      ]);

      if (!cancelled) {
        setDecision(decisionData);
        setVotes(voteData);
        setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [supabase, decisionId]);

  const refetchVotes = async () => {
    const voteData = await fetchDecisionVotes(supabase, decisionId);
    setVotes(voteData);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
        <div className="h-10 w-2/3 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
        <div className="h-64 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800" />
      </div>
    );
  }

  if (!decision) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.push("/decisions")}>
          <ArrowLeft size={16} />
          Back to Decisions
        </Button>
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Decision not found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={() => router.push("/decisions")}>
          <ArrowLeft size={16} />
          Back to Decisions
        </Button>
        <Button variant="secondary" onClick={() => printDecisionReport(decision, votes)}>
          <Printer size={16} />
          Export
        </Button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {decision.title}
            </h1>
            {decision.topic && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {decision.topic}
              </p>
            )}
          </div>
          {decision.status && (
            <Badge color={decision.status.color}>{decision.status.name}</Badge>
          )}
        </div>

        <div className="space-y-4">
          <Section title="Context">{decision.context}</Section>
          <Section title="Proposed Decision">{decision.proposed_decision}</Section>
          <Section title="Decision Text">{decision.decision_text}</Section>
          <Section title="Reason">{decision.reason}</Section>
          <Section title="Alternatives">{decision.alternatives}</Section>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <VotePanel
          decisionId={decisionId}
          votes={votes}
          currentUserId={currentUserId}
          onVoteChange={refetchVotes}
        />
      </div>

      {decision.contributors && decision.contributors.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
            Contributors
          </h3>
          <div className="space-y-2">
            {decision.contributors.map((c) => (
              <div key={c.user.id} className="flex items-center gap-3">
                <span
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: "#0064F0" }}
                >
                  {c.user.name.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {c.user.name}
                  </p>
                  {c.contribution && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {c.contribution}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {decision.tags && decision.tags.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
            Tags
          </h3>
          <div className="flex flex-wrap gap-2">
            {decision.tags.map((tag) => (
              <Badge key={tag.id} color={tag.color}>
                {tag.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
          {decision.creator && (
            <div className="flex items-center gap-2">
              <span className="font-medium">Created by</span>
              <span
                className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium text-white"
                style={{ backgroundColor: "#0064F0" }}
              >
                {decision.creator.name.charAt(0).toUpperCase()}
              </span>
              {decision.creator.name}
              <span className="text-gray-400">on {formatDate(decision.created_at)}</span>
            </div>
          )}
          {decision.updated_at !== decision.created_at && (
            <div className="flex items-center gap-2">
              <span className="font-medium">Updated</span>
              {formatDate(decision.updated_at)}
            </div>
          )}
          {decision.decided_at && (
            <div className="flex items-center gap-2">
              <span className="font-medium">Decided</span>
              {formatDate(decision.decided_at)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
