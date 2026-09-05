"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DocumentCard } from "@/components/documents/DocumentCard";
import { DocumentFilters } from "@/components/documents/DocumentFilters";
import { CreateDocumentDialog } from "@/components/documents/CreateDocumentDialog";
import { EditDocumentDialog } from "@/components/documents/EditDocumentDialog";
import { DeleteDocumentDialog } from "@/components/documents/DeleteDocumentDialog";
import { DocDocument, DocumentStatusConfig, DocumentUser } from "@/types/document";
import { createClient } from "@/lib/supabase/client";
import {
  fetchDocuments,
  fetchDocumentStatuses,
  createDocument,
} from "@/lib/data/documents";
import { fetchAllUsers, fetchAllTags } from "@/lib/data/projects";
import { ErrorState } from "@/components/ui/error-state";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";

export default function DocumentsPage() {
  const { role } = useCurrentUser();
  const isViewer = role === "viewer";
  const [documents, setDocuments] = useState<DocDocument[]>([]);
  const [statuses, setStatuses] = useState<DocumentStatusConfig[]>([]);
  const [users, setUsers] = useState<DocumentUser[]>([]);
  const [tags, setTags] = useState<{ id: string; name: string; color: string }[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<DocDocument | null>(null);
  const [deletingDocument, setDeletingDocument] = useState<DocDocument | null>(null);

  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [docData, statusData, userData, tagData] = await Promise.all([
          fetchDocuments(supabase, { sort: "newest" }),
          fetchDocumentStatuses(supabase),
          fetchAllUsers(supabase),
          fetchAllTags(supabase),
        ]);

        const { data: projectData } = await supabase
          .from("projects")
          .select("id, name")
          .eq("is_archived", false)
          .order("name");

        if (!cancelled) {
          setDocuments(docData);
          setStatuses(statusData);
          setUsers(userData);
          setTags(tagData);
          setProjects(
            (projectData || []).map((p: { id: string; name: string }) => ({
              id: p.id,
              name: p.name,
            }))
          );
          setIsLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError("Failed to load documents. Please try again.");
          setIsLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const categories = useMemo(() => {
    const seen = new Set<string>();
    for (const doc of documents) {
      if (doc.category) {
        seen.add(doc.category);
      }
    }
    return Array.from(seen).sort();
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    let result = [...documents];

    if (statusFilter !== "all") {
      result = result.filter((d) => d.status_id === statusFilter);
    }

    if (categoryFilter !== "all") {
      result = result.filter((d) => d.category === categoryFilter);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.description?.toLowerCase().includes(q) ||
          d.owner?.name.toLowerCase().includes(q) ||
          d.tags?.some((t) => t.name.toLowerCase().includes(q))
      );
    }

    if (sort === "title") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === "oldest") {
      result.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    } else if (sort === "most_versions") {
      result.sort(
        (a, b) => (b.versions?.length || 0) - (a.versions?.length || 0)
      );
    }

    return result;
  }, [documents, statusFilter, categoryFilter, searchQuery, sort]);

  const stats = useMemo(() => {
    const countByStatus = (name: string) =>
      documents.filter(
        (d) => d.status?.name?.toLowerCase() === name.toLowerCase()
      ).length;

    return {
      total: documents.length,
      draft: countByStatus("Draft"),
      inReview: countByStatus("In Review"),
      approved: countByStatus("Approved"),
      archived: documents.filter((d) => d.is_archived).length,
    };
  }, [documents]);

  const refetchDocuments = async () => {
    const data = await fetchDocuments(supabase, { sort: "newest" });
    setDocuments(data);
  };

  const handleCreateDocument = async (input: {
    title: string;
    description: string;
    category: string;
    owner_id: string;
    project_id: string;
    status_id: string;
    tag_ids: string[];
  }) => {
    const doc = await createDocument(supabase, {
      title: input.title,
      description: input.description || undefined,
      category: input.category || undefined,
      owner_id: input.owner_id,
      project_id: input.project_id || undefined,
      status_id: input.status_id,
      tag_ids: input.tag_ids,
    });
    if (doc) {
      setDocuments((prev) => [doc, ...prev]);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Documents
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage and track your team&apos;s documents
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Documents</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage and track your team&apos;s documents</p>
        </div>
        <ErrorState message={error} onRetry={() => { setError(null); setIsLoading(true); window.location.reload(); }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Documents
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage and track your team&apos;s documents
          </p>
        </div>
        {!isViewer && (
          <Button onClick={() => setCreateDialogOpen(true)} className="shrink-0">
            <Plus size={16} />
            New Document
          </Button>
        )}
      </div>

      {documents.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center dark:border-gray-800 dark:bg-gray-900">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-navo-light dark:bg-navo-blue/10">
            <svg
              className="h-6 w-6 text-navo-blue"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
            No documents yet
          </h3>
          {isViewer ? (
            <p className="mx-auto max-w-sm text-sm text-gray-500 dark:text-gray-400">
              No documents have been created yet.
            </p>
          ) : (
            <>
              <p className="mb-6 mx-auto max-w-sm text-sm text-gray-500 dark:text-gray-400">
                Documents help your team store, share, and track important files.
                Create your first document to get started.
              </p>
              <button
                onClick={() => setCreateDialogOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-navo-blue px-4 py-2 text-sm font-medium text-white hover:bg-navo-deep transition-colors"
              >
                <Plus size={16} />
                Create your first document
              </button>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
              <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {stats.total}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
              <p className="text-xs text-gray-500 dark:text-gray-400">Draft</p>
              <p className="text-xl font-bold text-navo-blue">{stats.draft}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                In Review
              </p>
              <p className="text-xl font-bold text-amber-500">
                {stats.inReview}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Approved
              </p>
              <p className="text-xl font-bold text-navo-green">
                {stats.approved}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Archived
              </p>
              <p className="text-xl font-bold text-gray-400">
                {stats.archived}
              </p>
            </div>
          </div>

          <DocumentFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            categoryFilter={categoryFilter}
            onCategoryFilterChange={setCategoryFilter}
            sort={sort}
            onSortChange={setSort}
            statuses={statuses}
            categories={categories}
          />

          {filteredDocuments.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {searchQuery || statusFilter !== "all" || categoryFilter !== "all"
                  ? "No documents match your filters."
                  : "No documents yet. Create your first document to get started."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredDocuments.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  onEdit={setEditingDocument}
                  onDelete={setDeletingDocument}
                  isViewer={isViewer}
                />
              ))}
            </div>
          )}
        </>
      )}

      <CreateDocumentDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onCreate={handleCreateDocument}
        users={users}
        statuses={statuses}
        tags={tags}
        projects={projects}
      />

      {editingDocument && (
        <EditDocumentDialog
          key={editingDocument.id}
          document={editingDocument}
          open={!!editingDocument}
          onClose={() => setEditingDocument(null)}
          onUpdated={refetchDocuments}
          users={users}
          statuses={statuses}
          tags={tags}
          projects={projects}
        />
      )}

      {deletingDocument && (
        <DeleteDocumentDialog
          document={deletingDocument}
          open={!!deletingDocument}
          onClose={() => setDeletingDocument(null)}
          onDeleted={refetchDocuments}
        />
      )}
    </div>
  );
}
