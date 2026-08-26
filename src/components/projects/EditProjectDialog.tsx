"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Project, ProjectUser, ProjectStatusConfig } from "@/types/project";

interface EditProjectDialogProps {
  open: boolean;
  onClose: () => void;
  project: Project;
  onSave: (input: {
    name: string;
    description: string;
    owner_id: string;
    status_id: string;
    start_date: string;
    target_date: string;
  }) => void;
  users: ProjectUser[];
  statuses: ProjectStatusConfig[];
}

export function EditProjectDialog({
  open,
  onClose,
  project,
  onSave,
  users,
  statuses,
}: EditProjectDialogProps) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || "");
  const [ownerId, setOwnerId] = useState(project.owner_id);
  const [statusId, setStatusId] = useState(project.status_id);
  const [startDate, setStartDate] = useState(project.start_date || "");
  const [targetDate, setTargetDate] = useState(project.target_date || "");
  const [errors, setErrors] = useState<{ name?: string }>({});

  const handleSubmit = () => {
    if (!name.trim()) {
      setErrors({ name: "Project name is required" });
      return;
    }

    onSave({
      name: name.trim(),
      description: description.trim(),
      owner_id: ownerId,
      status_id: statusId,
      start_date: startDate,
      target_date: targetDate,
    });

    onClose();
  };

  return (
    <Dialog key={project.id} open={open} onClose={onClose} title="Edit Project" maxWidth="lg">
      <div className="space-y-4">
        <Input
          label="Project Name"
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

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Owner"
            value={ownerId}
            onChange={(e) => setOwnerId(e.target.value)}
            options={users.map((u) => ({ value: u.id, label: u.name }))}
          />
          <Select
            label="Status"
            value={statusId}
            onChange={(e) => setStatusId(e.target.value)}
            options={statuses.map((s) => ({ value: s.id, label: s.name }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
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

        <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Save Changes</Button>
        </div>
      </div>
    </Dialog>
  );
}
