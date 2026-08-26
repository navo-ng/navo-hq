"use client";

import { useState, useEffect } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CalendarEvent, CreateCalendarEventInput, UpdateCalendarEventInput } from "@/types/calendar";

interface CreateEventDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (input: CreateCalendarEventInput) => void;
  onUpdate?: (eventId: string, input: UpdateCalendarEventInput) => void;
  editingEvent?: CalendarEvent | null;
  selectedDate?: string;
}

const EVENT_TYPES = [
  { value: "meeting", label: "Meeting" },
  { value: "deadline", label: "Deadline" },
  { value: "milestone", label: "Milestone" },
  { value: "event", label: "Event" },
  { value: "reminder", label: "Reminder" },
];

export function CreateEventDialog({
  open,
  onClose,
  onCreate,
  onUpdate,
  editingEvent,
  selectedDate,
}: CreateEventDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [type, setType] = useState("event");
  const [errors, setErrors] = useState<{ title?: string; event_date?: string }>({});

  useEffect(() => {
    if (editingEvent) {
      setTitle(editingEvent.title);
      setDescription(editingEvent.description || "");
      setEventDate(editingEvent.event_date);
      setEventTime(editingEvent.event_time || "");
      setEndDate(editingEvent.end_date || "");
      setEndTime(editingEvent.end_time || "");
      setType(editingEvent.type);
    } else {
      resetForm();
      if (selectedDate) {
        setEventDate(selectedDate);
      }
    }
  }, [editingEvent, selectedDate, open]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setEventDate("");
    setEventTime("");
    setEndDate("");
    setEndTime("");
    setType("event");
    setErrors({});
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      setErrors({ title: "Title is required" });
      return;
    }

    if (!eventDate) {
      setErrors({ event_date: "Date is required" });
      return;
    }

    if (editingEvent && onUpdate) {
      onUpdate(editingEvent.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        event_date: eventDate,
        event_time: eventTime || undefined,
        end_date: endDate || undefined,
        end_time: endTime || undefined,
        type,
      });
    } else {
      onCreate({
        title: title.trim(),
        description: description.trim() || undefined,
        event_date: eventDate,
        event_time: eventTime || undefined,
        end_date: endDate || undefined,
        end_time: endTime || undefined,
        type,
      });
    }

    resetForm();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editingEvent ? "Edit Event" : "Create Event"}
      maxWidth="lg"
    >
      <div className="space-y-4">
        <Input
          label="Title"
          placeholder="Event title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (errors.title) setErrors({});
          }}
          error={errors.title}
        />

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Description
          </label>
          <textarea
            placeholder="Add details..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-navo-blue focus:outline-none focus:ring-1 focus:ring-navo-blue dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <Select
          label="Type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          options={EVENT_TYPES}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Start Date"
            type="date"
            value={eventDate}
            onChange={(e) => {
              setEventDate(e.target.value);
              if (errors.event_date) setErrors({});
            }}
            error={errors.event_date}
          />
          <Input
            label="Start Time"
            type="time"
            value={eventTime}
            onChange={(e) => setEventTime(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <Input
            label="End Time"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {editingEvent ? "Update Event" : "Create Event"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
