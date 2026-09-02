interface ICSEvent {
  title: string;
  start: string;
  end?: string;
  description?: string;
  id: string;
}

export function generateICS(events: ICSEvent[]): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//NAVO HQ//EN",
    "CALSCALE:GREGORIAN",
  ];

  for (const event of events) {
    const start = new Date(event.start);
    const dtStart = start.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    let dtEnd: string;
    if (event.end) {
      dtEnd = new Date(event.end).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    } else {
      const end = new Date(start);
      end.setHours(end.getHours() + 1);
      dtEnd = end.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    }

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${event.id}@navo-hq`);
    lines.push(`DTSTART:${dtStart}`);
    lines.push(`DTEND:${dtEnd}`);
    lines.push(`SUMMARY:${event.title}`);
    if (event.description) lines.push(`DESCRIPTION:${event.description.replace(/\n/g, "\\n")}`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function downloadICS(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}