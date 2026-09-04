"use client";

import { useState, useEffect } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ExternalCalendar {
  id: string;
  name: string;
  url: string;
  color: string;
  is_active: boolean;
}

interface ExternalCalendarDialogProps {
  open: boolean;
  onClose: () => void;
}

const COLOR_OPTIONS = [
  "#6366f1", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#ef4444",
];

export function ExternalCalendarDialog({ open, onClose }: ExternalCalendarDialogProps) {
  const [calendars, setCalendars] = useState<ExternalCalendar[]>([]);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!open) return;
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      const { data } = await supabase
        .from("external_calendars")
        .select("*")
        .eq("user_id", userData.user.id)
        .order("created_at", { ascending: false });
      setCalendars(data || []);
    }
    load();
  }, [open, supabase]);

  const handleAdd = async () => {
    if (!name.trim() || !url.trim()) return;
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { setLoading(false); return; }

    await supabase.from("external_calendars").insert({
      user_id: userData.user.id,
      name: name.trim(),
      url: url.trim(),
      color,
    });

    setName("");
    setUrl("");
    setColor(COLOR_OPTIONS[0]);
    setLoading(false);

    const { data } = await supabase
      .from("external_calendars")
      .select("*")
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false });
    setCalendars(data || []);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("external_calendars").delete().eq("id", id);
    setCalendars(prev => prev.filter(c => c.id !== id));
  };

  return (
    <Dialog open={open} onClose={onClose} title="External Calendars" maxWidth="md">
      <div className="space-y-4">
        {calendars.length > 0 && (
          <div className="space-y-2">
            {calendars.map(cal => (
              <div key={cal.id} className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: cal.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{cal.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{cal.url}</p>
                </div>
                <button onClick={() => handleDelete(cal.id)} className="rounded p-1 text-gray-400 hover:text-red-500">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
          <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">Add Google Calendar</p>
          <div className="space-y-3">
            <Input label="Calendar Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="My Google Calendar" />
            <Input label="iCal URL" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://calendar.google.com/calendar/ical/..." />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Color</label>
              <div className="flex gap-2">
                {COLOR_OPTIONS.map(c => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`h-6 w-6 rounded-full ${color === c ? "ring-2 ring-offset-2 ring-gray-400" : ""}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <Button onClick={handleAdd} disabled={loading || !name.trim() || !url.trim()}>
              {loading ? "Adding..." : "Add Calendar"}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
