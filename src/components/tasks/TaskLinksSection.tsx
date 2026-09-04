"use client";

import { useState, useEffect } from "react";
import { TaskLink, fetchTaskLinks, addTaskLink, removeTaskLink } from "@/lib/data/task-links";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/lib/hooks/useToast";
import { MESSAGES } from "@/lib/utils/messages";
import { X, Plus, Link2, Search } from "lucide-react";
import { fetchTasks } from "@/lib/data/tasks";

interface TaskLinksSectionProps {
  taskId: string;
}

const LINK_TYPES = ["related", "blocks", "blocked_by", "duplicates"] as const;

const LINK_TYPE_LABELS: Record<string, string> = {
  related: "Related",
  blocks: "Blocks",
  blocked_by: "Blocked by",
  duplicates: "Duplicates",
};

export function TaskLinksSection({ taskId }: TaskLinksSectionProps) {
  const [links, setLinks] = useState<TaskLink[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: string; title: string }[]>([]);
  const [linkType, setLinkType] = useState<string>("related");
  const supabase = createClient();
  const { showToast } = useToast();

  useEffect(() => {
    fetchTaskLinks(supabase, taskId).then(setLinks);
  }, [taskId, supabase]);

  useEffect(() => {
    if (!searchOpen || !searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const tasks = await fetchTasks(supabase, { search: searchQuery });
      setSearchResults(
        tasks
          .filter((t) => t.id !== taskId && !links.some((l) => l.linked_task_id === t.id))
          .slice(0, 5)
          .map((t) => ({ id: t.id, title: t.title }))
      );
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchOpen, taskId, links, supabase]);

  const handleLink = async (linkedTaskId: string) => {
    const ok = await addTaskLink(supabase, taskId, linkedTaskId, linkType);
    if (ok) {
      fetchTaskLinks(supabase, taskId).then(setLinks);
      showToast({ title: MESSAGES.TASK_LINKED, type: "success" });
    }
    setSearchOpen(false);
    setSearchQuery("");
  };

  const handleRemove = async (id: string) => {
    if (!confirm("Remove this link?")) return;
    await removeTaskLink(supabase, id);
    setLinks(links.filter((l) => l.id !== id));
    showToast({ title: MESSAGES.TASK_UNLINKED, type: "success" });
  };

  return (
    <div className="space-y-3">
      {links.map((link) => (
        <div
          key={link.id}
          className="group flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-gray-50 dark:hover:bg-gray-800/50"
        >
          <Link2 size={14} className="shrink-0 text-gray-400" />
          <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white truncate">
            {link.linked_task?.title || "Unknown task"}
          </span>
          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
            {LINK_TYPE_LABELS[link.link_type] || link.link_type}
          </span>
          <button
            onClick={() => handleRemove(link.id)}
            className="shrink-0 text-gray-400 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
          >
            <X size={14} />
          </button>
        </div>
      ))}

      {searchOpen && (
        <div className="rounded-lg border border-gray-200 p-2 dark:border-gray-700">
          <div className="mb-2 flex items-center gap-2">
            <select
              value={linkType}
              onChange={(e) => setLinkType(e.target.value)}
              className="rounded border border-gray-300 bg-white px-1.5 py-1 text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              {LINK_TYPES.map((lt) => (
                <option key={lt} value={lt}>
                  {LINK_TYPE_LABELS[lt]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Search size={14} className="text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks to link..."
              autoFocus
              className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none dark:text-white"
            />
          </div>
          {searchResults.length > 0 && (
            <div className="mt-2 space-y-1">
              {searchResults.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleLink(t.id)}
                  className="w-full rounded px-2 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  {t.title}
                </button>
              ))}
            </div>
          )}
          <div className="mt-2 flex justify-end">
            <button
              onClick={() => {
                setSearchOpen(false);
                setSearchQuery("");
              }}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!searchOpen && (
        <button
          onClick={() => setSearchOpen(true)}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-1 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:hover:bg-gray-800/50 dark:hover:text-gray-300"
        >
          <Plus size={14} />
          Link task
        </button>
      )}
    </div>
  );
}
