"use client";

import {
  CheckSquare,
  FolderKanban,
  Scale,
  FileText,
  Users,
  Calendar,
  MessageSquare,
} from "lucide-react";

interface SearchResultItem {
  id: string;
  title: string;
  description?: string | null;
  email?: string;
  avatar_url?: string | null;
  event_date?: string;
  event_time?: string | null;
  entity_type?: string;
  entity_id?: string;
}

interface SearchResultsProps {
  results: {
    tasks: SearchResultItem[];
    projects: SearchResultItem[];
    decisions: SearchResultItem[];
    documents: SearchResultItem[];
    team: SearchResultItem[];
    events: SearchResultItem[];
    comments: SearchResultItem[];
  };
  onSelect: (url: string) => void;
  query: string;
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  flatResults: { url: string; title: string; type: string; description?: string | null }[];
}

const sections: {
  key: keyof SearchResultsProps["results"];
  label: string;
  icon: React.ElementType;
  baseUrl: string;
  useIdParam: boolean;
}[] = [
  { key: "tasks", label: "Tasks", icon: CheckSquare, baseUrl: "/tasks", useIdParam: true },
  { key: "projects", label: "Projects", icon: FolderKanban, baseUrl: "/projects", useIdParam: false },
  { key: "decisions", label: "Decisions", icon: Scale, baseUrl: "/decisions", useIdParam: true },
  { key: "documents", label: "Documents", icon: FileText, baseUrl: "/documents", useIdParam: true },
  { key: "team", label: "Team Members", icon: Users, baseUrl: "/team", useIdParam: true },
  { key: "events", label: "Calendar Events", icon: Calendar, baseUrl: "/calendar", useIdParam: true },
  { key: "comments", label: "Comments", icon: MessageSquare, baseUrl: "/tasks", useIdParam: true },
];

function highlightMatch(text: string, query: string) {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span className="font-semibold text-navo-blue">{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  );
}

function getInitial(name: string): string {
  return name?.charAt(0)?.toUpperCase() || "?";
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

const entityBadgeColors: Record<string, string> = {
  task: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  project: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  decision: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  document: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  event: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
};

export function SearchResults({
  results,
  onSelect,
  query,
  activeIndex,
  onActiveIndexChange,
  flatResults,
}: SearchResultsProps) {
  let flatIdx = -1;

  return (
    <div className="max-h-[60vh] overflow-y-auto p-2">
      {sections.map((section) => {
        const items = results[section.key];
        if (!items || items.length === 0) return null;

        return (
          <div key={section.key} className="mb-2">
            <div className="flex items-center gap-2 px-3 py-1.5">
              <section.icon size={14} className="text-gray-400" />
              <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
                {section.label}
              </span>
            </div>
            {items.map((item) => {
              flatIdx++;
              let url: string;
              if (section.key === "comments" && item.entity_type && item.entity_id) {
                url = `/tasks?id=${item.entity_id}`;
              } else if (section.useIdParam) {
                url = `${section.baseUrl}?id=${item.id}`;
              } else {
                url = `${section.baseUrl}/${item.id}`;
              }
              const isActive = flatIdx === activeIndex;

              if (section.key === "team") {
                return (
                  <button
                    key={`${section.key}-${item.id}`}
                    onClick={() => onSelect(url)}
                    onMouseEnter={() => onActiveIndexChange(flatIdx)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      isActive
                        ? "bg-gray-100 dark:bg-gray-800"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    }`}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navo-blue/10 text-navo-blue text-xs font-semibold">
                      {getInitial(item.title)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-gray-900 dark:text-white">
                        {highlightMatch(item.title, query)}
                      </div>
                      {item.email && (
                        <div className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                          {highlightMatch(item.email, query)}
                        </div>
                      )}
                    </div>
                    <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                      Member
                    </span>
                  </button>
                );
              }

              if (section.key === "events") {
                return (
                  <button
                    key={`${section.key}-${item.id}`}
                    onClick={() => onSelect(url)}
                    onMouseEnter={() => onActiveIndexChange(flatIdx)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      isActive
                        ? "bg-gray-100 dark:bg-gray-800"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    }`}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-800">
                      <Calendar size={14} className="text-gray-500 dark:text-gray-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-gray-900 dark:text-white">
                        {highlightMatch(item.title, query)}
                      </div>
                      <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        {item.event_date && formatDate(item.event_date)}
                        {item.event_time ? ` at ${item.event_time}` : ""}
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                      Event
                    </span>
                  </button>
                );
              }

              if (section.key === "comments") {
                return (
                  <button
                    key={`${section.key}-${item.id}`}
                    onClick={() => onSelect(url)}
                    onMouseEnter={() => onActiveIndexChange(flatIdx)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      isActive
                        ? "bg-gray-100 dark:bg-gray-800"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    }`}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-800">
                      <MessageSquare size={14} className="text-gray-500 dark:text-gray-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-gray-900 dark:text-white">
                        {highlightMatch(item.title, query)}
                      </div>
                      {item.entity_type && (
                        <div className="mt-0.5">
                          <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${entityBadgeColors[item.entity_type] || "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"}`}>
                            {item.entity_type}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              }

              return (
                <button
                  key={`${section.key}-${item.id}`}
                  onClick={() => onSelect(url)}
                  onMouseEnter={() => onActiveIndexChange(flatIdx)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    isActive
                      ? "bg-gray-100 dark:bg-gray-800"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  }`}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-800">
                      <section.icon size={14} className="text-gray-500 dark:text-gray-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-gray-900 dark:text-white">
                        {highlightMatch(item.title, query)}
                      </div>
                      {item.description && (
                        <div className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                          {highlightMatch(
                            item.description.length > 100
                              ? item.description.slice(0, 100) + "..."
                              : item.description,
                            query
                          )}
                        </div>
                      )}
                    </div>
                    <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                      {section.label.slice(0, -1)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        );
      })}
      {flatResults.length === 0 && (
        <div className="py-12 text-center text-sm text-gray-400">
          No results found for &ldquo;{query}&rdquo;
        </div>
      )}
    </div>
  );
}
