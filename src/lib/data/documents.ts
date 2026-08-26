import { SupabaseClient } from "@supabase/supabase-js";
import {
  DocDocument,
  DocumentStatusConfig,
  DocumentVersion,
  CreateDocumentInput,
} from "@/types/document";

const DOCUMENT_SELECT = `
  *,
  author:profiles!documents_author_id_fkey(id, name, email, avatar_url),
  owner:profiles!documents_owner_id_fkey(id, name, email, avatar_url),
  project:projects(id, name),
  status:document_statuses(id, name, color),
  versions:document_versions(id, document_id, version_number, file_url, file_name, file_size, uploaded_by, notes, created_at, uploader:profiles(id, name, email, avatar_url)),
  tags:document_tags(tag:tags(id, name, color))
`;

function mapDocument(row: Record<string, unknown>): DocDocument {
  const author = row.author as Record<string, unknown> | null;
  const owner = row.owner as Record<string, unknown> | null;
  const project = row.project as Record<string, unknown> | null;
  const status = row.status as Record<string, unknown> | null;
  const versionRows = row.versions as
    | (Record<string, unknown> & { uploader: Record<string, unknown> | null })[]
    | null;
  const tagRows = row.tags as { tag: Record<string, unknown> }[] | null;

  return {
    id: row.id as string,
    title: row.title as string,
    description: row.description as string | null,
    category: row.category as string | null,
    author_id: row.author_id as string,
    owner_id: row.owner_id as string,
    project_id: row.project_id as string | null,
    status_id: row.status_id as string,
    current_version_id: row.current_version_id as string | null,
    is_archived: row.is_archived as boolean,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    author: author
      ? {
          id: author.id as string,
          name: author.name as string,
          email: author.email as string,
          avatar_url: author.avatar_url as string | null,
        }
      : undefined,
    owner: owner
      ? {
          id: owner.id as string,
          name: owner.name as string,
          email: owner.email as string,
          avatar_url: owner.avatar_url as string | null,
        }
      : undefined,
    project: project
      ? {
          id: project.id as string,
          name: project.name as string,
        }
      : null,
    status: status
      ? {
          id: status.id as string,
          name: status.name as string,
          color: status.color as string,
        }
      : undefined,
    versions: versionRows
      ? versionRows.map((v) => ({
          id: v.id as string,
          document_id: v.document_id as string,
          version_number: v.version_number as number,
          file_url: v.file_url as string,
          file_name: v.file_name as string,
          file_size: v.file_size as number | null,
          uploaded_by: v.uploaded_by as string,
          notes: v.notes as string | null,
          created_at: v.created_at as string,
          uploader: v.uploader
            ? {
                id: v.uploader.id as string,
                name: v.uploader.name as string,
                email: v.uploader.email as string,
                avatar_url: v.uploader.avatar_url as string | null,
              }
            : undefined,
        }))
      : [],
    tags: tagRows
      ? tagRows
          .filter((tr) => tr.tag)
          .map((tr) => ({
            id: tr.tag.id as string,
            name: tr.tag.name as string,
            color: tr.tag.color as string,
          }))
      : [],
  };
}

export async function fetchDocuments(
  supabase: SupabaseClient,
  filters?: {
    status_id?: string;
    category?: string;
    search?: string;
    include_archived?: boolean;
    sort?: "newest" | "oldest" | "title" | "most_versions";
  }
): Promise<DocDocument[]> {
  let query = supabase
    .from("documents")
    .select(DOCUMENT_SELECT)
    .order("created_at", { ascending: false });

  if (!filters?.include_archived) {
    query = query.eq("is_archived", false);
  }

  if (filters?.status_id) {
    query = query.eq("status_id", filters.status_id);
  }

  if (filters?.category) {
    query = query.eq("category", filters.category);
  }

  if (filters?.search) {
    query = query.or(
      `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching documents:", error);
    return [];
  }

  const documents = (data || []).map(mapDocument);

  if (filters?.sort === "title") {
    documents.sort((a, b) => a.title.localeCompare(b.title));
  } else if (filters?.sort === "oldest") {
    documents.reverse();
  } else if (filters?.sort === "most_versions") {
    documents.sort(
      (a, b) => (b.versions?.length || 0) - (a.versions?.length || 0)
    );
  }

  return documents;
}

export async function fetchDocumentById(
  supabase: SupabaseClient,
  documentId: string
): Promise<DocDocument | null> {
  const { data, error } = await supabase
    .from("documents")
    .select(DOCUMENT_SELECT)
    .eq("id", documentId)
    .single();

  if (error) {
    console.error("Error fetching document:", error);
    return null;
  }

  return mapDocument(data);
}

export async function fetchDocumentStatuses(
  supabase: SupabaseClient
): Promise<DocumentStatusConfig[]> {
  const { data, error } = await supabase
    .from("document_statuses")
    .select("id, name, color")
    .order("position");

  if (error) {
    console.error("Error fetching document statuses:", error);
    return [];
  }

  return (data || []).map((s) => ({
    id: s.id,
    name: s.name,
    color: s.color,
  }));
}

export async function createDocument(
  supabase: SupabaseClient,
  input: CreateDocumentInput
): Promise<DocDocument | null> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  if (!userId) {
    console.error("No authenticated user");
    return null;
  }

  const { tag_ids, ...documentData } = input;

  const { data: document, error: documentError } = await supabase
    .from("documents")
    .insert({
      ...documentData,
      author_id: userId,
      description: input.description || null,
      category: input.category || null,
      project_id: input.project_id || null,
    })
    .select(DOCUMENT_SELECT)
    .single();

  if (documentError) {
    console.error("Error creating document:", documentError);
    return null;
  }

  if (tag_ids && tag_ids.length > 0) {
    const tagInserts = tag_ids.map((tag_id) => ({
      document_id: document.id,
      tag_id,
    }));

    const { error: tagError } = await supabase
      .from("document_tags")
      .insert(tagInserts);

    if (tagError) {
      console.error("Error adding document tags:", tagError);
    }
  }

  return mapDocument(document);
}

export async function updateDocument(
  supabase: SupabaseClient,
  documentId: string,
  input: Partial<Pick<DocDocument, "title" | "description" | "category" | "owner_id" | "project_id" | "status_id">>
): Promise<DocDocument | null> {
  const update: Record<string, unknown> = {};
  if (input.title !== undefined) update.title = input.title;
  if (input.description !== undefined) update.description = input.description || null;
  if (input.category !== undefined) update.category = input.category || null;
  if (input.owner_id !== undefined) update.owner_id = input.owner_id;
  if (input.project_id !== undefined) update.project_id = input.project_id || null;
  if (input.status_id !== undefined) update.status_id = input.status_id;

  const { data, error } = await supabase
    .from("documents")
    .update(update)
    .eq("id", documentId)
    .select(DOCUMENT_SELECT)
    .single();

  if (error) {
    console.error("Error updating document:", error);
    return null;
  }

  return mapDocument(data);
}

export async function archiveDocument(
  supabase: SupabaseClient,
  documentId: string
): Promise<void> {
  const { error } = await supabase
    .from("documents")
    .update({ is_archived: true })
    .eq("id", documentId);

  if (error) {
    console.error("Error archiving document:", error);
  }
}

export async function addDocumentVersion(
  supabase: SupabaseClient,
  documentId: string,
  input: {
    file_url: string;
    file_name: string;
    file_size?: number | null;
    notes?: string | null;
  }
): Promise<DocumentVersion | null> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  if (!userId) {
    console.error("No authenticated user");
    return null;
  }

  const { data: existingVersions, error: countError } = await supabase
    .from("document_versions")
    .select("version_number")
    .eq("document_id", documentId)
    .order("version_number", { ascending: false })
    .limit(1);

  if (countError) {
    console.error("Error fetching version count:", countError);
    return null;
  }

  const nextVersionNumber =
    existingVersions && existingVersions.length > 0
      ? existingVersions[0].version_number + 1
      : 1;

  const { data: version, error: versionError } = await supabase
    .from("document_versions")
    .insert({
      document_id: documentId,
      version_number: nextVersionNumber,
      file_url: input.file_url,
      file_name: input.file_name,
      file_size: input.file_size || null,
      uploaded_by: userId,
      notes: input.notes || null,
    })
    .select("id, document_id, version_number, file_url, file_name, file_size, uploaded_by, notes, created_at")
    .single();

  if (versionError) {
    console.error("Error adding document version:", versionError);
    return null;
  }

  await supabase
    .from("documents")
    .update({ current_version_id: version.id })
    .eq("id", documentId);

  return {
    id: version.id,
    document_id: version.document_id,
    version_number: version.version_number,
    file_url: version.file_url,
    file_name: version.file_name,
    file_size: version.file_size,
    uploaded_by: version.uploaded_by,
    notes: version.notes,
    created_at: version.created_at,
  };
}
