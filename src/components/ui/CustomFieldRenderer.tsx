"use client";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CustomFieldDefinition } from "@/lib/data/custom-fields";

interface CustomFieldRendererProps {
  definition: CustomFieldDefinition;
  value: string | null;
  onChange: (value: string) => void;
}

export function CustomFieldRenderer({
  definition,
  value,
  onChange,
}: CustomFieldRendererProps) {
  switch (definition.field_type) {
    case "text":
      return (
        <Input
          label={definition.name}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter ${definition.name.toLowerCase()}`}
        />
      );

    case "number":
      return (
        <Input
          label={definition.name}
          type="number"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter ${definition.name.toLowerCase()}`}
        />
      );

    case "date":
      return (
        <Input
          label={definition.name}
          type="date"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case "select":
      return (
        <Select
          label={definition.name}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Select ${definition.name.toLowerCase()}`}
          options={(definition.options || []).map((opt) => ({
            value: opt,
            label: opt,
          }))}
        />
      );

    case "checkbox":
      return (
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {definition.name}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value === "true"}
              onChange={(e) => onChange(e.target.checked ? "true" : "false")}
              className="h-4 w-4 rounded border-gray-300 text-navo-blue focus:ring-navo-blue"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {value === "true" ? "Yes" : "No"}
            </span>
          </div>
        </div>
      );

    default:
      return null;
  }
}
