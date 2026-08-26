"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Search } from "lucide-react";

interface TaskSearchResult {
  id: string;
  title: string;
  status: { name: string; color: string } | null;
}

interface TaskSearchSelectProps {
  excludeIds: string[];
  onSelect: (task: TaskSearchResult) => void;
  placeholder?: string;
}

export function TaskSearchSelect({
  excludeIds,
  onSelect,
  placeholder = "Search tasks...",
}: TaskSearchSelectProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TaskSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const displayResults = query.trim().length < 1 ? [] : results;

  useEffect(() => {
    if (query.trim().length < 1) return;

    const timer = setTimeout(async () => {
      setLoading(true);
      const { data } = await supabase
        .from("tasks")
        .select("id, title, status:task_statuses(name, color)")
        .ilike("title", `%${query}%`)
        .eq("is_archived", false)
        .limit(20);

      if (data) {
        const filtered = data
          .map((row: Record<string, unknown>) => ({
            id: row.id as string,
            title: row.title as string,
            status: row.status as { name: string; color: string } | null,
          }))
          .filter((t) => !excludeIds.includes(t.id));
        setResults(filtered);
      }
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, excludeIds, supabase]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (task: TaskSearchResult) => {
    onSelect(task);
    setQuery("");
    setResults([]);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-navo-blue focus:outline-none focus:ring-1 focus:ring-navo-blue dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
      </div>
      {open && displayResults.length > 0 && (
        <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          {displayResults.map((task) => (
            <button
              key={task.id}
              onClick={() => handleSelect(task)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <span className="truncate text-gray-900 dark:text-white">
                {task.title}
              </span>
              {task.status && (
                <span
                  className="ml-auto shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                  style={{
                    backgroundColor: `${task.status.color}20`,
                    color: task.status.color,
                  }}
                >
                  {task.status.name}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
      {open && query.trim().length > 0 && !loading && displayResults.length === 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-center text-sm text-gray-400 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          No matching tasks
        </div>
      )}
    </div>
  );
}
