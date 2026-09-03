"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/hooks/useToast";
import { MESSAGES } from "@/lib/utils/messages";
import { TemplatePicker } from "./TemplatePicker";
import {
  ProjectUser,
  ProjectStatusConfig,
} from "@/types/project";
import { FileText } from "lucide-react";

interface CreateProjectDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (project: {
    name: string;
    description: string;
    owner_id: string;
    status_id: string;
    start_date: string;
    target_date: string;
    member_ids: string[];
    tag_ids: string[];
  }) => void;
  users: ProjectUser[];
  statuses: ProjectStatusConfig[];
  tags: { id: string; name: string; color: string }[];
}

export function CreateProjectDialog({
  open,
  onClose,
  onCreate,
  users,
  statuses,
  tags,
}: CreateProjectDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [statusId, setStatusId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ name?: string }>({});
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  const { showToast } = useToast();

  const handleSubmit = () => {
    if (!name.trim()) {
      setErrors({ name: "Project name is required" });
      return;
    }

    if (!ownerId) {
      return;
    }

    if (!statusId) {
      return;
    }

    try {
      onCreate({
        name: name.trim(),
        description: description.trim(),
        owner_id: ownerId,
        status_id: statusId,
        start_date: startDate,
        target_date: targetDate,
        member_ids: selectedMembers,
        tag_ids: selectedTags,
      });

      showToast({ title: MESSAGES.PROJECT_CREATED, type: "success" });
    } catch {
      showToast({ title: MESSAGES.PROJECT_CREATE_FAILED, type: "error" });
    }

    resetForm();
    onClose();
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setOwnerId("");
    setStatusId("");
    setStartDate("");
    setTargetDate("");
    setSelectedMembers([]);
    setSelectedTags([]);
    setErrors({});
    setCreatedProjectId(null);
  };

  const toggleMember = (userId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} title="Create Project" maxWidth="lg">
        <div className="space-y-4">
          <Input
            label="Project Name"
            placeholder="What are you working on?"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors({});
            }}
            error={errors.name}
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              placeholder="What's this project about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-navo-blue focus:outline-none focus:ring-1 focus:ring-navo-blue dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Owner"
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
              placeholder="Select owner"
              options={users.map((u) => ({ value: u.id, label: u.name }))}
            />
            <Select
              label="Status"
              value={statusId}
              onChange={(e) => setStatusId(e.target.value)}
              placeholder="Select status"
              options={statuses.map((s) => ({ value: s.id, label: s.name }))}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              label="Target Date"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Team Members
            </label>
            <div className="flex flex-wrap gap-2">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => toggleMember(user.id)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    selectedMembers.includes(user.id)
                      ? "bg-navo-blue text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                  }`}
                >
                  <span
                    className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold"
                    style={{
                      backgroundColor: selectedMembers.includes(user.id)
                        ? "rgba(255,255,255,0.2)"
                        : "#0064F0",
                      color: "white",
                    }}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  {user.name}
                </button>
              ))}
            </div>
          </div>

          {tags.length > 0 && (
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      selectedTags.includes(tag.id)
                        ? "text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                    }`}
                    style={
                      selectedTags.includes(tag.id)
                        ? { backgroundColor: tag.color }
                        : undefined
                    }
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Create Project</Button>
          </div>
        </div>
      </Dialog>

      {createdProjectId && (
        <TemplatePicker
          open={templatePickerOpen}
          onClose={() => {
            setTemplatePickerOpen(false);
            setCreatedProjectId(null);
          }}
          projectId={createdProjectId}
        />
      )}
    </>
  );
}
