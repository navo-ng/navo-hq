"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Send,
  Webhook,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import {
  fetchWebhooks,
  createWebhook,
  deleteWebhook,
  toggleWebhook,
  sendTestWebhook,
  Webhook as WebhookType,
  WEBHOOK_EVENTS,
} from "@/lib/data/webhooks";
import { MESSAGES } from "@/lib/utils/messages";

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ name?: string; url?: string }>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const data = await fetchWebhooks(supabase);
      if (!cancelled) {
        setWebhooks(data);
        setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const resetForm = () => {
    setName("");
    setUrl("");
    setSecret("");
    setSelectedEvents([]);
    setErrors({});
  };

  const toggleEvent = (event: string) => {
    setSelectedEvents((prev) =>
      prev.includes(event)
        ? prev.filter((e) => e !== event)
        : [...prev, event]
    );
  };

  const handleSubmit = async () => {
    const newErrors: { name?: string; url?: string } = {};
    if (!name.trim()) newErrors.name = "Name is required";
    if (!url.trim()) newErrors.url = "URL is required";
    else {
      try {
        new URL(url);
      } catch {
        newErrors.url = "Please enter a valid URL";
      }
    }
    if (selectedEvents.length === 0) {
      setErrors({ ...newErrors, url: newErrors.url || "Select at least one event" });
      return;
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const created = await createWebhook(supabase, {
      name: name.trim(),
      url: url.trim(),
      events: selectedEvents,
      secret: secret.trim() || undefined,
    });

    if (created) {
      setWebhooks((prev) => [created, ...prev]);
      showToast(MESSAGES.WEBHOOK_CREATED);
    }

    resetForm();
    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    await deleteWebhook(supabase, deletingId);
    setWebhooks((prev) => prev.filter((w) => w.id !== deletingId));
    showToast(MESSAGES.WEBHOOK_DELETED);
    setDeletingId(null);
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    await toggleWebhook(supabase, id, isActive);
    setWebhooks((prev) =>
      prev.map((w) => (w.id === id ? { ...w, is_active: isActive } : w))
    );
  };

  const handleTest = async (webhook: WebhookType) => {
    setTestingId(webhook.id);
    const success = await sendTestWebhook(supabase, webhook);
    showToast(success ? MESSAGES.WEBHOOK_TEST_SENT : "Test webhook failed");
    setTestingId(null);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed right-4 top-4 z-50 rounded-lg bg-green-600 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Webhooks
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Receive HTTP callbacks when events happen in your workspace
          </p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="shrink-0">
          <Plus size={16} />
          Add Webhook
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800"
            />
          ))}
        </div>
      ) : webhooks.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
          <Webhook size={32} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No webhooks configured yet. Add one to get started.
          </p>
          <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
            For Slack: Use your Slack incoming webhook URL. Events will be formatted as Slack messages.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {webhooks.map((hook) => (
            <div
              key={hook.id}
              className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      {hook.name}
                    </h3>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        hook.is_active
                          ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                          : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      {hook.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <ExternalLink size={10} />
                    <span className="truncate">{hook.url}</span>
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {hook.events.map((event) => (
                      <span
                        key={event}
                        className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                      >
                        {event}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleTest(hook)}
                    disabled={testingId === hook.id}
                    className="rounded p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-500 dark:hover:bg-blue-900/20"
                    title="Send test"
                  >
                    {testingId === hook.id ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <Send size={14} />
                    )}
                  </button>
                  <button
                    onClick={() => handleToggle(hook.id, !hook.is_active)}
                    className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                      hook.is_active ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"
                    }`}
                    title={hook.is_active ? "Deactivate" : "Activate"}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                        hook.is_active ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                  <button
                    onClick={() => handleDelete(hook.id)}
                    className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); resetForm(); }}
        title="Add Webhook"
      >
        <div className="space-y-4">
          <Input
            label="Name"
            placeholder="e.g., Slack Notifications"
            value={name}
            onChange={(e) => { setName(e.target.value); if (errors.name) setErrors({}); }}
            error={errors.name}
          />
          <Input
            label="URL"
            placeholder="https://example.com/webhook"
            value={url}
            onChange={(e) => { setUrl(e.target.value); if (errors.url) setErrors({}); }}
            error={errors.url}
          />
          <Input
            label="Secret (optional)"
            placeholder="Used to sign requests"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Events
            </label>
            <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 p-3 dark:border-gray-700">
              <div className="space-y-2">
                {WEBHOOK_EVENTS.map((event) => (
                  <label
                    key={event}
                    className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                  >
                    <input
                      type="checkbox"
                      checked={selectedEvents.includes(event)}
                      onChange={() => toggleEvent(event)}
                      className="h-4 w-4 rounded border-gray-300 text-navo-blue focus:ring-navo-blue"
                    />
                    {event}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
            <Button
              variant="secondary"
              onClick={() => { setDialogOpen(false); resetForm(); }}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Create Webhook</Button>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={!!deletingId}
        onClose={() => setDeletingId(null)}
        title="Delete Webhook"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Are you sure you want to delete this webhook? It will stop receiving events.
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
