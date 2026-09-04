"use client";

import { useState, useEffect } from "react";
import { ChecklistItem, fetchChecklists, addChecklistItem, toggleChecklistItem, deleteChecklistItem } from "@/lib/data/checklists";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/lib/hooks/useToast";
import { MESSAGES } from "@/lib/utils/messages";
import { Check, X, Plus, ListChecks } from "lucide-react";

interface ChecklistSectionProps {
  taskId: string;
}

export function ChecklistSection({ taskId }: ChecklistSectionProps) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const { showToast } = useToast();

  useEffect(() => {
    fetchChecklists(supabase, taskId).then(setItems);
  }, [taskId, supabase]);

  const completed = items.filter((i) => i.is_completed).length;
  const total = items.length;
  const progress = total > 0 ? (completed / total) * 100 : 0;

  const handleAdd = async () => {
    if (!newTitle.trim() || loading) return;
    setLoading(true);
    const item = await addChecklistItem(supabase, taskId, newTitle.trim());
    if (item) {
      setItems([...items, item]);
      setNewTitle("");
      showToast({ title: MESSAGES.CHECKLIST_ITEM_ADDED, type: "success" });
    }
    setLoading(false);
  };

  const handleToggle = async (item: ChecklistItem) => {
    await toggleChecklistItem(supabase, item.id, !item.is_completed);
    setItems(items.map((i) => (i.id === item.id ? { ...i, is_completed: !i.is_completed } : i)));
  };

  const handleDelete = async (id: string) => {
    await deleteChecklistItem(supabase, id);
    setItems(items.filter((i) => i.id !== id));
  };

  return (
    <div className="space-y-3">
      {total > 0 && (
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className="h-full rounded-full bg-navo-blue transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {completed}/{total}
          </span>
        </div>
      )}

      {items.map((item) => (
        <div
          key={item.id}
          className="group flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-gray-50 dark:hover:bg-gray-800/50"
        >
          <button
            onClick={() => handleToggle(item)}
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
              item.is_completed
                ? "border-navo-blue bg-navo-blue text-white"
                : "border-gray-300 hover:border-navo-blue dark:border-gray-600"
            }`}
          >
            {item.is_completed && <Check size={12} />}
          </button>
          <span
            className={`flex-1 text-sm ${
              item.is_completed
                ? "text-gray-400 line-through dark:text-gray-500"
                : "text-gray-900 dark:text-white"
            }`}
          >
            {item.title}
          </span>
          <button
            onClick={() => handleDelete(item.id)}
            className="shrink-0 text-gray-400 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
          >
            <X size={14} />
          </button>
        </div>
      ))}

      <div className="flex items-center gap-2">
        <Plus size={14} className="shrink-0 text-gray-400" />
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Add subtask..."
          className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none dark:text-white"
        />
      </div>
    </div>
  );
}
