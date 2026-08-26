"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Decision,
  DecisionUser,
  DecisionStatusConfig,
} from "@/types/decision";
import { updateDecision } from "@/lib/data/decisions";
import { createClient } from "@/lib/supabase/client";

interface EditDecisionDialogProps {
  decision: Decision;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
  users: DecisionUser[];
  statuses: DecisionStatusConfig[];
  projects: { id: string; name: string }[];
  tags: { id: string; name: string; color: string }[];
  key?: string;
}

export function EditDecisionDialog({
  decision,
  open,
  onClose,
  onUpdated,
  users,
  statuses,
  projects,
  tags,
}: EditDecisionDialogProps) {
  const supabase = createClient();
  const [title, setTitle] = useState(decision.title);
  const [topic, setTopic] = useState(decision.topic || "");
  const [context, setContext] = useState(decision.context || "");
  const [proposedDecision, setProposedDecision] = useState(decision.proposed_decision || "");
  const [decisionText, setDecisionText] = useState(decision.decision_text || "");
  const [reason, setReason] = useState(decision.reason || "");
  const [alternatives, setAlternatives] = useState(decision.alternatives || "");
  const [ownerId, setOwnerId] = useState(decision.owner_id || "");
  const [projectId, setProjectId] = useState(decision.project_id || "");
  const [statusId, setStatusId] = useState(decision.status_id);
  const [selectedContributors, setSelectedContributors] = useState<string[]>(decision.contributors?.map((c) => c.user.id) || []);
  const [selectedTags, setSelectedTags] = useState<string[]>(decision.tags?.map((t) => t.id) || []);
  const [errors, setErrors] = useState<{ title?: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      setErrors({ title: "Decision title is required" });
      return;
    }

    if (!statusId) {
      return;
    }

    setIsSaving(true);
    try {
      const updated = await updateDecision(supabase, decision.id, {
        title: title.trim(),
        topic: topic.trim() || undefined,
        context: context.trim() || undefined,
        proposed_decision: proposedDecision.trim() || undefined,
        decision_text: decisionText.trim() || undefined,
        reason: reason.trim() || undefined,
        alternatives: alternatives.trim() || undefined,
        owner_id: ownerId || undefined,
        project_id: projectId || undefined,
        status_id: statusId,
      });

      if (updated) {
        onUpdated();
        onClose();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const toggleContributor = (userId: string) => {
    setSelectedContributors((prev) =>
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
    <Dialog open={open} onClose={onClose} title="Edit Decision" maxWidth="lg">
      <div className="space-y-4">
        <Input
          label="Decision Title"
          placeholder="What needs to be decided?"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (errors.title) setErrors({});
          }}
          error={errors.title}
        />

        <Input
          label="Topic"
          placeholder="What area does this fall under?"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Context
          </label>
          <textarea
            placeholder="What's the background and why is this decision needed?"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            rows={3}
            className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-navo-blue focus:outline-none focus:ring-1 focus:ring-navo-blue dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Proposed Decision
          </label>
          <textarea
            placeholder="What's the proposed course of action?"
            value={proposedDecision}
            onChange={(e) => setProposedDecision(e.target.value)}
            rows={3}
            className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-navo-blue focus:outline-none focus:ring-1 focus:ring-navo-blue dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Decision
          </label>
          <textarea
            placeholder="What was decided?"
            value={decisionText}
            onChange={(e) => setDecisionText(e.target.value)}
            rows={3}
            className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-navo-blue focus:outline-none focus:ring-1 focus:ring-navo-blue dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Reason
          </label>
          <textarea
            placeholder="Why was this decision made?"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-navo-blue focus:outline-none focus:ring-1 focus:ring-navo-blue dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Alternatives
          </label>
          <textarea
            placeholder="What other options were considered?"
            value={alternatives}
            onChange={(e) => setAlternatives(e.target.value)}
            rows={2}
            className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-navo-blue focus:outline-none focus:ring-1 focus:ring-navo-blue dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select
            label="Owner"
            value={ownerId}
            onChange={(e) => setOwnerId(e.target.value)}
            placeholder="Unassigned"
            options={users.map((u) => ({ value: u.id, label: u.name }))}
          />
          <Select
            label="Project"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            placeholder="No project"
            options={projects.map((p) => ({ value: p.id, label: p.name }))}
          />
          <Select
            label="Status"
            value={statusId}
            onChange={(e) => setStatusId(e.target.value)}
            placeholder="Select status"
            options={statuses.map((s) => ({ value: s.id, label: s.name }))}
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Contributors
          </label>
          <div className="flex flex-wrap gap-2">
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => toggleContributor(user.id)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  selectedContributors.includes(user.id)
                    ? "bg-navo-blue text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
                }`}
              >
                <span
                  className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold"
                  style={{
                    backgroundColor: selectedContributors.includes(user.id)
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
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
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
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
