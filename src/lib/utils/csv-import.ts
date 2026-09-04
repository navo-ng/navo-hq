export interface CSVImportRow {
  title: string;
  description?: string;
  priority?: string;
  status?: string;
  assignee?: string;
  due_date?: string;
  project?: string;
}

export function parseCSV(csvText: string): string[][] {
  const lines = csvText.split("\n").filter((line) => line.trim());
  return lines.map((line) => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  });
}

export function mapCSVToTasks(
  rows: string[][],
  headers: string[]
): CSVImportRow[] {
  const headerMap: Record<string, number> = {};
  headers.forEach((h, i) => {
    const normalized = h
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "_");
    headerMap[normalized] = i;
  });

  return rows
    .map((row) => ({
      title:
        row[headerMap["title"]] ||
        row[headerMap["name"]] ||
        "Untitled Task",
      description: row[headerMap["description"]] || undefined,
      priority: row[headerMap["priority"]] || undefined,
      status: row[headerMap["status"]] || undefined,
      assignee:
        row[headerMap["assignee"]] ||
        row[headerMap["assigned_to"]] ||
        undefined,
      due_date:
        row[headerMap["due_date"]] ||
        row[headerMap["deadline"]] ||
        undefined,
      project: row[headerMap["project"]] || undefined,
    }))
    .filter((row) => row.title && row.title !== "Untitled Task");
}

export function validateImportRows(rows: CSVImportRow[]): {
  valid: CSVImportRow[];
  errors: string[];
} {
  const errors: string[] = [];
  const valid: CSVImportRow[] = [];

  rows.forEach((row, i) => {
    if (!row.title || row.title.trim() === "") {
      errors.push(`Row ${i + 2}: Missing title`);
    } else {
      valid.push(row);
    }
  });

  return { valid, errors };
}
