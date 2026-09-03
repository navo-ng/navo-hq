"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import {
  fetchAuditLog,
  AuditEntry,
} from "@/lib/data/audit-log";

const ENTITY_TYPES = [
  { value: "", label: "All entities" },
  { value: "task", label: "Tasks" },
  { value: "project", label: "Projects" },
  { value: "decision", label: "Decisions" },
  { value: "document", label: "Documents" },
  { value: "comment", label: "Comments" },
  { value: "member", label: "Members" },
  { value: "webhook", label: "Webhooks" },
  { value: "settings", label: "Settings" },
];

const LIMIT = 50;

export default function AuditLogPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [entityFilter, setEntityFilter] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      const data = await fetchAuditLog(supabase, {
        entity_type: entityFilter || undefined,
        limit: LIMIT,
      });
      if (!cancelled) {
        setEntries(data);
        setHasMore(data.length === LIMIT);
        setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [supabase, entityFilter]);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    const moreData = await fetchAuditLog(supabase, {
      entity_type: entityFilter || undefined,
      limit: LIMIT,
      offset: entries.length,
    });
    setEntries((prev) => [...prev, ...moreData]);
    setHasMore(moreData.length === LIMIT);
    setLoadingMore(false);
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const formatAction = (action: string) => {
    return action
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleString("en-NG", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Audit Log
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Track all changes made in your workspace
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Filter size={16} className="text-gray-400" />
        <div className="w-48">
          <Select
            options={ENTITY_TYPES}
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800"
            />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No audit log entries found.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 w-8" />
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                    Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                    Action
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                    Entity
                  </th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <AuditRow
                    key={entry.id}
                    entry={entry}
                    isExpanded={expandedId === entry.id}
                    onToggle={() => toggleExpand(entry.id)}
                    formatAction={formatAction}
                    formatTime={formatTime}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {hasMore && (
            <div className="border-t border-gray-200 p-4 text-center dark:border-gray-800">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? "Loading..." : "Load More"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AuditRow({
  entry,
  isExpanded,
  onToggle,
  formatAction,
  formatTime,
}: {
  entry: AuditEntry;
  isExpanded: boolean;
  onToggle: () => void;
  formatAction: (action: string) => string;
  formatTime: (ts: string) => string;
}) {
  const hasChanges = entry.old_value || entry.new_value;

  return (
    <>
      <tr className="border-b border-gray-100 last:border-0 dark:border-gray-800/50">
        <td className="px-4 py-3">
          {hasChanges && (
            <button
              onClick={onToggle}
              className="rounded p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {isExpanded ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )}
            </button>
          )}
        </td>
        <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
          {formatTime(entry.created_at)}
        </td>
        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
          {entry.user?.name || entry.user?.email || "System"}
        </td>
        <td className="px-4 py-3">
          <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
            {formatAction(entry.action)}
          </span>
        </td>
        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
          <span className="text-gray-900 dark:text-white font-medium">
            {entry.entity_type}
          </span>
          {entry.entity_name && (
            <span className="ml-1 text-gray-500 dark:text-gray-400">
              / {entry.entity_name}
            </span>
          )}
        </td>
      </tr>
      {isExpanded && hasChanges && (
        <tr>
          <td colSpan={5} className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {entry.old_value && (
                <div>
                  <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                    Previous
                  </p>
                  <pre className="overflow-x-auto rounded-lg bg-red-50 p-3 text-xs text-red-700 dark:bg-red-900/10 dark:text-red-400">
                    {JSON.stringify(entry.old_value, null, 2)}
                  </pre>
                </div>
              )}
              {entry.new_value && (
                <div>
                  <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                    Updated
                  </p>
                  <pre className="overflow-x-auto rounded-lg bg-green-50 p-3 text-xs text-green-700 dark:bg-green-900/10 dark:text-green-400">
                    {JSON.stringify(entry.new_value, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
