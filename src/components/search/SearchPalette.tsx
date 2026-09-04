"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Search, Loader2, Command } from "lucide-react";
import { useRouter } from "next/navigation";
import { SearchResults } from "./SearchResults";

interface SearchPaletteProps {
  open: boolean;
  onClose: () => void;
}

interface ApiSearchResult {
  type: string;
  id: string;
  title: string;
  subtitle: string;
  url: string;
}

const RECENT_KEY = "navo_search_recent";
const MAX_RECENT = 5;

function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch {
    return [];
  }
}

function addRecentSearch(query: string) {
  if (!query.trim()) return;
  const recent = getRecentSearches().filter((r) => r !== query);
  recent.unshift(query);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
}

export function SearchPalette({ open, onClose }: SearchPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    tasks: { id: string; title: string; description?: string | null }[];
    projects: { id: string; title: string; description?: string | null }[];
    decisions: { id: string; title: string; description?: string | null }[];
    documents: { id: string; title: string; description?: string | null }[];
    team: { id: string; title: string; description?: string | null; email?: string; avatar_url?: string | null }[];
    events: { id: string; title: string; description?: string | null; event_date?: string; event_time?: string | null }[];
    comments: { id: string; title: string; description?: string | null; entity_type?: string; entity_id?: string }[];
  }>({ tasks: [], projects: [], decisions: [], documents: [], team: [], events: [], comments: [] });
  const [activeIndex, setActiveIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const prevOpenRef = useRef(open);
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setQuery("");
      setResults({ tasks: [], projects: [], decisions: [], documents: [], team: [], events: [], comments: [] });
      setActiveIndex(0);
      setRecentSearches(getRecentSearches());
    }
    prevOpenRef.current = open;
  }, [open]);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const flatResults = useMemo(() => {
    const items: { url: string; title: string; type: string; description?: string | null }[] = [];
    const sectionConfig: {
      key: keyof typeof results;
      baseUrl: string;
      useIdParam: boolean;
    }[] = [
      { key: "tasks", baseUrl: "/tasks", useIdParam: true },
      { key: "projects", baseUrl: "/projects", useIdParam: false },
      { key: "decisions", baseUrl: "/decisions", useIdParam: true },
      { key: "documents", baseUrl: "/documents", useIdParam: true },
      { key: "team", baseUrl: "/team", useIdParam: true },
      { key: "events", baseUrl: "/calendar", useIdParam: true },
      { key: "comments", baseUrl: "/tasks", useIdParam: true },
    ];

    for (const section of sectionConfig) {
      for (const item of results[section.key]) {
        let url: string;
        if (section.key === "comments" && "entity_type" in item && "entity_id" in item && item.entity_type && item.entity_id) {
          url = `/tasks?id=${(item as { entity_id: string }).entity_id}`;
        } else if (section.useIdParam) {
          url = `${section.baseUrl}?id=${item.id}`;
        } else {
          url = `${section.baseUrl}/${item.id}`;
        }
        items.push({ url, title: item.title, type: section.key, description: item.description });
      }
    }
    return items;
  }, [results]);

  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults({ tasks: [], projects: [], decisions: [], documents: [], team: [], events: [], comments: [] });
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: searchQuery.trim(), limit: 20 }),
        });
        const data = await res.json();
        const apiResults: ApiSearchResult[] = data.results || [];

        setResults({
          tasks: apiResults
            .filter((r) => r.type === "task")
            .map((r) => ({ id: r.id, title: r.title, description: r.subtitle })),
          projects: apiResults
            .filter((r) => r.type === "project")
            .map((r) => ({ id: r.id, title: r.title, description: r.subtitle })),
          decisions: apiResults
            .filter((r) => r.type === "decision")
            .map((r) => ({ id: r.id, title: r.title, description: r.subtitle })),
          documents: apiResults
            .filter((r) => r.type === "document")
            .map((r) => ({ id: r.id, title: r.title, description: r.subtitle })),
          team: apiResults
            .filter((r) => r.type === "team")
            .map((r) => ({ id: r.id, title: r.title, description: r.subtitle, email: r.subtitle })),
          events: [],
          comments: [],
        });
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleInputChange = (value: string) => {
    setQuery(value);
    setActiveIndex(0);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.trim()) {
      setResults({ tasks: [], projects: [], decisions: [], documents: [], team: [], events: [], comments: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(() => performSearch(value), 300);
  };

  const handleSelect = (url: string) => {
    if (query.trim()) addRecentSearch(query.trim());
    onClose();
    router.push(url);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalItems = flatResults.length || (query.trim() ? 0 : recentSearches.length);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % Math.max(totalItems, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + Math.max(totalItems, 1)) % Math.max(totalItems, 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (query.trim() && flatResults.length > 0) {
        handleSelect(flatResults[activeIndex]?.url || "");
      } else if (!query.trim() && recentSearches[activeIndex]) {
        handleInputChange(recentSearches[activeIndex]);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh]">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg mx-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center gap-3 border-b border-gray-200 px-4 dark:border-gray-700">
          {loading ? (
            <Loader2 size={18} className="animate-spin text-gray-400" />
          ) : (
            <Search size={18} className="text-gray-400" />
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search tasks, projects, decisions, documents, team, events..."
            className="h-12 flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none dark:text-white dark:placeholder-gray-500"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-gray-300 px-1.5 py-0.5 text-[10px] font-medium text-gray-400 dark:border-gray-600">
            esc
          </kbd>
        </div>

        {query.trim() ? (
          <SearchResults
            results={results}
            onSelect={handleSelect}
            query={query}
            activeIndex={activeIndex}
            onActiveIndexChange={setActiveIndex}
            flatResults={flatResults}
          />
        ) : (
          <div className="p-2">
            {recentSearches.length > 0 ? (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5">
                  <Command size={14} className="text-gray-400" />
                  <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    Recent Searches
                  </span>
                </div>
                {recentSearches.map((recent, idx) => (
                  <button
                    key={recent}
                    onClick={() => handleInputChange(recent)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      idx === activeIndex
                        ? "bg-gray-100 dark:bg-gray-800"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    }`}
                  >
                    <Command size={14} className="text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-300">{recent}</span>
                  </button>
                ))}
              </>
            ) : (
              <div className="py-8 text-center text-sm text-gray-400">
                Start typing to search across all your data
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-2 dark:border-gray-700">
          <div className="flex items-center gap-2 text-[10px] text-gray-400">
            <span className="rounded bg-gray-100 px-1 py-0.5 font-medium dark:bg-gray-800">
              <span className="text-[9px]">&uarr;</span>
            </span>
            <span className="rounded bg-gray-100 px-1 py-0.5 font-medium dark:bg-gray-800">
              <span className="text-[9px]">&darr;</span>
            </span>
            <span>to navigate</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-gray-400">
            <span className="rounded bg-gray-100 px-1 py-0.5 font-medium dark:bg-gray-800">
              enter
            </span>
            <span>to select</span>
          </div>
        </div>
      </div>
    </div>
  );
}
