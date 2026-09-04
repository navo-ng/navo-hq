"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  FileText,
  GitBranch,
  Download,
  User,
  Folder,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EditDocumentDialog } from "@/components/documents/EditDocumentDialog";
import { DeleteDocumentDialog } from "@/components/documents/DeleteDocumentDialog";
import { DocDocument, DocumentStatusConfig, DocumentUser } from "@/types/document";
import { createClient } from "@/lib/supabase/client";
import {
  fetchDocumentById,
  fetchDocumentStatuses,
} from "@/lib/data/documents";
import { fetchAllUsers, fetchAllTags } from "@/lib/data/projects";
import { CommentThread } from "@/components/comments/CommentThread";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.id as string;

  const [document, setDocument] = useState<DocDocument | null>(null);
  const [statuses, setStatuses] = useState<DocumentStatusConfig[]>([]);
  const [users, setUsers] = useState<DocumentUser[]>([]);
  const [tags, setTags] = useState<{ id: string; name: string; color: string }[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [docData, statusData, userData, tagData] = await Promise.all([
          fetchDocumentById(supabase, documentId),
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
          setDocument(docData);
          setStatuses(statusData);
          setUsers(userData);
          setTags(tagData);
          setProjects(
            (projectData || []).map((p: { id: string; name: string }) => ({
              id: p.id,
              name: p.name,
            }))
          );
        }
      } catch (err) {
        console.error("Failed to load document:", err);
        setLoadError("Failed to load document. Please try again.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [supabase, documentId]);

  const refetchDocument = async () => {
    const docData = await fetchDocumentById(supabase, documentId);
    setDocument(docData);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
        <div className="h-10 w-2/3 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
        <div className="h-64 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 dark:text-red-400">{loadError}</p>
        <button onClick={() => window.location.reload()} className="mt-4 text-sm text-navo-blue hover:underline">Retry</button>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.push("/documents")}>
          <ArrowLeft size={16} />
          Back to Documents
        </Button>
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Document not found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.push("/documents")}>
        <ArrowLeft size={16} />
        Back to Documents
      </Button>

      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="space-y-1 min-w-0 flex-1">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {document.title}
            </h1>
            {document.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {document.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {document.status && (
              <Badge color={document.status.color}>{document.status.name}</Badge>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setEditDialogOpen(true)}
            >
              <Pencil size={14} />
              Edit
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 size={14} />
              Delete
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          {document.category && (
            <span className="flex items-center gap-1">
              <FileText size={12} />
              {document.category}
            </span>
          )}
          {document.project && (
            <Link
              href={`/projects/${document.project.id}`}
              className="flex items-center gap-1 text-navo-blue hover:underline"
            >
              <Folder size={12} />
              {document.project.name}
            </Link>
          )}
          {document.owner && (
            <span className="flex items-center gap-1">
              <User size={12} />
              {document.owner.name}
            </span>
          )}
          {document.versions && document.versions.length > 0 && (
            <span className="flex items-center gap-1">
              <GitBranch size={12} />
              {document.versions.length}{" "}
              {document.versions.length === 1 ? "version" : "versions"}
            </span>
          )}
        </div>
      </div>

      {document.tags && document.tags.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
            Tags
          </h3>
          <div className="flex flex-wrap gap-2">
            {document.tags.map((tag) => (
              <Badge key={tag.id} color={tag.color}>
                {tag.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {document.versions && document.versions.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
            Versions
          </h3>
          <div className="space-y-3">
            {[...document.versions]
              .sort((a, b) => b.version_number - a.version_number)
              .map((version) => (
                <div
                  key={version.id}
                  className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-800"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        v{version.version_number}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {version.file_name}
                      </span>
                      {version.file_size && (
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          ({formatFileSize(version.file_size)})
                        </span>
                      )}
                    </div>
                    {version.notes && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {version.notes}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      {version.uploader && (
                        <span>{version.uploader.name}</span>
                      )}
                      <span>{formatDate(version.created_at)}</span>
                    </div>
                  </div>
                  <a
                    href={version.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition-colors"
                  >
                    <Download size={16} />
                  </a>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
          {document.author && (
            <div className="flex items-center gap-2">
              <span className="font-medium">Created by</span>
              <span
                className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium text-white"
                style={{ backgroundColor: "#0064F0" }}
              >
                {document.author.name.charAt(0).toUpperCase()}
              </span>
              {document.author.name}
              <span className="text-gray-400">on {formatDate(document.created_at)}</span>
            </div>
          )}
          {document.updated_at !== document.created_at && (
            <div className="flex items-center gap-2">
              <Calendar size={12} />
              <span className="font-medium">Updated</span>
              {formatDate(document.updated_at)}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
          Comments
        </h3>
        <CommentThread entityType="document" entityId={documentId} />
      </div>

      <EditDocumentDialog
        document={document}
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onUpdated={refetchDocument}
        users={users}
        statuses={statuses}
        tags={tags}
        projects={projects}
      />
      <DeleteDocumentDialog
        document={document}
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onDeleted={() => router.push("/documents")}
      />
    </div>
  );
}
