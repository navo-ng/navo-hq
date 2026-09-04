"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/reports/time", label: "Time Reports" },
  { href: "/reports/velocity", label: "Velocity" },
  { href: "/reports/burndown", label: "Burndown" },
];

export default function ReportTabs() {
  const pathname = usePathname();

  return (
    <div className="mb-6 border-b border-gray-200 dark:border-gray-800">
      <nav className="flex gap-1 -mb-px">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
                isActive
                  ? "border-navo-blue text-navo-blue"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
