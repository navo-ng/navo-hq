"use client";

const THEMES = [
  { id: "blue", label: "Blue", color: "#0064F0" },
  { id: "green", label: "Green", color: "#32C85A" },
  { id: "purple", label: "Purple", color: "#8b5cf6" },
  { id: "orange", label: "Orange", color: "#f97316" },
  { id: "red", label: "Red", color: "#ef4444" },
  { id: "teal", label: "Teal", color: "#14b8a6" },
];

export function ThemeColorPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  return (
    <div className="flex gap-3">
      {THEMES.map(theme => (
        <button
          key={theme.id}
          onClick={() => onChange(theme.id)}
          className={`group relative h-10 w-10 rounded-full transition-transform ${
            value === theme.id ? "scale-110 ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-900" : "hover:scale-105"
          }`}
          style={{ backgroundColor: theme.color }}
          title={theme.label}
        >
          {value === theme.id && (
            <span className="absolute inset-0 flex items-center justify-center text-white text-lg">✓</span>
          )}
        </button>
      ))}
    </div>
  );
}
