"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, ChevronLeft, ChevronRight, LayoutGrid, List, Download, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalendarEventCard } from "@/components/calendar/CalendarEventCard";
import { CreateEventDialog } from "@/components/calendar/CreateEventDialog";
import { CalendarEvent, CreateCalendarEventInput, UpdateCalendarEventInput } from "@/types/calendar";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/lib/hooks/useToast";
import {
  fetchEventsForMonth,
  createEvent,
  updateEvent,
  deleteEvent,
} from "@/lib/data/calendar";
import { generateICS, downloadICS, generateCalendarSubscriptionUrl } from "@/lib/utils/ics";
import { MESSAGES } from "@/lib/utils/messages";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay();
}

function formatDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function CalendarPage() {
  const { showToast } = useToast();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const handler = (e: MediaQueryListEvent | MediaQueryList) =>
      setViewMode(e.matches ? "list" : "grid");
    handler(mq);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const supabase = createClient();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, [supabase]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      const data = await fetchEventsForMonth(supabase, year, month);
      if (!cancelled) {
        setEvents(data);
        setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [supabase, year, month]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const event of events) {
      if (!map[event.event_date]) {
        map[event.event_date] = [];
      }
      map[event.event_date].push(event);
    }
    return map;
  }, [events]);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = new Date();
  const todayStr = formatDateKey(today.getFullYear(), today.getMonth() + 1, today.getDate());

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const selectedDateEvents = selectedDate ? eventsByDate[selectedDate] || [] : [];

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1));
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month, 1));
    setSelectedDate(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(todayStr);
  };

  const handleCreateEvent = async (input: CreateCalendarEventInput) => {
    const event = await createEvent(supabase, input);
    if (event) {
      setEvents((prev) => [...prev, event]);
    }
  };

  const handleUpdateEvent = async (eventId: string, input: UpdateCalendarEventInput) => {
    const updated = await updateEvent(supabase, eventId, input);
    if (updated) {
      setEvents((prev) => prev.map((e) => (e.id === eventId ? updated : e)));
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    await deleteEvent(supabase, eventId);
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    setCreateDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setCreateDialogOpen(false);
    setEditingEvent(null);
  };

  const handleExportICS = () => {
    const icsEvents = events.map((event) => ({
      title: event.title,
      start: event.event_date + (event.event_time ? `T${event.event_time}` : "T00:00:00"),
      end: event.end_date
        ? event.end_date + (event.end_time ? `T${event.end_time}` : "T23:59:59")
        : undefined,
      description: event.description || undefined,
      id: event.id,
    }));
    const icsContent = generateICS(icsEvents);
    downloadICS(icsContent, "navo-calendar.ics");
  };

  const handleSubscribe = async () => {
    if (!userId) return;
    const baseUrl = window.location.origin;
    const url = generateCalendarSubscriptionUrl(baseUrl, userId);
    await navigator.clipboard.writeText(url);
    showToast({ title: MESSAGES.CALENDAR_URL_COPIED, type: "success" });
  };

  const monthName = currentDate.toLocaleString("default", { month: "long" });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Calendar
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage your schedule and events
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="shrink-0">
          <Plus size={16} />
          New Event
        </Button>
        <Button onClick={handleExportICS} variant="secondary" className="shrink-0">
          <Download size={16} />
          Export .ics
        </Button>
        <Button onClick={handleSubscribe} variant="secondary" className="shrink-0">
          <Link size={16} />
          Subscribe
        </Button>
        <div className="flex shrink-0 items-center rounded-lg border border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 transition-colors ${
              viewMode === "grid"
                ? "bg-navo-blue text-white"
                : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 transition-colors ${
              viewMode === "list"
                ? "bg-navo-blue text-white"
                : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={prevMonth}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ChevronLeft size={18} />
              </button>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {monthName} {year}
              </h2>
              <button
                onClick={nextMonth}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ChevronRight size={18} />
              </button>
            </div>
            <button
              onClick={goToToday}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              Today
            </button>
          </div>

          {viewMode === "grid" ? (
            <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-800">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="bg-gray-50 py-2 text-center text-xs font-medium text-gray-500 dark:bg-gray-900 dark:text-gray-400"
                >
                  {day}
                </div>
              ))}
              {events.length === 0 && (
                <div className="col-span-7 py-12 text-center text-sm text-gray-400 dark:text-gray-500">
                  No events this month
                </div>
              )}
              {calendarDays.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} className="bg-white dark:bg-gray-900" />;
                }
                const dateKey = formatDateKey(year, month, day);
                const dayEvents = eventsByDate[dateKey] || [];
                const isToday = dateKey === todayStr;
                const isSelected = dateKey === selectedDate;

                return (
                  <button
                    key={dateKey}
                    onClick={() => setSelectedDate(dateKey)}
                    className={`relative min-h-[48px] sm:min-h-[72px] bg-white p-1 text-left transition-colors dark:bg-gray-900 ${
                      isSelected
                        ? "bg-navo-blue/5 ring-1 ring-navo-blue"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                        isToday
                          ? "bg-navo-blue text-white"
                          : "text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {day}
                    </span>
                    <div className="mt-0.5 space-y-0.5">
                      {dayEvents.slice(0, 2).map((event) => (
                        <div
                          key={event.id}
                          className="truncate rounded px-1 py-0.5 text-[10px] font-medium text-white hidden sm:block"
                          style={{
                            backgroundColor:
                              event.type === "meeting"
                                ? "#0064F0"
                                : event.type === "deadline"
                                ? "#EF4444"
                                : event.type === "milestone"
                                ? "#10B981"
                                : "#8B5CF6",
                          }}
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <span className="block text-center text-[10px] text-gray-400">
                          +{dayEvents.length - 2} more
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {events.length === 0 ? (
                <p className="py-12 text-center text-sm text-gray-400">
                  No events this month
                </p>
              ) : (
                Object.keys(eventsByDate)
                  .sort()
                  .map((dateKey) => (
                    <div key={dateKey}>
                      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        {new Date(dateKey + "T00:00:00").toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </h4>
                      <div className="space-y-2">
                        {eventsByDate[dateKey].map((event) => (
                          <CalendarEventCard
                            key={event.id}
                            event={event}
                            onEdit={handleEditEvent}
                            onDelete={handleDeleteEvent}
                          />
                        ))}
                      </div>
                    </div>
                  ))
              )}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
            {selectedDate
              ? new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })
              : "Upcoming Events"}
          </h3>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800"
                />
              ))}
            </div>
          ) : selectedDate ? (
            selectedDateEvents.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">
                No events on this day
              </p>
            ) : (
              <div className="space-y-2">
                {selectedDateEvents.map((event) => (
                  <CalendarEventCard
                    key={event.id}
                    event={event}
                    onEdit={handleEditEvent}
                    onDelete={handleDeleteEvent}
                  />
                ))}
              </div>
            )
          ) : (
            <div className="space-y-2">
              {events.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-400">
                  No upcoming events
                </p>
              ) : (
                events.slice(0, 5).map((event) => (
                  <CalendarEventCard
                    key={event.id}
                    event={event}
                    onEdit={handleEditEvent}
                    onDelete={handleDeleteEvent}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <CreateEventDialog
        key={editingEvent?.id || selectedDate || 'new'}
        open={createDialogOpen}
        onClose={handleCloseDialog}
        onCreate={handleCreateEvent}
        onUpdate={handleUpdateEvent}
        editingEvent={editingEvent}
        selectedDate={selectedDate || undefined}
      />
    </div>
  );
}
