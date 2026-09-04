export interface ParsedEvent {
  uid: string;
  summary: string;
  description?: string;
  dtstart: string;
  dtend?: string;
  location?: string;
}

export function parseICS(icsContent: string): ParsedEvent[] {
  const events: ParsedEvent[] = [];
  const lines = icsContent.replace(/\r\n /g, "").split(/\r?\n/);

  let currentEvent: Partial<ParsedEvent> | null = null;

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      currentEvent = { uid: "" };
    } else if (line === "END:VEVENT" && currentEvent) {
      if (currentEvent.uid && currentEvent.summary && currentEvent.dtstart) {
        events.push(currentEvent as ParsedEvent);
      }
      currentEvent = null;
    } else if (currentEvent) {
      const [key, ...valueParts] = line.split(":");
      const value = valueParts.join(":");
      const baseKey = key.split(";")[0];

      switch (baseKey) {
        case "UID":
          currentEvent.uid = value;
          break;
        case "SUMMARY":
          currentEvent.summary = value;
          break;
        case "DESCRIPTION":
          currentEvent.description = value.replace(/\\n/g, "\n").replace(/\\,/g, ",");
          break;
        case "DTSTART":
          currentEvent.dtstart = parseICSDate(value);
          break;
        case "DTEND":
          currentEvent.dtend = parseICSDate(value);
          break;
        case "LOCATION":
          currentEvent.location = value;
          break;
      }
    }
  }

  return events;
}

function parseICSDate(dateStr: string): string {
  const cleaned = dateStr.replace("Z", "");
  if (cleaned.length === 8) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6, 8)}`;
  }
  if (cleaned.length >= 15) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6, 8)}T${cleaned.slice(9, 11)}:${cleaned.slice(11, 13)}:${cleaned.slice(13, 15)}`;
  }
  return dateStr;
}
