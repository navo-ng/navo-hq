"use client";

import { useState, useEffect } from "react";
import {
  GripVertical,
  Eye,
  EyeOff,
  Save,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  fetchWidgets,
  saveWidgets,
  WIDGET_TYPES,
  DashboardWidget,
} from "@/lib/data/dashboard-widgets";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/hooks/useToast";
import { MESSAGES } from "@/lib/utils/messages";

interface WidgetCustomizerProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function WidgetCustomizer({
  open,
  onClose,
  onSaved,
}: WidgetCustomizerProps) {
  const [widgets, setWidgets] = useState<
    { widget_type: string; is_visible: boolean; position: number }[]
  >([]);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClient();
  const { showToast } = useToast();

  useEffect(() => {
    if (!open) return;

    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });

    fetchWidgets(supabase).then((existing) => {
      if (existing.length > 0) {
        setWidgets(
          existing.map((w) => ({
            widget_type: w.widget_type,
            is_visible: w.is_visible,
            position: w.position,
          }))
        );
      } else {
        setWidgets(
          WIDGET_TYPES.map((wt) => ({
            widget_type: wt.type,
            is_visible: true,
            position: 0,
          })).map((w, i) => ({ ...w, position: i }))
        );
      }
    });
  }, [open, supabase]);

  const toggleWidget = (type: string) => {
    setWidgets((prev) =>
      prev.map((w) =>
        w.widget_type === type ? { ...w, is_visible: !w.is_visible } : w
      )
    );
  };

  const moveWidget = (type: string, direction: "up" | "down") => {
    setWidgets((prev) => {
      const idx = prev.findIndex((w) => w.widget_type === type);
      if (idx === -1) return prev;
      const newIdx = direction === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next.map((w, i) => ({ ...w, position: i }));
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const success = await saveWidgets(supabase, widgets);
    setSaving(false);

    if (success) {
      showToast({ title: MESSAGES.WIDGETS_SAVED, type: "success" });
      onSaved();
      onClose();
    } else {
      showToast({ title: "Failed to save layout", type: "error" });
    }
  };

  const getWidgetLabel = (type: string) =>
    WIDGET_TYPES.find((w) => w.type === type)?.label || type;

  const getWidgetDescription = (type: string) =>
    WIDGET_TYPES.find((w) => w.type === type)?.description || "";

  return (
    <Dialog open={open} onClose={onClose} title="Customize Dashboard" maxWidth="md">
      <div className="space-y-3">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Toggle widgets on/off and drag to reorder your dashboard layout.
        </p>

        <div className="space-y-2">
          {widgets.map((widget, idx) => (
            <div
              key={widget.widget_type}
              className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => moveWidget(widget.widget_type, "up")}
                  disabled={idx === 0}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                >
                  <GripVertical size={14} className="rotate-90" />
                </button>
                <button
                  onClick={() => moveWidget(widget.widget_type, "down")}
                  disabled={idx === widgets.length - 1}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                >
                  <GripVertical size={14} className="-rotate-90" />
                </button>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {getWidgetLabel(widget.widget_type)}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {getWidgetDescription(widget.widget_type)}
                </p>
              </div>

              <button
                onClick={() => toggleWidget(widget.widget_type)}
                className={`rounded-lg p-2 transition-colors ${
                  widget.is_visible
                    ? "text-navo-green bg-navo-green-light dark:bg-emerald-900/20"
                    : "text-gray-400 bg-gray-100 dark:bg-gray-800"
                }`}
              >
                {widget.is_visible ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save size={14} />
            {saving ? "Saving..." : "Save Layout"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
