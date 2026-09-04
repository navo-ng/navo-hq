"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Vote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DecisionCard } from "@/components/decisions/DecisionCard";
import { DecisionFilters } from "@/components/decisions/DecisionFilters";
import { CreateDecisionDialog } from "@/components/decisions/CreateDecisionDialog";
import { EditDecisionDialog } from "@/components/decisions/EditDecisionDialog";
import { DeleteDecisionDialog } from "@/components/decisions/DeleteDecisionDialog";
import { Decision, DecisionUser, DecisionStatusConfig, DecisionVote } from "@/types/decision";
import { createClient } from "@/lib/supabase/client";
import {
  fetchDecisions,
  fetchDecisionStatuses,
  fetchAllUsers,
  fetchAllProjects,
  fetchAllTags,
  createDecision,
  fetchDecisionVotes,
} from "@/lib/data/decisions";
import { ErrorState } from "@/components/ui/error-state";

export default function DecisionsPage() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [statuses, setStatuses] = useState<DecisionStatusConfig[]>([]);
  const [users, setUsers] = useState<DecisionUser[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [tags, setTags] = useState<{ id: string; name: string; color: string }[]>([]);
  const [votesMap, setVotesMap] = useState<Record<string, DecisionVote[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingDecision, setEditingDecision] = useState<Decision | null>(null);
  const [deletingDecision, setDeletingDecision] = useState<Decision | null>(null);

  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [decisionData, statusData, userData, projectData, tagData] =
          await Promise.all([
            fetchDecisions(supabase, { sort: "newest" }),
            fetchDecisionStatuses(supabase),
            fetchAllUsers(supabase),
            fetchAllProjects(supabase),
            fetchAllTags(supabase),
          ]);
        if (!cancelled) {
          setDecisions(decisionData);
          setStatuses(statusData);
          setUsers(userData);
          setProjects(projectData);
          setTags(tagData);

          const votesResults = await Promise.all(
            decisionData.map((d) => fetchDecisionVotes(supabase, d.id))
          );
          if (!cancelled) {
            const map: Record<string, DecisionVote[]> = {};
            decisionData.forEach((d, i) => {
              map[d.id] = votesResults[i];
            });
            setVotesMap(map);
          }

          setIsLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError("Failed to load decisions. Please try again.");
          setIsLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const filteredDecisions = useMemo(() => {
    let result = [...decisions];

    if (statusFilter !== "all") {
      result = result.filter((d) => d.status_id === statusFilter);
    }

    if (ownerFilter !== "all") {
      result = result.filter((d) => d.owner_id === ownerFilter);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.topic?.toLowerCase().includes(q) ||
          d.context?.toLowerCase().includes(q) ||
          d.owner?.name.toLowerCase().includes(q)
      );
    }

    if (sort === "title") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === "oldest") {
      result.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    } else if (sort === "decided") {
      result.sort((a, b) => {
        if (!a.decided_at) return 1;
        if (!b.decided_at) return -1;
        return (
          new Date(b.decided_at).getTime() - new Date(a.decided_at).getTime()
        );
      });
    }

    return result;
  }, [decisions, statusFilter, ownerFilter, searchQuery, sort]);

  const stats = useMemo(() => {
    const countByStatus = (name: string) =>
      decisions.filter(
        (d) => d.status?.name?.toLowerCase() === name.toLowerCase()
      ).length;

    return {
      total: decisions.length,
      proposed: countByStatus("Proposed"),
      underDiscussion: countByStatus("Under Discussion"),
      decided: countByStatus("Decided"),
      rejected: countByStatus("Rejected"),
    };
  }, [decisions]);

  const owners = useMemo(() => {
    const seen = new Set<string>();
    const result: DecisionUser[] = [];
    for (const d of decisions) {
      if (d.owner && !seen.has(d.owner.id)) {
        seen.add(d.owner.id);
        result.push(d.owner);
      }
    }
    return result;
  }, [decisions]);

  const refetchDecisions = async () => {
    const data = await fetchDecisions(supabase, { sort: "newest" });
    setDecisions(data);
  };

  const handleCreateDecision = async (input: {
    title: string;
    topic: string;
    context: string;
    proposed_decision: string;
    decision_text: string;
    reason: string;
    alternatives: string;
    owner_id: string;
    project_id: string;
    status_id: string;
    contributor_ids: string[];
    tag_ids: string[];
  }) => {
    const decision = await createDecision(supabase, input);
    if (decision) {
      setDecisions((prev) => [decision, ...prev]);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Decisions
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Track and manage team decisions
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Decisions</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Track and manage team decisions</p>
        </div>
        <ErrorState message={error} onRetry={() => { setError(null); setIsLoading(true); window.location.reload(); }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Decisions
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Track and manage team decisions
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="shrink-0">
          <Plus size={16} />
          New Decision
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          {
            label: "Total",
            value: stats.total,
            color: "text-gray-900 dark:text-white",
          },
          { label: "Proposed", value: stats.proposed, color: "text-navo-blue" },
          {
            label: "Under Discussion",
            value: stats.underDiscussion,
            color: "text-amber-500",
          },
          { label: "Decided", value: stats.decided, color: "text-navo-green" },
          { label: "Rejected", value: stats.rejected, color: "text-red-500" },
        ].map((stat) => (
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

      <DecisionFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        ownerFilter={ownerFilter}
        onOwnerFilterChange={setOwnerFilter}
        sort={sort}
        onSortChange={setSort}
        statuses={statuses}
        owners={owners}
      />

      {filteredDecisions.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center dark:border-gray-800 dark:bg-gray-900">
          {searchQuery || statusFilter !== "all" || ownerFilter !== "all" ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No decisions match your filters.
            </p>
          ) : (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-navo-light dark:bg-navo-blue/10">
                <Vote size={24} className="text-navo-blue" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                No decisions yet
              </h3>
              <p className="mb-6 mx-auto max-w-sm text-sm text-gray-500 dark:text-gray-400">
                Track and manage important team decisions in one place. Propose, discuss, and finalize decisions together.
              </p>
              <button
                onClick={() => setCreateDialogOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-navo-blue px-4 py-2 text-sm font-medium text-white hover:bg-navo-deep transition-colors"
              >
                <Plus size={16} />
                Create your first decision
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDecisions.map((decision) => (
            <DecisionCard
              key={decision.id}
              decision={decision}
              votes={votesMap[decision.id] || []}
              onEdit={setEditingDecision}
              onDelete={setDeletingDecision}
            />
          ))}
        </div>
      )}

      <CreateDecisionDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onCreate={handleCreateDecision}
        users={users}
        statuses={statuses}
        projects={projects}
        tags={tags}
      />

      {editingDecision && (
        <EditDecisionDialog
          key={editingDecision.id}
          decision={editingDecision}
          open={!!editingDecision}
          onClose={() => setEditingDecision(null)}
          onUpdated={refetchDecisions}
          users={users}
          statuses={statuses}
          projects={projects}
          tags={tags}
        />
      )}

      {deletingDecision && (
        <DeleteDecisionDialog
          decision={deletingDecision}
          open={!!deletingDecision}
          onClose={() => setDeletingDecision(null)}
          onDeleted={refetchDecisions}
        />
      )}
    </div>
  );
}
