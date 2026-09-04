"use client";

import { Calendar as CalendarIcon, Trash2, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarEvent } from "@/types/calendar";

interface CalendarEventCardProps {
  event: CalendarEvent;
  onEdit?: (event: CalendarEvent) => void;
  onDelete?: (eventId: string) => void;
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  meeting: "#0064F0",
  deadline: "#EF4444",
  milestone: "#10B981",
  event: "#8B5CF6",
  reminder: "#F59E0B",
  external: "#6366f1",
};

function formatEventTime(event: CalendarEvent): string {
  if (!event.event_time) return "All day";
  const time = event.event_time.slice(0, 5);
  if (event.end_time) {
    return `${time} - ${event.end_time.slice(0, 5)}`;
  }
  return time;
}

export function CalendarEventCard({
  event,
  onEdit,
  onDelete,
}: CalendarEventCardProps) {
  const color = EVENT_TYPE_COLORS[event.type] || "#6B7280";

  return (
    <div className="group flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-3 transition-all hover:shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div
        className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full"
        style={{ backgroundColor: color }}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
            {event.title}
          </h4>
           <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <button
                onClick={() => onEdit(event)}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
              >
                <Edit size={14} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => { if (confirm("Delete this event?")) onDelete(event.id); }}
                className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
        {event.description && (
          <p className="mt-0.5 line-clamp-1 text-xs text-gray-500 dark:text-gray-400">
            {event.description}
          </p>
        )}
        <div className="mt-1 flex items-center gap-2">
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <CalendarIcon size={12} />
            {formatEventTime(event)}
          </span>
          <Badge color={color}>{event.type === "external" ? "Google Calendar" : event.type}</Badge>
        </div>
      </div>
    </div>
  );
}
