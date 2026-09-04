"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, Search, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tag } from "@/types/index";
import { createClient } from "@/lib/supabase/client";
import {
  fetchTags,
  createTag,
  updateTag,
  deleteTag,
} from "@/lib/data/tags";

const TAG_COLORS = [
  "#EF4444",
  "#F59E0B",
  "#10B981",
  "#0064F0",
  "#8B5CF6",
  "#EC4899",
  "#6B7280",
  "#14B8A6",
  "#F97316",
  "#6366F1",
];

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [tagName, setTagName] = useState("");
  const [tagColor, setTagColor] = useState(TAG_COLORS[0]);
  const [tagCategory, setTagCategory] = useState("");
  const [errors, setErrors] = useState<{ name?: string }>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const data = await fetchTags(supabase);
      if (!cancelled) {
        setTags(data);
        setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const filteredTags = useMemo(() => {
    if (!searchQuery) return tags;
    const q = searchQuery.toLowerCase();
    return tags.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.category?.toLowerCase().includes(q)
    );
  }, [tags, searchQuery]);

  const categories = useMemo(() => {
    const cats = [...new Set(tags.map((t) => t.category).filter(Boolean))];
    return cats as string[];
  }, [tags]);

  const resetForm = () => {
    setTagName("");
    setTagColor(TAG_COLORS[0]);
    setTagCategory("");
    setErrors({});
  };

  const handleCreate = () => {
    resetForm();
    setEditingTag(null);
    setDialogOpen(true);
  };

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag);
    setTagName(tag.name);
    setTagColor(tag.color);
    setTagCategory(tag.category || "");
    setErrors({});
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!tagName.trim()) {
      setErrors({ name: "Tag name is required" });
      return;
    }

    if (editingTag) {
      const updated = await updateTag(supabase, editingTag.id, {
        name: tagName.trim(),
        color: tagColor,
        category: tagCategory.trim() || undefined,
      });
      if (updated) {
        setTags((prev) => prev.map((t) => (t.id === editingTag.id ? updated : t)));
      }
    } else {
      const created = await createTag(supabase, {
        name: tagName.trim(),
        color: tagColor,
        category: tagCategory.trim() || undefined,
      });
      if (created) {
        setTags((prev) => [...prev, created]);
      }
    }

    resetForm();
    setEditingTag(null);
    setDialogOpen(false);
  };

  const handleDelete = async (tagId: string) => {
    setDeletingId(tagId);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    await deleteTag(supabase, deletingId);
    setTags((prev) => prev.filter((t) => t.id !== deletingId));
    setDeletingId(null);
  };

  return (
    <div className="space-y-6">
      <Link
        href="/settings"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-4"
      >
        <ArrowLeft size={14} />
        Back to Settings
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Tags
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage tags for tasks, projects, and documents
          </p>
        </div>
        <Button onClick={handleCreate} className="shrink-0">
          <Plus size={16} />
          New Tag
        </Button>
      </div>

      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <Input
          placeholder="Search tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800"
            />
          ))}
        </div>
      ) : filteredTags.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {searchQuery ? "No tags match your search." : "No tags yet. Create your first tag."}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="overflow-x-auto rounded-lg border">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                  Tag
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                  Created
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTags.map((tag) => (
                <tr
                  key={tag.id}
                  className="border-b border-gray-100 last:border-0 dark:border-gray-800/50"
                >
                  <td className="px-4 py-3">
                    <Badge color={tag.color}>{tag.name}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    {tag.category || "-"}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {new Date(tag.created_at).toLocaleDateString("en-NG")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleEdit(tag)}
                        className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(tag.id)}
                        className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingTag(null);
          resetForm();
        }}
        title={editingTag ? "Edit Tag" : "Create Tag"}
      >
        <div className="space-y-4">
          <Input
            label="Tag Name"
            placeholder="e.g., Bug, Feature, Urgent"
            value={tagName}
            onChange={(e) => {
              setTagName(e.target.value);
              if (errors.name) setErrors({});
            }}
            error={errors.name}
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {TAG_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setTagColor(color)}
                  className={`h-8 w-8 rounded-full transition-transform ${
                    tagColor === color ? "scale-110 ring-2 ring-offset-2 ring-gray-400" : ""
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <Input
            label="Category (optional)"
            placeholder="e.g., priority, status, type"
            value={tagCategory}
            onChange={(e) => setTagCategory(e.target.value)}
          />

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
            <Button
              variant="secondary"
              onClick={() => {
                setDialogOpen(false);
                setEditingTag(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingTag ? "Update Tag" : "Create Tag"}
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={!!deletingId}
        onClose={() => setDeletingId(null)}
        title="Delete Tag"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Are you sure you want to delete this tag? It will be removed from all
            associated tasks, projects, and documents.
          </p>
          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
            <Button variant="secondary" onClick={() => setDeletingId(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
