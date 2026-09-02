"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { ActivityFeed } from "@/components/activity/ActivityFeed";
import { ActivityWithUser } from "@/types/activity";
import { createClient } from "@/lib/supabase/client";
import { fetchActivities } from "@/lib/data/activities";
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

const PAGE_SIZE = 50;

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [entityFilter, setEntityFilter] = useState("");

  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      setActivities([]);
      setHasMore(true);
      const data = await fetchActivities(supabase, {
        entityType: entityFilter || undefined,
        limit: PAGE_SIZE,
        offset: 0,
      });
      if (!cancelled) {
        setActivities(data);
        setHasMore(data.length >= PAGE_SIZE);
        setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [supabase, entityFilter]);

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    const data = await fetchActivities(supabase, {
      entityType: entityFilter || undefined,
      limit: PAGE_SIZE,
      offset: activities.length,
    });
    setActivities((prev) => [...prev, ...data]);
    setHasMore(data.length >= PAGE_SIZE);
    setIsLoadingMore(false);
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
        <div className="w-full sm:w-48">
          <Select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            options={ENTITY_TYPES}
          />
        </div>
      </div>

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
