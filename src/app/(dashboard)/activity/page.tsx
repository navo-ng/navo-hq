"use client";

import { useState, useEffect } from "react";
import { Loader2, X } from "lucide-react";
import { ActivityFeed } from "@/components/activity/ActivityFeed";
import { ActivityWithUser } from "@/types/activity";
import { createClient } from "@/lib/supabase/client";
import { fetchActivities } from "@/lib/data/activities";
import { fetchAllUsers, AppUser } from "@/lib/data/users";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const ENTITY_TYPES = [
  { value: "", label: "All entities" },
  { value: "task", label: "Tasks" },
  { value: "project", label: "Projects" },
  { value: "decision", label: "Decisions" },
  { value: "document", label: "Documents" },
  { value: "comment", label: "Comments" },
];

const ACTIONS = [
  { value: "", label: "All actions" },
  { value: "create", label: "Created" },
  { value: "update", label: "Updated" },
  { value: "complete", label: "Completed" },
  { value: "archive", label: "Archived" },
  { value: "comment", label: "Commented" },
];

const DATE_RANGES = [
  { label: "Today", getRange: () => { const d = new Date(); d.setHours(0, 0, 0, 0); return { from: d.toISOString(), to: new Date().toISOString() }; } },
  { label: "This week", getRange: () => { const d = new Date(); d.setDate(d.getDate() - 7); return { from: d.toISOString(), to: new Date().toISOString() }; } },
  { label: "This month", getRange: () => { const d = new Date(); d.setMonth(d.getMonth() - 1); return { from: d.toISOString(), to: new Date().toISOString() }; } },
  { label: "All time", getRange: () => ({ from: undefined, to: undefined }) },
];

const PAGE_SIZE = 50;

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [entityFilter, setEntityFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [dateRangeIndex, setDateRangeIndex] = useState(3); // "All time" default
  const [users, setUsers] = useState<AppUser[]>([]);

  const supabase = createClient();

  useEffect(() => {
    fetchAllUsers(supabase).then(setUsers);
  }, [supabase]);

  const activeFilters = [];
  if (entityFilter) activeFilters.push({ key: "entity", label: `Entity: ${ENTITY_TYPES.find(e => e.value === entityFilter)?.label}` });
  if (userFilter) activeFilters.push({ key: "user", label: `User: ${users.find(u => u.id === userFilter)?.name || userFilter}` });
  if (actionFilter) activeFilters.push({ key: "action", label: `Action: ${ACTIONS.find(a => a.value === actionFilter)?.label}` });
  if (dateRangeIndex !== 3) activeFilters.push({ key: "date", label: `Date: ${DATE_RANGES[dateRangeIndex].label}` });

  const clearAllFilters = () => {
    setEntityFilter("");
    setUserFilter("");
    setActionFilter("");
    setDateRangeIndex(3);
  };

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      setActivities([]);
      setHasMore(true);
      try {
        const dateRange = DATE_RANGES[dateRangeIndex].getRange();
        const data = await fetchActivities(supabase, {
          entityType: entityFilter || undefined,
          userId: userFilter || undefined,
          action: actionFilter || undefined,
          dateFrom: dateRange.from,
          dateTo: dateRange.to,
          limit: PAGE_SIZE,
          offset: 0,
        });
        if (!cancelled) {
          setActivities(data);
          setHasMore(data.length >= PAGE_SIZE);
        }
      } catch {
        if (!cancelled) {
          setActivities([]);
          setHasMore(false);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [supabase, entityFilter, userFilter, actionFilter, dateRangeIndex]);

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    try {
      const dateRange = DATE_RANGES[dateRangeIndex].getRange();
      const data = await fetchActivities(supabase, {
        entityType: entityFilter || undefined,
        userId: userFilter || undefined,
        action: actionFilter || undefined,
        dateFrom: dateRange.from,
        dateTo: dateRange.to,
        limit: PAGE_SIZE,
        offset: activities.length,
      });
      setActivities((prev) => [...prev, ...data]);
      setHasMore(data.length >= PAGE_SIZE);
    } catch {
      // silently fail on load more
    } finally {
      setIsLoadingMore(false);
    }
  };

  const removeFilter = (key: string) => {
    if (key === "entity") setEntityFilter("");
    else if (key === "user") setUserFilter("");
    else if (key === "action") setActionFilter("");
    else if (key === "date") setDateRangeIndex(3);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Activity
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            See what&apos;s happening across your workspace
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full sm:w-44">
          <Select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            options={ENTITY_TYPES}
          />
        </div>
        <div className="w-full sm:w-44">
          <Select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            options={[{ value: "", label: "All users" }, ...users.map((u) => ({ value: u.id, label: u.name }))]}
          />
        </div>
        <div className="w-full sm:w-44">
          <Select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            options={ACTIONS}
          />
        </div>
        <div className="flex gap-1">
          {DATE_RANGES.map((range, idx) => (
            <button
              key={range.label}
              onClick={() => setDateRangeIndex(idx)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                dateRangeIndex === idx
                  ? "bg-navo-blue text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {activeFilters.map((f) => (
            <span
              key={f.key}
              className="inline-flex items-center gap-1 rounded-full bg-navo-blue/10 px-3 py-1 text-xs font-medium text-navo-blue dark:bg-navo-blue/20"
            >
              {f.label}
              <button onClick={() => removeFilter(f.key)} className="ml-0.5 rounded-full p-0.5 hover:bg-navo-blue/20">
                <X size={12} />
              </button>
            </span>
          ))}
          <button
            onClick={clearAllFilters}
            className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            Clear all
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="h-12 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800"
            />
          ))}
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <ActivityFeed activities={activities} />
          </div>
          {hasMore && (
            <div className="flex justify-center">
              <Button
                variant="secondary"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : null}
                Load more
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
