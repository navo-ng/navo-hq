import { SupabaseClient } from "@supabase/supabase-js";
import {
  CalendarEvent,
  CreateCalendarEventInput,
  UpdateCalendarEventInput,
} from "@/types/calendar";
import { logActivity } from "./log-activity";

function mapEvent(row: Record<string, unknown>): CalendarEvent {
  return {
    id: row.id as string,
    title: row.title as string,
    description: row.description as string | null,
    event_date: row.event_date as string,
    event_time: row.event_time as string | null,
    end_date: row.end_date as string | null,
    end_time: row.end_time as string | null,
    type: row.type as string,
    entity_type: row.entity_type as string | null,
    entity_id: row.entity_id as string | null,
    created_by: row.created_by as string,
    is_archived: row.is_archived as boolean,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function fetchEvents(
  supabase: SupabaseClient,
  filters?: {
    start_date?: string;
    end_date?: string;
    type?: string;
  }
): Promise<CalendarEvent[]> {
  let query = supabase
    .from("calendar_events")
    .select("*")
    .eq("is_archived", false)
    .order("event_date", { ascending: true });

  if (filters?.start_date) {
    query = query.gte("event_date", filters.start_date);
  }

  if (filters?.end_date) {
    query = query.lte("event_date", filters.end_date);
  }

  if (filters?.type) {
    query = query.eq("type", filters.type);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching calendar events:", error);
    return [];
  }

  return (data || []).map(mapEvent);
}

export async function fetchEventsForMonth(
  supabase: SupabaseClient,
  year: number,
  month: number
): Promise<CalendarEvent[]> {
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  return fetchEvents(supabase, { start_date: startDate, end_date: endDate });
}

export async function createEvent(
  supabase: SupabaseClient,
  input: CreateCalendarEventInput
): Promise<CalendarEvent | null> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  if (!userId) {
    console.error("No authenticated user");
    return null;
  }

  const { data, error } = await supabase
    .from("calendar_events")
    .insert({
      title: input.title,
      description: input.description || null,
      event_date: input.event_date,
      event_time: input.event_time || null,
      end_date: input.end_date || null,
      end_time: input.end_time || null,
      type: input.type || "event",
      entity_type: input.entity_type || null,
      entity_id: input.entity_id || null,
      created_by: userId,
    })
    .select("*")
    .single();

  if (error) {
    console.error("Error creating calendar event:", error);
    return null;
  }

  logActivity({
    supabase,
    action: "create",
    entityType: "event",
    entityId: data.id,
    entityName: data.title,
    userId,
  });

  return mapEvent(data);
}

export async function updateEvent(
  supabase: SupabaseClient,
  eventId: string,
  input: UpdateCalendarEventInput
): Promise<CalendarEvent | null> {
  const update: Record<string, unknown> = {};
  if (input.title !== undefined) update.title = input.title;
  if (input.description !== undefined) update.description = input.description || null;
  if (input.event_date !== undefined) update.event_date = input.event_date;
  if (input.event_time !== undefined) update.event_time = input.event_time || null;
  if (input.end_date !== undefined) update.end_date = input.end_date || null;
  if (input.end_time !== undefined) update.end_time = input.end_time || null;
  if (input.type !== undefined) update.type = input.type;
  if (input.entity_type !== undefined) update.entity_type = input.entity_type || null;
  if (input.entity_id !== undefined) update.entity_id = input.entity_id || null;

  const { data, error } = await supabase
    .from("calendar_events")
    .update(update)
    .eq("id", eventId)
    .select("*")
    .single();

  if (error) {
    console.error("Error updating calendar event:", error);
    return null;
  }

  logActivity({
    supabase,
    action: "update",
    entityType: "event",
    entityId: eventId,
    entityName: data.title,
  });

  return mapEvent(data);
}

export async function deleteEvent(
  supabase: SupabaseClient,
  eventId: string
): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("calendar_events")
    .update({ is_archived: true })
    .eq("id", eventId);

  if (error) {
    console.error("Error deleting calendar event:", error);
  }

  logActivity({
    supabase,
    action: "archive",
    entityType: "event",
    entityId: eventId,
    entityName: "event",
    userId: userData.user?.id,
  });
}
