export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  end_date: string | null;
  end_time: string | null;
  type: string;
  entity_type: string | null;
  entity_id: string | null;
  created_by: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCalendarEventInput {
  title: string;
  description?: string;
  event_date: string;
  event_time?: string;
  end_date?: string;
  end_time?: string;
  type?: string;
  entity_type?: string;
  entity_id?: string;
}

export interface UpdateCalendarEventInput {
  title?: string;
  description?: string;
  event_date?: string;
  event_time?: string;
  end_date?: string;
  end_time?: string;
  type?: string;
  entity_type?: string;
  entity_id?: string;
}
