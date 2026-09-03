"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  fetchAttachments,
  uploadAttachment,
  deleteAttachment,
  formatFileSize,
  TaskAttachment,
} from "@/lib/data/attachments";
import { useToast } from "@/lib/hooks/useToast";
import { MESSAGES } from "@/lib/utils/messages";
import { Image, FileText, File, Upload, Trash2, Download } from "lucide-react";

interface AttachmentSectionProps {
  taskId: string;
  onAttachmentsChanged?: () => void;
}

function getFileIcon(fileType: string | null) {
  if (!fileType) return <File size={16} className="text-gray-400" />;
  if (fileType.startsWith("image/")) return <Image size={16} className="text-blue-500" />;
  if (fileType === "application/pdf") return <FileText size={16} className="text-red-500" />;
  return <File size={16} className="text-gray-400" />;
}

export function AttachmentSection({ taskId, onAttachmentsChanged }: AttachmentSectionProps) {
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  const { showToast } = useToast();

  const loadAttachments = useCallback(async () => {
    const data = await fetchAttachments(supabase, taskId);
    setAttachments(data);
  }, [supabase, taskId]);

  useEffect(() => {
    loadAttachments();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setCurrentUserId(data.user.id);
    });
  }, [loadAttachments, supabase]);

  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setIsUploading(true);
    let successCount = 0;
    for (const file of fileArray) {
      const result = await uploadAttachment(supabase, taskId, file);
      if (result) successCount++;
    }
    setIsUploading(false);

    if (successCount > 0) {
      showToast({ title: MESSAGES.ATTACHMENT_UPLOADED, type: "success" });
      loadAttachments();
      onAttachmentsChanged?.();
    } else {
      showToast({ title: MESSAGES.ATTACHMENT_ERROR, type: "error" });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDelete = async (attachment: TaskAttachment) => {
    const success = await deleteAttachment(supabase, attachment.id, attachment.file_url);
    if (success) {
      showToast({ title: MESSAGES.ATTACHMENT_DELETED, type: "success" });
      loadAttachments();
      onAttachmentsChanged?.();
    } else {
      showToast({ title: MESSAGES.ATTACHMENT_ERROR, type: "error" });
    }
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 transition-colors ${
          isDragging
            ? "border-navo-blue bg-navo-blue/5"
            : "border-gray-300 hover:border-gray-400 dark:border-gray-700 dark:hover:border-gray-600"
        }`}
      >
        <Upload size={20} className={`mb-1 ${isDragging ? "text-navo-blue" : "text-gray-400"}`} />
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {isUploading ? "Uploading..." : "Drop files here or click to browse"}
        </span>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="hidden"
        />
      </div>

      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
            >
              {getFileIcon(att.file_type)}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                  {att.file_name}
                </p>
                <p className="text-xs text-gray-400">
                  {formatFileSize(att.file_size)}
                  {att.user && <> · {att.user.name}</>}
                  {" · "}
                  {new Date(att.created_at).toLocaleDateString()}
                </p>
              </div>
              <a
                href={att.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
                title="Download"
              >
                <Download size={14} />
              </a>
              {att.user_id === currentUserId && (
                <button
                  onClick={() => handleDelete(att)}
                  className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
