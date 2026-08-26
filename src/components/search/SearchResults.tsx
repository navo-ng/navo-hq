"use client";

import {
  CheckSquare,
  FolderKanban,
  Scale,
  FileText,
} from "lucide-react";

interface SearchResultItem {
  id: string;
  title: string;
  description?: string | null;
}

interface SearchResultsProps {
  results: {
    tasks: SearchResultItem[];
    projects: SearchResultItem[];
    decisions: SearchResultItem[];
    documents: SearchResultItem[];
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
              const url = section.useIdParam
                ? `${section.baseUrl}?id=${item.id}`
                : `${section.baseUrl}/${item.id}`;
              const isActive = flatIdx === activeIndex;

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
